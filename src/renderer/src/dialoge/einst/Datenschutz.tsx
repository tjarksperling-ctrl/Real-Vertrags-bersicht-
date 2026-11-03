/**
 * Einstellungen → Datenschutz (Bild 16 v1): was gespeichert wird, KI-Regeln, Kunde löschen, Auskunft (Art. 15),
 * alte Kunden zum Löschen vorschlagen, Protokoll und Verarbeitungsverzeichnis (Vorlage).
 */
import { useEffect, useMemo, useState } from 'react';
import { alteKunden, formatHeute, heuteDatum, letzteAenderung, type Bestand, type Einstellungen, type Kunde, type Uebersicht } from '../../../../shared';
import type { ProtokollEintrag } from '../../../../shared/api';
import { Avatar, Schalter, Sym } from '../../komponenten/ui';
import { Rueckfrage } from '../Rueckfrage';
import { wann } from '../../seiten/Start';

export interface DatenschutzProps {
  e: Einstellungen;
  onChange: (teil: Partial<Einstellungen>) => void;
  bestand: Bestand;
  benutzer: string;
  onKundeLoeschen: (k: Kunde) => Promise<void>;
  ladeUebersichten: (kundeId: string) => Promise<{ u: Uebersicht; daten: Uint8Array }[]>;
  onProtokoll: (was: string, kundeId?: string) => void;
}

const JAHRE = [3, 5, 10, 15];

/** Vorlage für das Verzeichnis von Verarbeitungstätigkeiten (Art. 30 DSGVO) – zum Ergänzen durch die Agentur. */
export function verzeichnisVorlage(datum: string): string {
  return `Verzeichnis von Verarbeitungstätigkeiten (Art. 30 DSGVO) – VORLAGE
Stand: ${datum} · Bitte von der Agentur prüfen und ergänzen.

1. Verantwortlicher
   Name der Agentur, Anschrift, Inhaber: …
   Datenschutzbeauftragte/r (falls benannt): …

2. Bezeichnung der Verarbeitung
   Vertragsübersicht für Kunden (Versicherungen, Sparen & Investieren, Darlehen,
   Altersvorsorge & Familienabsicherung) – Desktop-App „Vertragsübersicht“.

3. Zweck
   Beratung und Betreuung von Kunden; Gegenüberstellung bestehender und vorgeschlagener
   Verträge („Aktuell“/„Neu“); Erstellung von PDF-Übersichten für den Kunden.

4. Kategorien betroffener Personen
   Kunden und Interessenten der Agentur.

5. Kategorien personenbezogener Daten
   – Name des Kunden (einzige Angabe zur Person)
   – Vertragsangaben: Vertragsname, Bemerkung, Beträge, Zahlweise, Laufzeiten
   – Interne Aufgaben (Text, Fälligkeit, Zuständigkeit)
   Keine Anschrift, kein Geburtsdatum, keine Bankverbindung, keine Gesundheitsdaten als eigene Felder.
   Hinweis: In Bemerkungen keine besonderen Kategorien (Art. 9 DSGVO) eintragen.

6. Empfänger
   Keine Weitergabe. PDFs/Dateien nur an den Kunden selbst. Optional KI-Auswertung von Unterlagen:
   Name wird vor dem Versand entfernt, Unterlagen werden nicht gespeichert (Anbieter: …).

7. Speicherort / Drittland
   Arbeitsplatzrechner der Agentur (Benutzerprofil); ab Abgleich: Microsoft 365 der Agentur (EU).
   Drittlandübermittlung: … (abhängig vom Microsoft-365-Vertrag bzw. KI-Anbieter)

8. Löschfristen
   Löschung auf Wunsch des Kunden (Einstellungen → Datenschutz → Kunde endgültig löschen).
   Hinweis zur Prüfung, wenn ein Kunde seit … Jahren unverändert ist. Protokoll: 12 Monate.

9. Technische und organisatorische Maßnahmen (Art. 32 DSGVO)
   – Zugriff nur mit Agentur-Konto / Windows-Anmeldung
   – Datensparsamkeit: nur der Name als Personenangabe
   – PDF und Desktop-Datei optional mit Passwort (AES-256)
   – Protokoll der Änderungen und Exporte
   – weitere Maßnahmen der Agentur: …
`;
}

/** Kunde aus der Liste wählen (für Löschen und Auskunft). */
function KundeWahl({ kunden, titel, onWahl, onZu }: { kunden: Kunde[]; titel: string; onWahl: (k: Kunde) => void; onZu: () => void }) {
  const [q, setQ] = useState('');
  const l = kunden.filter((k) => k.name.toLocaleLowerCase('de').includes(q.trim().toLocaleLowerCase('de')));
  return (
    <div className="kw" role="dialog" aria-label={titel} onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), onZu())}>
      <div className="kw-k">
        <b>{titel}</b>
        <span className="spacer" />
        <button type="button" className="au-x knopf-rein" aria-label="Schließen" onClick={onZu}>
          <Sym n="x" />
        </button>
      </div>
      <label className="search kw-s">
        <Sym n="search" />
        <input autoFocus placeholder="Kunde suchen" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && l[0] && onWahl(l[0])} />
      </label>
      <div className="kw-l">
        {l.map((k) => (
          <button type="button" key={k.id} className="kw-i knopf-rein" onClick={() => onWahl(k)}>
            <Avatar id={k.id} name={k.name} /> {k.name}
          </button>
        ))}
        {l.length === 0 && <div className="au-leer">Kein Kunde gefunden</div>}
      </div>
    </div>
  );
}

export function DatenschutzSeite(p: DatenschutzProps) {
  const [wahl, setWahl] = useState<null | 'loeschen' | 'auskunft'>(null);
  const [loeschen, setLoeschen] = useState<Kunde | null>(null);
  const [protokoll, setProtokoll] = useState<ProtokollEintrag[] | null>(null);
  const [alles, setAlles] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  useEffect(() => {
    void window.api.protokollLaden().then(setProtokoll);
  }, []);

  const alte = useMemo(
    () => alteKunden(p.bestand.kunden.map((k) => ({ ...k, geaendert: letzteAenderung(p.bestand, k.id) })), heuteDatum(), p.e.aufbewahrungJahre),
    [p.bestand, p.e.aufbewahrungJahre],
  );

  const auskunft = async (k: Kunde) => {
    setWahl(null);
    setLaeuft(true);
    setMeldung(null);
    const liste = await p.ladeUebersichten(k.id);
    const prot = (protokoll ?? (await window.api.protokollLaden())).filter((x) => x.kunde === k.name);
    const datum = formatHeute();
    const dateiDatum = heuteDatum();
    const name = k.name.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '');
    const r = await window.api.pdfErstellen({
      dateiname: `Auskunft_${name}_${dateiDatum}.pdf`,
      daten: liste[0]?.daten ?? new Uint8Array(),
      kunde: k.name,
      optionen: { inhalt: 'beide', vergleich: false, vorteile: true, ersparnis: true, titel: true },
      datum,
      auskunft: {
        kunde: { name: k.name, erstellt: k.erstellt, geaendert: k.geaendert },
        uebersichten: liste.map((x) => x.daten),
        protokoll: prot,
        erstelltVon: p.benutzer,
      },
    });
    setLaeuft(false);
    if (r.fehler) setMeldung(`Auskunft fehlgeschlagen: ${r.fehler}`);
    else if (r.pfad) {
      setMeldung(`Auskunft gespeichert · ${r.seiten ?? '?'} Seiten`);
      p.onProtokoll('Auskunft (Art. 15) erstellt', k.id);
    }
  };

  const zeilen = (protokoll ?? []).slice(0, alles ? 200 : 3);
  return (
    <>
      <p className="kk-lead">So wenig Daten wie möglich. Hier erledigen Sie Löschen, Auskunft und Dokumentation.</p>
      <div className="ex-sec">
        <span className="kk-n">1</span>Was gespeichert wird
      </div>
      <div className="ds-kacheln">
        {(
          [
            ['user', 'Kundendaten', 'nur der Name'],
            ['file', 'Unterlagen', 'nur ausgewertet'],
            ['cloud', 'Speicherort', 'dieser PC (lokal)'],
            ['key', 'Zugriff', 'nur Ihr Windows-Konto'],
          ] as const
        ).map(([s, b, t]) => (
          <div className="ds-k" key={b}>
            <span className="es-sym">
              <Sym n={s} />
            </span>
            <div>
              <b>{b}</b>
              <small>{t}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="ex-sec">
        <span className="kk-n">2</span>KI
      </div>
      <div className="ex-box">
        <div className="optrow">
          <div>
            Kundenname vor dem Versand an die KI entfernen<small>Die KI sieht nur Verträge und Beträge, nie den Namen</small>
          </div>
          <span className="kk-fest">
            <Sym n="lock" /> immer an
          </span>
        </div>
        <div className="optrow">
          <div>
            Hinweis vor jedem KI-Import zeigen<small>Erinnert daran, dass Unterlagen zum KI-Anbieter übertragen werden · wirkt mit dem KI-Import</small>
          </div>
          <Schalter an={p.e.kiHinweis} onChange={(an) => p.onChange({ kiHinweis: an })} />
        </div>
      </div>
      <div className="ex-sec">
        <span className="kk-n">3</span>Löschen und Auskunft
      </div>
      <div className="ex-box ds-wahl-box">
        <div className="optrow">
          <div>
            Kunde endgültig löschen<small>Entfernt alle Übersichten und Aufgaben des Kunden · mit Rückfrage</small>
          </div>
          <button type="button" className="btn ds-rot" onClick={() => setWahl('loeschen')}>
            <Sym n="trash" /> Kunde wählen …
          </button>
        </div>
        <div className="optrow">
          <div>
            Auskunft für einen Kunden<small>Alle gespeicherten Daten eines Kunden als PDF (Art. 15 DSGVO)</small>
          </div>
          <button type="button" className="btn" disabled={laeuft} onClick={() => setWahl('auskunft')}>
            <Sym n="pdf" /> {laeuft ? 'Wird erstellt …' : 'Kunde wählen …'}
          </button>
        </div>
        <div className="optrow">
          <div>
            Alte Kunden zum Löschen vorschlagen<small>Nur ein Hinweis auf der Startseite – gelöscht wird nichts automatisch</small>
          </div>
          <span className="ds-frist">
            ohne Änderung seit{' '}
            <label className="kk-input ds-sel">
              <select value={p.e.aufbewahrungJahre} aria-label="Jahre ohne Änderung" onChange={(e) => p.onChange({ aufbewahrungJahre: Number(e.target.value) })}>
                {JAHRE.map((j) => (
                  <option key={j} value={j}>
                    {j} Jahren
                  </option>
                ))}
              </select>
              <Sym n="down" />
            </label>
          </span>
          <Schalter an={p.e.alteKundenVorschlagen} onChange={(an) => p.onChange({ alteKundenVorschlagen: an })} />
        </div>
        {p.e.alteKundenVorschlagen && alte.length > 0 && (
          <div className="ds-alt">
            {alte.map((k) => (
              <div key={k.id} className="ds-alt-i">
                <Avatar id={k.id} name={k.name} cls="mini" /> <b>{k.name}</b>
                <small>zuletzt geändert {letzteAenderung(p.bestand, k.id).slice(0, 4)}</small>
                <span className="spacer" />
                <button type="button" className="btn ghost rot" onClick={() => setLoeschen(p.bestand.kunden.find((x) => x.id === k.id) ?? null)}>
                  Löschen …
                </button>
              </div>
            ))}
          </div>
        )}
        {wahl && (
          <KundeWahl
            kunden={p.bestand.kunden}
            titel={wahl === 'loeschen' ? 'Welchen Kunden löschen?' : 'Auskunft für welchen Kunden?'}
            onZu={() => setWahl(null)}
            onWahl={(k) => {
              if (wahl === 'loeschen') {
                setWahl(null);
                setLoeschen(k);
              } else void auskunft(k);
            }}
          />
        )}
      </div>
      {meldung && <div className="ds-meldung">{meldung}</div>}
      <div className="ex-sec">
        <span className="kk-n">4</span>Protokoll und Dokumentation
      </div>
      <div className={`ex-box ds-prot ${alles ? 'alles' : ''}`}>
        {zeilen.map((x, i) => (
          <div className="ds-p" key={i}>
            <Avatar id={x.wer} name={x.wer} />
            <b>{x.wer}</b>
            <span className="ds-p-w">{[x.kunde, x.uebersicht].filter(Boolean).join(' · ')}</span>
            <span className="ds-p-t">{x.was}</span>
            <span className="spacer"></span>
            <small>{wann(x.zeit)}</small>
          </div>
        ))}
        {protokoll && protokoll.length === 0 && <div className="au-leer">Noch keine Einträge</div>}
        <div className="ds-p-fuss">
          <button type="button" className="btn ghost" disabled={!protokoll || protokoll.length <= 3} onClick={() => setAlles(!alles)}>
            {alles ? 'Weniger zeigen' : `Ganzes Protokoll öffnen … (${protokoll?.length ?? 0})`}
          </button>
          <span className="ds-hint">wird 12 Monate aufbewahrt</span>
          <button
            type="button"
            className="btn ds-r"
            onClick={async () => {
              const pfad = await window.api.textSpeichern('Verarbeitungsverzeichnis_Vertragsuebersicht.txt', verzeichnisVorlage(formatHeute()));
              if (pfad) setMeldung('Verarbeitungsverzeichnis (Vorlage) gespeichert');
            }}
          >
            <Sym n="file" /> Verarbeitungsverzeichnis (Vorlage)
          </button>
        </div>
      </div>
      {loeschen && (
        <Rueckfrage
          titel={`„${loeschen.name}“ endgültig löschen?`}
          text={`Alle ${p.bestand.uebersichten.filter((u) => u.kundeId === loeschen.id).length} Übersichten mit Aufgaben werden gelöscht. Das lässt sich nicht rückgängig machen. Bereits gespeicherte PDFs und Desktop-Dateien bleiben, wo sie sind.`}
          knopf="Endgültig löschen"
          bestaetigen={loeschen.name}
          onAbbrechen={() => setLoeschen(null)}
          onOk={async () => {
            const k = loeschen;
            setLoeschen(null);
            await p.onKundeLoeschen(k);
            setMeldung(`„${k.name}“ wurde gelöscht`);
            setProtokoll(await window.api.protokollLaden());
          }}
        />
      )}
    </>
  );
}

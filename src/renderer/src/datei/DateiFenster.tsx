/**
 * Eigenes Fenster für eine Desktop-Datei `.vtue` (Bild 10 v1): Passwortabfrage, dann der gespeicherte
 * Stand nur zum Ansehen mit Aktuell/Neu/Nebeneinander, „In der App öffnen“, „Als neue Übersicht
 * übernehmen“ und PDF.
 */
import { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import { leseBestand, type Kunde } from '../../../shared';
import type { DateiInfo } from '../../../shared/api';
import { gespeichertLaden } from '../daten/speicher';
import { darstellungAnwenden } from '../daten/darstellung';
import { EditorSeite, type Ansicht } from '../seiten/Editor';
import { Sym } from '../komponenten/ui';
import { DateiSymbol, uhrzeitLang } from '../dialoge/Desktop';

export function DateiFenster({ schluessel }: { schluessel: string }) {
  const [info, setInfo] = useState<DateiInfo | null | 'fehlt'>(null);
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [pw, setPw] = useState('');
  const [zeigen, setZeigen] = useState(false);
  const [falsch, setFalsch] = useState(false);
  const [vergessen, setVergessen] = useState(false);
  const [pruefe, setPruefe] = useState(false);
  const [ansicht, setAnsicht] = useState<Ansicht>('aktuell');
  const [seitdem, setSeitdem] = useState<string | null>(null);
  const [meldung, setMeldung] = useState<string | null>(null);

  const laden = (daten: Uint8Array) => {
    const d = new Y.Doc();
    Y.applyUpdate(d, daten);
    setDoc(d);
  };

  useEffect(() => {
    void (async () => {
      const g = await gespeichertLaden();
      darstellungAnwenden(g.einstellungen.darstellung);
      const i = await window.api.dateiInfo(schluessel);
      if (!i) return setInfo('fehlt');
      setInfo(i);
      document.title = `${i.dateiname} — Vertragsübersicht`;
      if (!i.verschluesselt) {
        const daten = await window.api.dateiEntsperren(schluessel);
        if (daten) laden(daten);
      }
      // Hinweis „in der App seitdem geändert“
      const b = await window.api.laden('bestand');
      if (b) {
        const bd = new Y.Doc();
        Y.applyUpdate(bd, b);
        const u = leseBestand(bd).uebersichten.find((x) => x.id === i.uebersichtId);
        if (!u) setSeitdem('Diese Übersicht gibt es in der App nicht mehr');
        else if (u.geaendert > i.gespeichert) setSeitdem('In der App wurde die Übersicht seitdem geändert');
        else setSeitdem('Entspricht dem Stand in der App');
      }
    })();
  }, [schluessel]);

  const kunde: Kunde | null = useMemo(() => (info && info !== 'fehlt' ? { id: info.kundeId, name: info.kunde, erstellt: info.gespeichert, geaendert: info.gespeichert } : null), [info]);

  useEffect(() => {
    if (!meldung) return;
    const t = setTimeout(() => setMeldung(null), 5000);
    return () => clearTimeout(t);
  }, [meldung]);

  if (info === null) return <div className="laedt" />;
  if (info === 'fehlt') return <div className="dk-fehler">Die Datei ist nicht mehr da.</div>;

  if (!doc) {
    const oeffnen = async () => {
      if (!pw) return;
      setPruefe(true);
      const daten = await window.api.dateiEntsperren(schluessel, pw);
      setPruefe(false);
      if (daten) laden(daten);
      else {
        setFalsch(true);
        setPw('');
      }
    };
    return (
      <div className="dk-fenster">
        <div className="dk-pw">
          <DateiSymbol groesse="gross" schloss />
          <h2>Geschützte Datei öffnen</h2>
          <p className="dk-name">{info.dateiname}</p>
          <p className="dk-meta">
            Gespeichert am {uhrzeitLang(new Date(info.gespeichert))} von {info.von}
          </p>
          <div className="dk-feld">
            <label htmlFor="dk-pw">Passwort</label>
            <div className={`kk-input ds-mask fokus ${falsch ? 'fehler' : ''}`}>
              <input
                id="dk-pw"
                className="eingabe-rein"
                type={zeigen ? 'text' : 'password'}
                autoFocus
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value);
                  setFalsch(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void oeffnen();
                  if (e.key === 'Escape') window.close();
                }}
              />
              <button type="button" className="pw-eye knopf-rein" title="Passwort anzeigen" onClick={() => setZeigen(!zeigen)}>
                <Sym n={zeigen ? 'eyeoff' : 'eye'} />
              </button>
            </div>
            {falsch && <div className="dk-falsch">Das Passwort stimmt nicht. Groß- und Kleinschreibung beachten.</div>}
          </div>
          <div className="dk-hilfe">
            <button type="button" className="ds-link knopf-rein" onClick={() => setVergessen(!vergessen)}>
              Passwort vergessen?
            </button>
            {vergessen && <span className="dk-tip">Das Original liegt weiter in der Kundenakte. Von dort einfach neu speichern.</span>}
          </div>
          <div className="dk-btns">
            <button type="button" className="btn" onClick={() => window.close()}>
              Abbrechen
            </button>
            <button type="button" className="btn primary" disabled={!pw || pruefe} onClick={() => void oeffnen()}>
              {pruefe ? 'Prüfe …' : 'Öffnen'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app ds-app">
      <EditorSeite
        doc={doc}
        kunde={kunde!}
        katalog={null}
        ansicht={ansicht}
        setAnsicht={setAnsicht}
        benutzer={info.von}
        nurLesen
        kopf={(tabs, pdf) => (
          <>
            <div className="toolbar v1 ds-tb">
              <DateiSymbol groesse="mittel" schloss={info.verschluesselt} />
              <div className="crumb">
                <span className="kunde">{info.kunde} · gespeicherter Stand</span>
                <h1>{info.titel}</h1>
              </div>
              {tabs}
              <span className="spacer"></span>
              <button
                type="button"
                className="btn"
                title="Öffnet diese Übersicht in der App mit dem heutigen Stand"
                onClick={() => void window.api.anApp({ art: 'uebersichtOeffnen', uebersichtId: info.uebersichtId, kundeId: info.kundeId })}
              >
                <Sym n="ext" /> In der App öffnen
              </button>
              <button
                type="button"
                className="btn"
                title="Legt in der Kundenakte eine neue Vertragsübersicht mit genau diesem Stand an"
                onClick={() => {
                  void window.api.anApp({
                    art: 'alsNeuUebernehmen',
                    meta: { kunde: info.kunde, kundeId: info.kundeId, uebersichtId: info.uebersichtId, titel: info.titel, gespeichert: info.gespeichert, von: info.von },
                    daten: Y.encodeStateAsUpdate(doc),
                  });
                  setMeldung('In der App als neue Übersicht angelegt');
                }}
              >
                <Sym n="copy" /> Als neue Übersicht übernehmen
              </button>
              <button type="button" className="btn primary" onClick={pdf}>
                <Sym n="pdf" /> PDF / E-Mail
              </button>
            </div>
            <div className="ds-banner">
              <Sym n="lock" />
              <span>
                <b>Gespeicherter Stand vom {uhrzeitLang(new Date(info.gespeichert))}</b> · nur ansehen{info.verschluesselt ? ' · mit Passwort geschützt' : ''}
              </span>
              <span className="spacer"></span>
              {seitdem && (
                <span className="ds-seit">
                  <Sym n="info" /> {seitdem}
                </span>
              )}
            </div>
          </>
        )}
      />
      {meldung && (
        <div className="ub-toast" role="status">
          <Sym n="check" />
          <span>{meldung}</span>
        </div>
      )}
    </div>
  );
}

/**
 * „Unterlagen per KI einlesen“ (Bild 6 v1, M5b): Unterlagen hinzufügen → Microsoft 365 Copilot wertet aus →
 * Prüf-Dialog (jede Zeile annehmen, ändern oder abwählen) → Übernahme nach „Aktuell“.
 * Datenschutz: kein Kundenname im Auftrag oder Dateinamen; Unterlagen werden nicht gespeichert.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BEREICH_NAME,
  BEREICH_TYPEN,
  formatBetrag,
  kiAntwortLesen,
  kiUebernehmen,
  schonVorhanden,
  leseBetrag,
  untergruppeFinden,
  type BereichTyp,
  type Editor,
  type KiVertrag,
  type Uebersicht,
  type Zahlweise,
} from '../../../shared';
import type { KiDatei, MsKonto } from '../../../shared/api';
import { Sym } from '../komponenten/ui';
import { ZAHLWEISE_OPTIONEN } from '../editor/spalten';
import { useMsKonto } from './einst/Outlook';

const KLASSE: Record<BereichTyp, string> = { VERS: 'vers', SPAR: 'spar', DARL: 'darl', AV: 'av' };
const BETRAG_TITEL: Record<BereichTyp, string> = { VERS: 'Beitrag', SPAR: 'Sparrate', DARL: 'Rate', AV: 'Beitrag' };

interface Unterlage {
  id: number;
  name: string;
  groesse: number;
  status: 'wartet' | 'laeuft' | 'ok' | 'fehler';
  fehler?: string;
  anzahl?: number;
}

/** Ziel je Vertrag: vorhandene Untergruppe (id) oder neue (Name). */
type Ziel = { id: string } | { neu: string };

const kb = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toLocaleString('de-DE', { maximumFractionDigits: 1 })} MB`);

export function KiImportDialog({
  editor,
  u,
  kunde,
  hinweisZeigen,
  onSchliessen,
  onFertig,
  onEinstellungen,
}: {
  editor: Editor;
  u: Uebersicht;
  kunde: string;
  hinweisZeigen: boolean;
  onSchliessen: () => void;
  onFertig: (text: string) => void;
  onEinstellungen: () => void;
}) {
  const [konto, setKonto] = useMsKonto();
  const [hinweisOk, setHinweisOk] = useState(!hinweisZeigen);
  const [unterlagen, setUnterlagen] = useState<Unterlage[]>([]);
  const [vertraege, setVertraege] = useState<KiVertrag[]>([]);
  const [ziele, setZiele] = useState<Map<number, Ziel>>(new Map());
  const [ueber, setUeber] = useState(false);
  const warteschlange = useRef<{ id: number; d: KiDatei }[]>([]);
  const laeuft = useRef(false);
  const naechsteId = useRef(1);
  const naechsteNr = useRef(1);

  const aktuell = u.aktuell;
  const zielVon = (v: KiVertrag): Ziel => ziele.get(v.nr) ?? (untergruppeFinden(aktuell, v) ? { id: untergruppeFinden(aktuell, v)!.id } : { neu: v.untergruppe || 'Weitere' });

  const abarbeiten = async () => {
    if (laeuft.current) return;
    laeuft.current = true;
    while (warteschlange.current.length) {
      const { id, d } = warteschlange.current.shift()!;
      setUnterlagen((l) => l.map((x) => (x.id === id ? { ...x, status: 'laeuft' } : x)));
      const r = await window.api.kiAuswerten(d);
      if (!r.ok || !r.text) {
        setUnterlagen((l) => l.map((x) => (x.id === id ? { ...x, status: 'fehler', fehler: r.fehler ?? 'Auswertung fehlgeschlagen' } : x)));
        continue;
      }
      try {
        const neu = kiAntwortLesen(r.text, d.name, naechsteNr.current).map((v) => schonVorhanden(editor.lesen().aktuell, v));
        naechsteNr.current += neu.length;
        setVertraege((alt) => [...alt, ...neu]);
        setUnterlagen((l) => l.map((x) => (x.id === id ? { ...x, status: 'ok', anzahl: neu.length } : x)));
      } catch (e) {
        setUnterlagen((l) => l.map((x) => (x.id === id ? { ...x, status: 'fehler', fehler: e instanceof Error ? e.message : String(e) } : x)));
      }
    }
    laeuft.current = false;
  };

  const hinzufuegen = (l: KiDatei[]) => {
    if (!l.length) return;
    const neu = l.map((d) => ({ id: naechsteId.current++, d }));
    setUnterlagen((alt) => [...alt, ...neu.map(({ id, d }) => ({ id, name: d.name, groesse: d.daten.length, status: 'wartet' as const }))]);
    warteschlange.current.push(...neu);
    if (hinweisOk && konto?.angemeldet) void abarbeiten();
  };
  // nach „Verstanden“ bzw. Anmeldung die Warteschlange starten
  useEffect(() => {
    if (hinweisOk && konto?.angemeldet && warteschlange.current.length) void abarbeiten();
  }, [hinweisOk, konto?.angemeldet]);

  const ablegen = async (e: React.DragEvent) => {
    e.preventDefault();
    setUeber(false);
    const l: KiDatei[] = [];
    for (const f of Array.from(e.dataTransfer.files)) l.push({ name: f.name, daten: new Uint8Array(await f.arrayBuffer()) });
    hinzufuegen(l);
  };

  const aendern = (nr: number, teil: Partial<KiVertrag>) => setVertraege((l) => l.map((v) => (v.nr === nr ? { ...v, ...teil, unsicher: v.unsicher.filter((f) => !(f in teil) && !(f === 'betrag' && 'betrag' in teil)) } : v)));
  const ausgewaehlt = vertraege.filter((v) => v.auswahl);
  const unsicher = vertraege.filter((v) => v.auswahl && v.unsicher.length).length;
  const jeBereich = useMemo(() => BEREICH_TYPEN.map((t) => [t, vertraege.filter((v) => v.bereich === t)] as const).filter(([, l]) => l.length), [vertraege]);
  const beschaeftigt = unterlagen.some((x) => x.status === 'wartet' || x.status === 'laeuft');

  const uebernehmen = () => {
    const n = kiUebernehmen(editor, vertraege, zielVon);
    onFertig(`${n} ${n === 1 ? 'Vertrag' : 'Verträge'} aus den Unterlagen in „Aktuell“ übernommen`);
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !beschaeftigt && onSchliessen()}>
      <div className="sheet ki1" role="dialog" aria-label="Unterlagen per KI einlesen" onKeyDown={(e) => e.key === 'Escape' && !beschaeftigt && onSchliessen()}>
        <header>
          <h2>
            <Sym n="sparkles" /> Unterlagen per KI einlesen
          </h2>
          <p>
            {kunde} · {u.titel || 'Vertragsübersicht'} · Ergebnis wird in „Aktuell“ eingetragen
          </p>
        </header>
        <div className="body">
          <div className="ki1-grid">
            <div className="ki1-links">
              <div className="ex-sec">Unterlagen</div>
              {unterlagen.length > 0 && (
                <div className="kd-liste">
                  {unterlagen.map((x) => (
                    <div className="kd" key={x.id} title={x.fehler}>
                      <Sym n="file" />
                      <div className="t">
                        <b>{x.name}</b>
                        <small className={x.status === 'fehler' ? 'ki-fehler' : ''}>
                          {kb(x.groesse)} ·{' '}
                          {x.status === 'wartet'
                            ? 'wartet'
                            : x.status === 'laeuft'
                              ? 'wird ausgewertet …'
                              : x.status === 'ok'
                                ? `ausgewertet${x.anzahl !== undefined ? ` · ${x.anzahl} ${x.anzahl === 1 ? 'Vertrag' : 'Verträge'}` : ''}`
                                : x.fehler}
                        </small>
                      </div>
                      {x.status === 'ok' && (
                        <span className="ok">
                          <Sym n="check" />
                        </span>
                      )}
                      {x.status === 'laeuft' && <span className="ki-dreht" aria-label="läuft" />}
                      {x.status === 'fehler' && (
                        <span className="ki-x">
                          <Sym n="x" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div
                className={`kdrop ${ueber ? 'ueber' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setUeber(true);
                }}
                onDragLeave={() => setUeber(false)}
                onDrop={(e) => void ablegen(e)}
              >
                <Sym n="upload" />
                <span>
                  {unterlagen.length ? 'Weitere PDFs oder Scans hierher ziehen' : 'PDFs oder Scans hierher ziehen'}
                  <br />
                  <button type="button" className="knopf-rein ki-waehlen" onClick={async () => hinzufuegen(await window.api.kiDateienWaehlen())}>
                    oder auswählen
                  </button>
                </span>
              </div>
              <div className="ex-sec">Datenschutz</div>
              <div className="kpriv">
                <div>
                  <Sym n="eyeoff" />
                  <span>Der Kundenname wird nicht mitgesendet – weder im Auftrag noch im Dateinamen.</span>
                </div>
                <div>
                  <Sym n="trash" />
                  <span>Unterlagen werden nur ausgewertet und danach verworfen: Sie liegen nur während der Auswertung in Ihrem OneDrive und werden dann endgültig gelöscht.</span>
                </div>
                <div>
                  <Sym n="sparkles" />
                  <span>
                    KI: Microsoft 365 Copilot im Konto der Agentur ·{' '}
                    <button type="button" className="knopf-rein mb-link" onClick={onEinstellungen}>
                      Einstellungen
                    </button>
                  </span>
                </div>
              </div>
            </div>
            <div className="ki1-rechts">
              {!konto ? null : !konto.angemeldet ? (
                <KiAnmelden konto={konto} setKonto={setKonto} onEinstellungen={onEinstellungen} />
              ) : !hinweisOk ? (
                <div className="ki-start">
                  <Sym n="info" />
                  <div>
                    <b>Bevor es losgeht</b>
                    <p>
                      Die Unterlagen werden zur Auswertung an Microsoft 365 Copilot im Microsoft-365-Konto der Agentur gegeben. Die KI kann sich irren – bitte jede Zeile prüfen, bevor
                      Sie übernehmen.
                    </p>
                    <button type="button" className="btn primary" onClick={() => setHinweisOk(true)}>
                      Verstanden
                    </button>
                    <small>Dieser Hinweis lässt sich unter Einstellungen → Datenschutz abschalten.</small>
                  </div>
                </div>
              ) : vertraege.length === 0 ? (
                <div className="ki-start leer">
                  <Sym n="sparkles" />
                  <div>
                    <b>{beschaeftigt ? 'Copilot liest die Unterlagen …' : 'Unterlagen hinzufügen'}</b>
                    <p>
                      {beschaeftigt
                        ? 'Das dauert je Unterlage etwa 10–60 Sekunden. Sie können währenddessen weitere Unterlagen hinzufügen.'
                        : 'Policen, Beitragsrechnungen, Nachträge oder Scans links ablegen. Erkannte Verträge erscheinen hier zur Prüfung.'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="ex-sec ex-sec-row">
                    <span>Erkannte Verträge</span>
                    <small>
                      {vertraege.length} gefunden{unsicher ? ` · ${unsicher} ${unsicher === 1 ? 'Wert' : 'Werte'} bitte prüfen` : ''}
                    </small>
                    <span className="spacer" />
                    <span className="legende">
                      <span className="unsure">86,40 €</span> unsicher · Klick auf einen Wert ändert ihn
                    </span>
                  </div>
                  {jeBereich.map(([t, l]) => (
                    <div className={`kb ${KLASSE[t]}`} key={t}>
                      <div className="kb-kopf">
                        <span className="nr">{BEREICH_TYPEN.indexOf(t) + 1}</span>
                        {BEREICH_NAME[t]}
                        <small>{l.length} erkannt</small>
                      </div>
                      <table className="review1">
                        <colgroup>
                          <col style={{ width: 34 }} />
                          <col style={{ width: '18%' }} />
                          <col />
                          <col style={{ width: '13%' }} />
                          <col style={{ width: '16%' }} />
                          <col style={{ width: '24%' }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th />
                            <th>Vertrag</th>
                            <th>Bemerkung</th>
                            <th className="num">{BETRAG_TITEL[t]}</th>
                            <th>Zahlweise</th>
                            <th>Untergruppe</th>
                          </tr>
                        </thead>
                        <tbody>
                          {l.map((v) => (
                            <Zeile key={v.nr} v={v} ziel={zielVon(v)} ugs={aktuell.bereiche[t].untergruppen} onAendern={(teil) => aendern(v.nr, teil)} onZiel={(z) => setZiele((m) => new Map(m).set(v.nr, z))} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
        <footer>
          <span className="kfuss">
            {vertraege.length > 0 ? (
              <>
                <b>
                  {ausgewaehlt.length} von {vertraege.length}
                </b>{' '}
                ausgewählt · nur ausgewählte Verträge werden übernommen
              </>
            ) : (
              'Nichts wird gespeichert, bevor Sie übernehmen.'
            )}
          </span>
          <span className="spacer" />
          <button type="button" className="btn" onClick={onSchliessen}>
            Abbrechen
          </button>
          <button type="button" className="btn primary" disabled={!ausgewaehlt.length || beschaeftigt} onClick={uebernehmen}>
            <Sym n="check" /> {ausgewaehlt.length === 1 ? '1 Vertrag übernehmen' : `${ausgewaehlt.length} Verträge übernehmen`}
          </button>
        </footer>
      </div>
    </div>
  );
}

function KiAnmelden({ konto, setKonto, onEinstellungen }: { konto: MsKonto; setKonto: (k: MsKonto) => void; onEinstellungen: () => void }) {
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  return (
    <div className="ki-start">
      <Sym n="key" />
      <div>
        <b>Mit Microsoft 365 verbinden</b>
        <p>Der KI-Import nutzt Microsoft 365 Copilot über Ihr Microsoft-Konto. Dafür braucht jede Person eine Lizenz „Microsoft 365 Copilot“.</p>
        {konto.eingerichtet ? (
          <button
            type="button"
            className="btn primary"
            disabled={laeuft}
            onClick={async () => {
              setLaeuft(true);
              const r = await window.api.msAnmelden();
              setLaeuft(false);
              if (r.konto) setKonto(r.konto);
              else setFehler(r.fehler ?? 'Anmeldung fehlgeschlagen');
            }}
          >
            {laeuft ? 'Browser geöffnet …' : 'Bei Microsoft anmelden'}
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={onEinstellungen}>
            Microsoft-Zugang einrichten
          </button>
        )}
        {fehler && <small className="ki-fehler">{fehler}</small>}
      </div>
    </div>
  );
}

function Zeile({ v, ziel, ugs, onAendern, onZiel }: { v: KiVertrag; ziel: Ziel; ugs: { id: string; name: string }[]; onAendern: (t: Partial<KiVertrag>) => void; onZiel: (z: Ziel) => void }) {
  const [betrag, setBetrag] = useState<string | null>(null);
  const u = (f: string) => v.unsicher.includes(f);
  const note = v.hinweis || (v.unsicher.length && v.auswahl ? `Bitte prüfen: ${v.unsicher.map((f) => (f === 'betrag' ? 'Betrag' : f === 'zahlweise' ? 'Zahlweise' : f)).join(', ')}.` : '');
  const neuName = 'neu' in ziel ? ziel.neu : v.untergruppe || 'Weitere';
  const zielWert = 'id' in ziel ? ziel.id : '__neu';
  return (
    <>
      <tr className={`${v.auswahl ? '' : 'off'} ${note ? 'hat-note' : ''}`}>
        <td>
          <button type="button" className="knopf-rein" role="checkbox" aria-checked={v.auswahl} aria-label="übernehmen" onClick={() => onAendern({ auswahl: !v.auswahl })}>
            <span className={`cbx ${v.auswahl ? 'on' : ''}`}>{v.auswahl && <Sym n="check" />}</span>
          </button>
        </td>
        <td className="vn">
          <input className="eingabe-rein ki-feld" aria-label="Vertrag" value={v.name} onChange={(e) => onAendern({ name: e.target.value })} />
        </td>
        <td className="bem">
          <input className="eingabe-rein ki-feld" aria-label="Bemerkung" value={v.bemerkung} onChange={(e) => onAendern({ bemerkung: e.target.value })} />
        </td>
        <td className="num">
          <span className={u('betrag') ? 'unsure' : ''}>
            <input
              className="eingabe-rein ki-feld num"
              aria-label="Betrag"
              value={betrag ?? (v.betrag === null ? '' : formatBetrag(v.betrag))}
              placeholder="–"
              onFocus={(e) => {
                setBetrag(v.betrag === null ? '' : formatBetrag(v.betrag, { mitEuro: false }));
                requestAnimationFrame(() => e.target.select());
              }}
              onChange={(e) => setBetrag(e.target.value)}
              onBlur={() => {
                const c = leseBetrag(betrag ?? '');
                if (c !== undefined) onAendern({ betrag: c });
                setBetrag(null);
              }}
            />
          </span>
        </td>
        <td>
          <span className={u('zahlweise') ? 'unsure' : ''}>
            <select className="sel" aria-label="Zahlweise" value={v.zahlweise} onChange={(e) => onAendern({ zahlweise: e.target.value as Zahlweise })}>
              {ZAHLWEISE_OPTIONEN.map((o) => (
                <option key={o.wert} value={o.wert}>
                  {o.text}
                </option>
              ))}
            </select>
          </span>
        </td>
        <td>
          <select
            className="sel ziel"
            aria-label="Untergruppe"
            value={zielWert}
            onChange={(e) => onZiel(e.target.value === '__neu' ? { neu: neuName } : { id: e.target.value })}
          >
            {ugs.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
            <option value="__neu">Neu: {neuName}</option>
          </select>
        </td>
      </tr>
      {note && (
        <tr className={`note ${v.auswahl ? '' : 'off'}`}>
          <td />
          <td colSpan={5}>
            <span className={v.auswahl ? 'w' : 'i'}>
              <Sym n={v.auswahl ? 'alert' : 'info'} />
              {note}
            </span>
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * Kundenakte (Bild 1b v1): alle Vertragsübersichten eines Kunden, aktueller Stand (Kennzahlen aus der
 * neuesten Übersicht, Fassung „Aktuell“), Aufgaben des Kunden mit Schnell-Eingabe, neue Übersicht.
 */
import { useEffect, useRef, useState } from 'react';
import {
  BEREICH_TYPEN,
  GRUPPEN_TITEL,
  faelligKlasse,
  faelligText,
  fassungSumme,
  formatBetrag,
  formatDatum,
  gruppiere,
  heuteDatum,
  neueAufgabe,
  plusTage,
  type Aufgabe,
  type Bestand,
  type Kunde,
  type Uebersicht,
  type UebersichtInfo,
  type Vorlage,
} from '../../../shared';
import { Avatar, Sym } from '../komponenten/ui';
import { DatumChip } from '../aufgaben/Aufgaben';
import { MAX_PINS } from './Start';

/** Wie viele Übersichten sofort sichtbar sind; ältere per „… anzeigen“. */
const SICHTBAR = 5;

export type NeueArt = { art: 'uebernehmen'; quelle: string } | { art: 'vorlage'; vorlage: Vorlage } | { art: 'leer' };

export interface KundenakteProps {
  kunde: Kunde;
  bestand: Bestand;
  benutzer: string;
  team: string[];
  angepinnt: string[];
  vorlagen: Vorlage[];
  /** Neueste Übersicht (für die Kennzahlen). */
  ladeUebersicht: (id: string) => Promise<Uebersicht | null>;
  onOeffnen: (uebersichtId: string) => void;
  onNeu: (art: NeueArt) => void;
  onPin: (uebersichtId: string, an: boolean) => void;
  onUmgesetzt: (uebersichtId: string, an: boolean) => void;
  onLoeschen: (info: UebersichtInfo) => void;
  onUmbenennen: (name: string) => void;
  onErledigt: (uebersichtId: string, aufgabeId: string, erledigt: boolean) => void;
  onAufgabeAnlegen: (uebersichtId: string, a: Aufgabe) => void;
}

function jahr(iso: string): number {
  return new Date(iso).getFullYear();
}

export function Kundenakte(p: KundenakteProps) {
  const hd = heuteDatum();
  const liste = p.bestand.uebersichten.filter((u) => u.kundeId === p.kunde.id).sort((a, b) => b.erstellt.localeCompare(a.erstellt));
  const neueste = liste[0];
  const [stand, setStand] = useState<Uebersicht | null>(null);
  const [alle, setAlle] = useState(false);
  const [menu, setMenu] = useState<null | 'neu' | string>(null);
  const [erledigtZeigen, setErledigtZeigen] = useState(false);
  const [namenEdit, setNamenEdit] = useState(false);
  const neuesteId = neueste?.id;
  const neuesteGeaendert = neueste?.geaendert;

  useEffect(() => {
    let weg = false;
    if (neuesteId) void p.ladeUebersicht(neuesteId).then((u) => !weg && setStand(u));
    else setStand(null);
    return () => {
      weg = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [neuesteId, neuesteGeaendert]);

  useEffect(() => {
    const zu = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest?.('.mehr-menu')) setMenu(null);
    };
    window.addEventListener('mousedown', zu);
    return () => window.removeEventListener('mousedown', zu);
  }, []);

  const s = stand ? fassungSumme(stand.aktuell) : null;
  const vertraege = stand ? BEREICH_TYPEN.reduce((n, t) => n + (stand.aktuell.bereiche[t].aktiv ? stand.aktuell.bereiche[t].untergruppen.reduce((m, ug) => m + ug.vertraege.length, 0) : 0), 0) : 0;
  const sichtbar = alle ? liste : liste.slice(0, SICHTBAR);
  const aeltere = liste.slice(SICHTBAR);

  const aufgaben = liste.flatMap((u) => (u.aufgaben ?? []).map((a) => ({ ...a, uebersichtId: u.id, uebersicht: u.titel || 'Vertragsübersicht' })));
  const offen = aufgaben.filter((a) => !a.erledigt);
  const erledigt = aufgaben.filter((a) => a.erledigt);
  const voll = p.angepinnt.length >= MAX_PINS;

  return (
    <main className="main">
      <div className="toolbar kunde">
        <Avatar id={p.kunde.id} name={p.kunde.name} cls="big" />
        <div>
          {namenEdit ? (
            <input
              className="titel-feld kunde-name"
              autoFocus
              defaultValue={p.kunde.name}
              aria-label="Name des Kunden"
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value.trim() !== p.kunde.name) p.onUmbenennen(e.target.value);
                setNamenEdit(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') setNamenEdit(false);
              }}
            />
          ) : (
            <h1 title="Doppelklick zum Umbenennen" onDoubleClick={() => setNamenEdit(true)}>
              {p.kunde.name}
            </h1>
          )}
          <div className="datum">
            Kunde seit {jahr(p.kunde.erstellt)} · {liste.length} {liste.length === 1 ? 'Vertragsübersicht' : 'Vertragsübersichten'}
          </div>
        </div>
        <span className="spacer"></span>
        <button type="button" className="btn" disabled title="KI-Import folgt mit Meilenstein 5b (KI-Konto nötig)">
          <Sym n="sparkles" /> Mit Unterlagen starten
        </button>
        <span className="mehr-menu">
          <button type="button" className="btn primary" aria-haspopup="menu" aria-expanded={menu === 'neu'} onClick={() => setMenu(menu === 'neu' ? null : 'neu')}>
            <Sym n="plus" /> Neue Vertragsübersicht <Sym n="down" />
          </button>
          {menu === 'neu' && (
            <div className="ub-menu neu-menu" role="menu">
              {neueste && (
                <button type="button" role="menuitem" className="ub-mi knopf-rein" onClick={() => p.onNeu({ art: 'uebernehmen', quelle: neueste.id })}>
                  <Sym n="copy" />
                  <span>
                    Aus letzter Übersicht übernehmen
                    <small>„Neu“ von „{neueste.titel || 'Vertragsübersicht'}“ wird „Aktuell“</small>
                  </span>
                </button>
              )}
              {p.vorlagen.map((v) => (
                <button key={v.id} type="button" role="menuitem" className="ub-mi knopf-rein" onClick={() => p.onNeu({ art: 'vorlage', vorlage: v })}>
                  <Sym n={v.symbol || 'tpl'} />
                  <span>
                    Mit Vorlage „{v.name}“<small>Bereiche und Untergruppen vorbereitet</small>
                  </span>
                </button>
              ))}
              <button type="button" role="menuitem" className="ub-mi knopf-rein" onClick={() => p.onNeu({ art: 'leer' })}>
                <Sym n="file" />
                <span>Leer starten</span>
              </button>
            </div>
          )}
        </span>
      </div>
      <div className="content narrow start">
        {neueste && (
          <>
            <div className="section-title">
              Aktueller Stand<span className="hdr-note">laut „{neueste.titel || 'Vertragsübersicht'}“, Fassung Aktuell</span>
            </div>
            <div className="kpis">
              <div className="kpi">
                <small>Beitrag pro Monat</small>
                <b>{formatBetrag(s?.gesamtMonat ?? neueste.gesamtAktuell)}</b>
              </div>
              <div className="kpi">
                <small>Gesamtvermögen</small>
                <b>{s ? formatBetrag(s.bereiche.SPAR.aktiv ? s.bereiche.SPAR.gesamtvermoegen : 0) : '…'}</b>
              </div>
              <div className="kpi">
                <small>Restschuld</small>
                <b>{s ? formatBetrag(s.bereiche.DARL.aktiv ? s.bereiche.DARL.restschuld : 0) : '…'}</b>
              </div>
              <div className="kpi">
                <small>Verträge</small>
                <b>{s ? vertraege : '…'}</b>
              </div>
            </div>
          </>
        )}
        <div className="grid-kunde">
          <div>
            <div className="section-title">
              Vertragsübersichten<span className="spacer"></span>
              <span className="hdr-note">Beitrag pro Monat</span>
            </div>
            <div className="panel">
              {sichtbar.map((u, i) => {
                const d = u.gesamtNeu - u.gesamtAktuell;
                const nAuf = (u.aufgaben ?? []).filter((a) => !a.erledigt).length;
                const pin = p.angepinnt.includes(u.id);
                return (
                  <div
                    key={u.id}
                    className={`urow klickbar ${i === 0 ? 'first' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => p.onOeffnen(u.id)}
                    onKeyDown={(e) => e.key === 'Enter' && p.onOeffnen(u.id)}
                  >
                    <div className="umain">
                      <b>
                        <span className="u-titel">{u.titel || 'Vertragsübersicht'}</span>
                        {pin && <Sym n="pin" cls="i pin-mini" />}
                        {u.eingefroren && (
                          <span className="frost" title={`Zuletzt als Datei gespeichert am ${formatDatum(u.eingefroren.slice(0, 10))}`}>
                            <Sym n="snow" /> eingefroren
                          </span>
                        )}
                      </b>
                      <small>
                        {u.umgesetzt ? (
                          <>
                            <span className="badge">Umgesetzt</span> umgesetzt {formatDatum(u.umgesetzt)}
                          </>
                        ) : (
                          <>
                            <span className="badge blue">In Arbeit</span> seit {formatDatum(u.erstellt.slice(0, 10))}
                          </>
                        )}
                        {nAuf > 0 && (
                          <span className="auf">
                            · <Sym n="tasks" /> {nAuf} {nAuf === 1 ? 'Aufgabe' : 'Aufgaben'}
                          </span>
                        )}
                      </small>
                    </div>
                    <div className="cval">
                      <small>Aktuell</small>
                      {formatBetrag(u.gesamtAktuell)}
                    </div>
                    <div className="cval">
                      <small>Neu</small>
                      {formatBetrag(u.gesamtNeu)}
                    </div>
                    <div className="cdiff">
                      {d === 0 ? <span className="diff0">gleich</span> : <span className={`badge ${d < 0 ? 'green' : 'orange'}`}>{formatBetrag(d, { mitVorzeichen: true })}</span>}
                    </div>
                    <span className="go">
                      <Sym n="chev" />
                    </span>
                    <span className="go on">
                      Öffnen <Sym n="chev" />
                    </span>
                    <span className="mehr-menu u-mehr" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <button type="button" className="knopf-rein u-mehr-k" aria-label="Weitere" aria-haspopup="menu" onClick={() => setMenu(menu === u.id ? null : u.id)}>
                        <Sym n="more" />
                      </button>
                      {menu === u.id && (
                        <div className="ub-menu" role="menu">
                          <button
                            type="button"
                            role="menuitem"
                            className="ub-mi knopf-rein"
                            disabled={!pin && voll}
                            title={!pin && voll ? `Höchstens ${MAX_PINS} Übersichten` : undefined}
                            onClick={() => {
                              setMenu(null);
                              p.onPin(u.id, !pin);
                            }}
                          >
                            <Sym n="pin" />
                            <span>{pin ? 'Nicht mehr anpinnen' : 'Anpinnen'}</span>
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="ub-mi knopf-rein"
                            onClick={() => {
                              setMenu(null);
                              p.onUmgesetzt(u.id, !u.umgesetzt);
                            }}
                          >
                            <Sym n="check" />
                            <span>{u.umgesetzt ? 'Wieder „In Arbeit“' : 'Als umgesetzt markieren'}</span>
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="ub-mi knopf-rein rot"
                            onClick={() => {
                              setMenu(null);
                              p.onLoeschen(u);
                            }}
                          >
                            <Sym n="trash" />
                            <span>Übersicht löschen …</span>
                          </button>
                        </div>
                      )}
                    </span>
                  </div>
                );
              })}
              {liste.length === 0 && <div className="au-leer">Noch keine Vertragsübersicht – oben rechts „Neue Vertragsübersicht“.</div>}
              {aeltere.length > 0 && (
                <button type="button" className="tmore knopf-rein" onClick={() => setAlle(!alle)}>
                  <Sym n={alle ? 'up' : 'down'} />{' '}
                  {alle
                    ? 'Ältere ausblenden'
                    : `${aeltere.length} ältere ${aeltere.length === 1 ? 'Übersicht' : 'Übersichten'} anzeigen (${Math.min(...aeltere.map((u) => jahr(u.erstellt)))}–${Math.max(...aeltere.map((u) => jahr(u.erstellt)))})`}
                </button>
              )}
            </div>
          </div>
          <div>
            <div className="section-title">
              Aufgaben<span className="hdr-note">{offen.length} offen</span>
            </div>
            <div className="panel">
              {liste.length > 0 && <SchnellAufgabe heute={hd} benutzer={p.benutzer} team={p.team} uebersichten={liste} onAnlegen={p.onAufgabeAnlegen} />}
              {gruppiere(offen, hd).map((g) => (
                <div key={g.gruppe}>
                  <div className={`tgroup ${g.gruppe === 'ueberfaellig' ? 'rot' : g.gruppe === 'heute' ? 'orange' : ''}`}>
                    <span>{GRUPPEN_TITEL[g.gruppe]}</span>
                    <em>{g.aufgaben.length}</em>
                  </div>
                  {g.aufgaben.map((a) => (
                    <div key={a.id} className="trow klickbar" onClick={() => p.onOeffnen(a.uebersichtId)}>
                      <button
                        type="button"
                        className="box knopf-rein"
                        role="checkbox"
                        aria-checked={false}
                        aria-label="Erledigt"
                        title="Erledigt"
                        onClick={(e) => {
                          e.stopPropagation();
                          p.onErledigt(a.uebersichtId, a.id, true);
                        }}
                      />
                      <div className="tmain">
                        <div className="ttext k">{a.text}</div>
                        <div className="tueb">
                          <Sym n="file" /> {a.uebersicht}
                          {a.bezugName ? ` · ${a.bezugName}` : ''}
                        </div>
                      </div>
                      <div className="tside">
                        {a.prioritaet === 'hoch' && (
                          <span className="prio">
                            <Sym n="flag" /> Hoch
                          </span>
                        )}
                        <span className={`due ${faelligKlasse(a.faellig, hd)}`}>{faelligText(a.faellig, hd)}</span>
                      </div>
                      {a.zustaendig && <Avatar id={a.zustaendig} name={a.zustaendig} cls="mini" title={`zuständig: ${a.zustaendig}`} />}
                    </div>
                  ))}
                </div>
              ))}
              {erledigtZeigen &&
                erledigt.map((a) => (
                  <div key={a.id} className="trow erledigt">
                    <button
                      type="button"
                      className="box on knopf-rein"
                      role="checkbox"
                      aria-checked
                      aria-label="Wieder öffnen"
                      title="Wieder öffnen"
                      onClick={() => p.onErledigt(a.uebersichtId, a.id, false)}
                    >
                      <Sym n="check" />
                    </button>
                    <div className="tmain">
                      <div className="ttext k">{a.text}</div>
                      <div className="tueb">
                        <Sym n="file" /> {a.uebersicht}
                      </div>
                    </div>
                  </div>
                ))}
              {erledigt.length > 0 && (
                <button type="button" className="tmore knopf-rein" onClick={() => setErledigtZeigen(!erledigtZeigen)}>
                  <Sym n="check" /> {erledigtZeigen ? 'Erledigte ausblenden' : `${erledigt.length} erledigte ${erledigt.length === 1 ? 'Aufgabe' : 'Aufgaben'} anzeigen`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/** Schnell-Eingabe wie Bild 1b: Text, dann Chips für Datum, Priorität, Übersicht, Zuständig. */
function SchnellAufgabe({
  heute,
  benutzer,
  team,
  uebersichten,
  onAnlegen,
}: {
  heute: string;
  benutzer: string;
  team: string[];
  uebersichten: UebersichtInfo[];
  onAnlegen: (uebersichtId: string, a: Aufgabe) => void;
}) {
  const [text, setText] = useState('');
  const [faellig, setFaellig] = useState<string | null>(plusTage(heute, 7));
  const [hoch, setHoch] = useState(false);
  const [ziel, setZiel] = useState(uebersichten[0]!.id);
  const [wer, setWer] = useState(benutzer);
  const feld = useRef<HTMLInputElement>(null);
  const personen = [benutzer, ...team.filter((t) => t !== benutzer)];
  const anlegen = () => {
    if (!text.trim()) return feld.current?.focus();
    const a = { ...neueAufgabe(text, faellig, benutzer), zustaendig: wer };
    if (hoch) a.prioritaet = 'hoch';
    onAnlegen(uebersichten.some((u) => u.id === ziel) ? ziel : uebersichten[0]!.id, a);
    setText('');
    setHoch(false);
    feld.current?.focus();
  };
  const zielTitel = uebersichten.find((u) => u.id === ziel)?.titel || 'Vertragsübersicht';
  return (
    <div className="tadd">
      <label className="tin">
        <Sym n="plus" />
        <input
          ref={feld}
          className="tin-feld"
          value={text}
          placeholder="Neue Aufgabe für diesen Kunden"
          aria-label="Neue Aufgabe"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') anlegen();
            if (e.key === 'Escape') setText('');
          }}
        />
      </label>
      <div className="tchips">
        <DatumChip wert={faellig} onChange={setFaellig} leer="Fällig" />
        <button type="button" className={`chip knopf-rein ${hoch ? 'on rot-chip' : ''}`} onClick={() => setHoch(!hoch)}>
          <Sym n="flag" /> {hoch ? 'Hoch' : 'Priorität'}
        </button>
        <label className="chip on sel-chip" title="Zu welcher Übersicht">
          <Sym n="file" /> {zielTitel}
          <select value={ziel} aria-label="Übersicht" onChange={(e) => setZiel(e.target.value)}>
            {uebersichten.map((u) => (
              <option key={u.id} value={u.id}>
                {u.titel || 'Vertragsübersicht'}
              </option>
            ))}
          </select>
        </label>
        <label className="chip sel-chip" title="Zuständig">
          <Avatar id={wer} name={wer} cls="mini" /> {wer}
          <select value={wer} aria-label="Zuständig" onChange={(e) => setWer(e.target.value)}>
            {personen.map((x) => (
              <option key={x} value={x}>
                {x === benutzer ? `${x} (ich)` : x}
              </option>
            ))}
          </select>
        </label>
        <span className="spacer"></span>
        <button type="button" className="btn primary sm" onClick={anlegen}>
          Hinzufügen
        </button>
      </div>
    </div>
  );
}

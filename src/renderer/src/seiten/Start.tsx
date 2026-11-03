/**
 * Startseite (Bild 1 v4): Begrüßung, Schnellstart-Kacheln, Aufgaben aller Kunden nach Fälligkeit,
 * Angepinnt (max. 4) und „Zuletzt bearbeitet“.
 */
import { useMemo, useState } from 'react';
import {
  GRUPPEN_TITEL,
  faelligKlasse,
  faelligText,
  formatBetrag,
  gruppiere,
  heuteDatum,
  vergleicheAufgaben,
  type AufgabeKurz,
  type Aufgabe,
  type Bestand,
  type Kunde,
  type SchnellstartLink,
  type UebersichtInfo,
} from '../../../shared';
import { Avatar, Schalter, Sym } from '../komponenten/ui';
import { AufgabeFormular } from '../aufgaben/Aufgaben';

const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const MAX_PINS = 4;

export function gruss(d = new Date()): string {
  const h = d.getHours();
  return h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
}

export function wann(iso: string, jetzt = new Date()): string {
  const d = new Date(iso);
  const tag = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((tag(jetzt) - tag(d)) / 86400000);
  if (diff === 0) return `heute, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (diff === 1) return 'gestern';
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
}

/** „maklerportal.de“ aus einer Adresse, „App“ für Programme. */
export function linkUnterzeile(l: SchnellstartLink): string {
  if (!/^https?:\/\//i.test(l.ziel)) return 'App';
  try {
    return new URL(l.ziel).hostname.replace(/^www\./, '');
  } catch {
    return l.ziel;
  }
}

export function LinkSymbol({ l }: { l: Pick<SchnellstartLink, 'symbol' | 'farbe'> }) {
  const f = l.farbe ?? '#0a64d0';
  return (
    <span className="sym" style={{ color: f, background: `${f}14` }}>
      <Sym n={l.symbol} />
    </span>
  );
}

export interface StartAufgabe extends AufgabeKurz {
  uebersichtId: string;
  kunde: Kunde;
}

/** Alle offenen Aufgaben aus dem Verzeichnis mit Kunde. */
export function offeneAufgaben(bestand: Bestand): StartAufgabe[] {
  const kunden = new Map(bestand.kunden.map((k) => [k.id, k]));
  const l: StartAufgabe[] = [];
  for (const u of bestand.uebersichten) {
    const k = kunden.get(u.kundeId);
    if (!k) continue;
    for (const a of u.aufgaben ?? []) if (!a.erledigt) l.push({ ...a, uebersichtId: u.id, kunde: k });
  }
  return l;
}

export interface StartProps {
  bestand: Bestand;
  vorname: string;
  benutzer: string;
  team: string[];
  schnellstart: SchnellstartLink[];
  angepinnt: string[];
  hinweisAlteKunden: number;
  onOeffnen: (uebersichtId: string, aufgaben?: boolean) => void;
  onNeuerKunde: () => void;
  onAnpassen: () => void;
  onLink: (l: SchnellstartLink) => void;
  onPin: (uebersichtId: string, an: boolean) => void;
  onErledigt: (uebersichtId: string, aufgabeId: string) => void;
  onAufgabeAnlegen: (uebersichtId: string, a: Aufgabe) => void;
  onAlteKunden: () => void;
  onDateiOeffnen: () => void;
  /** Seite „Aufgaben“ (Seitenleiste): nur die Aufgaben aller Kunden, inkl. „Später“. */
  nurAufgaben?: boolean;
}

export function Start(p: StartProps) {
  const heute = new Date();
  const hd = heuteDatum(heute);
  const kunde = new Map(p.bestand.kunden.map((k) => [k.id, k]));
  const [spaeter, setSpaeter] = useState(!!p.nurAufgaben);
  const [nurMeine, setNurMeine] = useState(false);
  const [formular, setFormular] = useState(false);
  const [ziel, setZiel] = useState('');
  const alleAufgaben = useMemo(() => offeneAufgaben(p.bestand), [p.bestand]);
  const aufgaben = nurMeine ? alleAufgaben.filter((a) => !a.zustaendig || a.zustaendig === p.benutzer) : alleAufgaben;
  const gruppen = gruppiere(aufgaben, hd);
  const nSpaeter = gruppen.find((g) => g.gruppe === 'spaeter')?.aufgaben.length ?? 0;
  const pins = p.angepinnt.map((id) => p.bestand.uebersichten.find((u) => u.id === id)).filter((u): u is UebersichtInfo => !!u && kunde.has(u.kundeId));
  // je Kunde nur die zuletzt bearbeitete Übersicht; Kunden mit angepinnter Übersicht stehen schon oben
  const pinKunden = new Set(pins.map((u) => u.kundeId));
  const gesehen = new Set<string>();
  const zuletzt = p.bestand.uebersichten
    .filter((u) => kunde.has(u.kundeId) && !pinKunden.has(u.kundeId) && !gesehen.has(u.kundeId) && gesehen.add(u.kundeId))
    .slice(0, pins.length ? 5 : 8);
  const voll = pins.length >= MAX_PINS;
  const uebersichtWahl = p.bestand.uebersichten.filter((u) => kunde.has(u.kundeId));

  const naechste = (u: UebersichtInfo) => (u.aufgaben ?? []).filter((a) => !a.erledigt && a.faellig).sort(vergleicheAufgaben)[0];

  const aufgabenSpalte = (
    <div>
      <div className="section-title">
        Aufgaben<span className="spacer"></span>
        <button
          type="button"
          className="btn ghost"
          style={{ padding: 0 }}
          disabled={uebersichtWahl.length === 0}
          onClick={() => {
            setZiel(ziel || uebersichtWahl[0]?.id || '');
            setFormular(true);
          }}
        >
          <Sym n="plus" /> Aufgabe
        </button>
      </div>
      <div className="panel start-aufgaben">
        {formular && (
          <AufgabeFormular
            heute={hd}
            benutzer={p.benutzer}
            team={p.team}
            bezuege={[]}
            kopf={
              <label className="kk-input au-sel">
                <Sym n="file" />
                <select value={ziel} aria-label="Übersicht" onChange={(e) => setZiel(e.target.value)}>
                  {uebersichtWahl.map((u) => (
                    <option key={u.id} value={u.id}>
                      {kunde.get(u.kundeId)!.name} · {u.titel || 'Vertragsübersicht'}
                    </option>
                  ))}
                </select>
                <Sym n="down" />
              </label>
            }
            onAbbrechen={() => setFormular(false)}
            onSpeichern={(a) => {
              if (ziel) p.onAufgabeAnlegen(ziel, a);
              setFormular(false);
            }}
          />
        )}
        {gruppen
          .filter((g) => spaeter || g.gruppe !== 'spaeter')
          .map((g) => (
            <div key={g.gruppe}>
              <div className={`tgroup ${g.gruppe === 'ueberfaellig' ? 'rot' : g.gruppe === 'heute' ? 'orange' : ''}`}>
                <span>{GRUPPEN_TITEL[g.gruppe]}</span>
                <em>{g.aufgaben.length}</em>
              </div>
              {g.aufgaben.map((a) => (
                <div key={a.id} className="trow klickbar" onClick={() => p.onOeffnen(a.uebersichtId, true)}>
                  <button
                    type="button"
                    className="box knopf-rein"
                    role="checkbox"
                    aria-checked={false}
                    aria-label="Erledigt"
                    title="Erledigt"
                    onClick={(e) => {
                      e.stopPropagation();
                      p.onErledigt(a.uebersichtId, a.id);
                    }}
                  />
                  <div className="tmain">
                    <div className="kunde">
                      <Avatar id={a.kunde.id} name={a.kunde.name} />
                      {a.kunde.name}
                    </div>
                    <div className="ttext">{a.text}</div>
                  </div>
                  <div className="tside">
                    {a.prioritaet === 'hoch' && (
                      <span className="prio">
                        <Sym n="flag" /> Hoch
                      </span>
                    )}
                    <span className={`due ${faelligKlasse(a.faellig, hd)}`}>{faelligText(a.faellig, hd) || 'ohne Datum'}</span>
                  </div>
                  <span className="go">
                    <Sym n="chev" />
                  </span>
                  <span className="go on">
                    Übersicht öffnen <Sym n="chev" />
                  </span>
                </div>
              ))}
            </div>
          ))}
        {aufgaben.length === 0 && !formular && <div className="au-leer">Keine offenen Aufgaben</div>}
        {nSpaeter > 0 && !p.nurAufgaben && (
          <button type="button" className="tmore knopf-rein" onClick={() => setSpaeter(!spaeter)}>
            {spaeter ? 'Spätere Aufgaben ausblenden' : `Später: ${nSpaeter} weitere ${nSpaeter === 1 ? 'Aufgabe' : 'Aufgaben'} anzeigen`}
          </button>
        )}
      </div>
    </div>
  );

  const datum = `${TAGE[heute.getDay()]}, ${heute.getDate()}. ${MONATE[heute.getMonth()]} ${heute.getFullYear()}`;
  if (p.nurAufgaben)
    return (
      <main className="main">
        <div className="toolbar start">
          <div>
            <h1>Aufgaben</h1>
            <div className="datum">
              {alleAufgaben.length} offen · alle Kunden · {datum}
            </div>
          </div>
          <span className="spacer" />
          <Schalter an={nurMeine} onChange={setNurMeine} title="Nur Aufgaben, für die Sie zuständig sind">
            Nur meine
          </Schalter>
        </div>
        <div className="content narrow start aufgaben-seite">{aufgabenSpalte}</div>
      </main>
    );

  return (
    <main className="main">
      <div className="toolbar start">
        <div>
          <h1>
            {gruss(heute)}, {p.vorname}
          </h1>
          <div className="datum">{datum}</div>
        </div>
        <span className="spacer" />
        <button type="button" className="btn ghost" title="Gespeicherten Stand (.vtue) öffnen" onClick={p.onDateiOeffnen}>
          <Sym n="folder" /> Datei öffnen
        </button>
      </div>
      <div className="content narrow start">
        {p.hinweisAlteKunden > 0 && (
          <button type="button" className="start-hinweis knopf-rein" onClick={p.onAlteKunden}>
            <Sym n="info" />
            <span>
              <b>
                {p.hinweisAlteKunden} {p.hinweisAlteKunden === 1 ? 'Kunde' : 'Kunden'}
              </b>{' '}
              seit Langem unverändert – zum Löschen prüfen (Datenschutz)
            </span>
            <Sym n="chev" />
          </button>
        )}
        <div className="section-title">
          Schnellstart<span className="spacer"></span>
          <button type="button" className="btn ghost" style={{ padding: 0 }} onClick={p.onAnpassen}>
            <Sym n="sliders" /> Anpassen
          </button>
        </div>
        <div className="links">
          {p.schnellstart.slice(0, 8).map((l) => (
            <button type="button" key={l.id} className="lnk knopf-rein" title={l.ziel} onClick={() => p.onLink(l)}>
              <LinkSymbol l={l} />
              <div>
                <b>{l.name}</b>
                <small>{linkUnterzeile(l)}</small>
              </div>
              <Sym n="ext" cls="i ext" />
            </button>
          ))}
          {p.schnellstart.length < 8 && (
            <button type="button" className="lnk add knopf-rein" onClick={p.onAnpassen}>
              <span className="sym">
                <Sym n="plus" />
              </span>
              <div>
                <b>Link hinzufügen</b>
                <small>App oder Webseite</small>
              </div>
            </button>
          )}
        </div>
        <div className="grid-start">
          {aufgabenSpalte}
          <div>
            <div className="section-title">
              <Sym n="pin" /> Angepinnt
              <span className="hdr-note">
                {pins.length} von {MAX_PINS}
              </span>
              <span className="spacer"></span>
              <span className="hdr-note">Neu pro Monat</span>
            </div>
            {pins.length === 0 ? (
              <div className="pins-leer">Wichtige Übersichten anpinnen: unten bei „Zuletzt bearbeitet“ oder in der Kundenakte auf das Pin-Symbol klicken.</div>
            ) : (
              <div className="pins">
                {pins.map((u) => {
                  const k = kunde.get(u.kundeId)!;
                  const d = u.gesamtNeu - u.gesamtAktuell;
                  const n = naechste(u);
                  const kl = n ? faelligKlasse(n.faellig, hd) : '';
                  return (
                    <div key={u.id} className="pcard klickbar" role="button" tabIndex={0} onClick={() => p.onOeffnen(u.id)} onKeyDown={(e) => e.key === 'Enter' && p.onOeffnen(u.id)}>
                      <div className="ptop">
                        <Avatar id={k.id} name={k.name} />
                        <div className="cmain">
                          <b>{k.name}</b>
                          <small>
                            {wann(u.geaendert, heute)}
                            {u.geaendertVon ? ` · ${u.geaendertVon}` : ''}
                          </small>
                        </div>
                        <button
                          type="button"
                          className="pin-los knopf-rein"
                          title="Nicht mehr anpinnen"
                          onClick={(e) => {
                            e.stopPropagation();
                            p.onPin(u.id, false);
                          }}
                        >
                          <Sym n="pin" cls="i pin" />
                        </button>
                      </div>
                      <div className="pvals">
                        <b>{formatBetrag(u.gesamtNeu)}</b>
                        {d !== 0 && <span className={`badge ${d < 0 ? 'green' : 'orange'}`}>{formatBetrag(d, { mitVorzeichen: true })}</span>}
                        <span className="spacer" />
                        {n && (
                          <span className={`pt ${kl}`}>
                            <Sym n="tasks" /> {kl === 'over' ? 'überfällig' : kl === 'today' ? 'heute fällig' : faelligText(n.faellig, hd)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="section-title" style={{ marginTop: 18 }}>
              Zuletzt bearbeitet<span className="spacer"></span>
              <span className="hdr-note">Beitrag pro Monat</span>
            </div>
            <div className="panel">
              {zuletzt.map((u) => {
                const k = kunde.get(u.kundeId)!;
                const d = u.gesamtNeu - u.gesamtAktuell;
                return (
                  <div key={u.id} className="crow klickbar" onClick={() => p.onOeffnen(u.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && p.onOeffnen(u.id)}>
                    <Avatar id={k.id} name={k.name} />
                    <div className="cmain">
                      <b>{k.name}</b>
                      <small>
                        {wann(u.geaendert, heute)}
                        {u.geaendertVon ? ` · ${u.geaendertVon}` : ''}
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
                    <button
                      type="button"
                      className="pinbtn on knopf-rein"
                      disabled={voll}
                      title={voll ? `Höchstens ${MAX_PINS} Übersichten – erst eine lösen` : `„${u.titel || 'Vertragsübersicht'}“ anpinnen`}
                      onClick={(e) => {
                        e.stopPropagation();
                        p.onPin(u.id, true);
                      }}
                    >
                      <Sym n="pin" /> Anpinnen
                    </button>
                  </div>
                );
              })}
              {zuletzt.length === 0 && pins.length === 0 && (
                <div className="start-leer">
                  <b>Noch keine Kunden</b>
                  <span>Legen Sie den ersten Kunden an – gespeichert wird nur der Name.</span>
                  <button type="button" className="btn primary" onClick={p.onNeuerKunde}>
                    <Sym n="plus" /> Neuer Kunde
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

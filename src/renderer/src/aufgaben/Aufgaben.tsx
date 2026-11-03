/**
 * Aufgaben (Bild 9 v1): Seitenfeld je Übersicht mit Formular „Aufgabe anlegen“, Liste nach Fälligkeit,
 * Offen/Erledigt, „Nur meine“. Bausteine (Zeile, Formular) nutzen auch Startseite und Kundenakte.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BEREICH_NAME,
  BEREICH_TYPEN,
  GRUPPEN_TITEL,
  faelligKlasse,
  faelligText,
  formatDatum,
  gruppiere,
  heuteDatum,
  neueAufgabe,
  plusTage,
  schnellDatum,
  type Aufgabe,
  type Editor,
  type Prioritaet,
  type Uebersicht,
} from '../../../shared';
import { Avatar, Schalter, Sym } from '../komponenten/ui';

export interface Bezug {
  id: string;
  name: string;
  gruppe: string;
}

/** Verträge aus „Aktuell“ als mögliche Bezüge (gruppiert nach Bereich). */
export function bezugsListe(u: Uebersicht): Bezug[] {
  const l: Bezug[] = [];
  for (const t of BEREICH_TYPEN) for (const ug of u.aktuell.bereiche[t].untergruppen) for (const v of ug.vertraege) if (v.name) l.push({ id: v.id, name: v.name, gruppe: BEREICH_NAME[t] });
  return l;
}

const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
function datumKurz(d: string): string {
  const [j, m, t] = d.split('-').map(Number) as [number, number, number];
  return `${WT[new Date(j, m - 1, t).getDay()]}, ${String(t).padStart(2, '0')}.${String(m).padStart(2, '0')}.`;
}

/** Datums-Chip mit Kalender (natives Datumsfeld, unsichtbar über dem Chip). */
export function DatumChip({ wert, onChange, leer = 'Datum' }: { wert: string | null; onChange: (d: string | null) => void; leer?: string }) {
  return (
    <label className={`chip datum-chip ${wert ? 'on' : ''}`}>
      <Sym n="calendar" /> {wert ? datumKurz(wert) : leer}
      <input type="date" value={wert ?? ''} aria-label="Fälligkeitsdatum wählen" onChange={(e) => onChange(e.target.value || null)} />
    </label>
  );
}

export interface FormularProps {
  heute: string;
  benutzer: string;
  team: string[];
  bezuege: Bezug[];
  anfang?: Aufgabe;
  /** Text vorbelegen (z. B. aus „+ Aufgabe“). */
  onSpeichern: (a: Aufgabe) => void;
  onAbbrechen: () => void;
  /** Zusätzliche Zeile oben (z. B. Übersicht wählen auf der Startseite). */
  kopf?: ReactNode;
}

/** Formular „Aufgabe anlegen“ wie Bild 9. Enter = anlegen, Esc = abbrechen. */
export function AufgabeFormular({ heute, benutzer, team, bezuege, anfang, onSpeichern, onAbbrechen, kopf }: FormularProps) {
  const [text, setText] = useState(anfang?.text ?? '');
  const [faellig, setFaellig] = useState<string | null>(anfang ? anfang.faellig : plusTage(heute, 7));
  const [prio, setPrio] = useState<Prioritaet>(anfang?.prioritaet ?? 'normal');
  const [wer, setWer] = useState(anfang?.zustaendig ?? benutzer);
  const [bezug, setBezug] = useState(anfang?.bezug ?? '');
  const feld = useRef<HTMLInputElement>(null);
  useEffect(() => feld.current?.focus(), []);
  const speichern = () => {
    if (!text.trim()) {
      feld.current?.focus();
      return;
    }
    const a: Aufgabe = anfang ? { ...anfang, text: text.trim(), faellig } : neueAufgabe(text, faellig, benutzer);
    if (prio === 'hoch') a.prioritaet = 'hoch';
    else delete a.prioritaet;
    a.zustaendig = wer;
    if (bezug) a.bezug = bezug;
    else delete a.bezug;
    onSpeichern(a);
  };
  const personen = [benutzer, ...team.filter((t) => t !== benutzer)];
  const gruppen = [...new Set(bezuege.map((b) => b.gruppe))];
  return (
    <div
      className="au-form"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !(e.target as HTMLElement).matches('select')) {
          e.preventDefault();
          speichern();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onAbbrechen();
        }
      }}
    >
      {kopf}
      <label className="tin">
        <Sym n="plus" />
        <input ref={feld} className="tin-feld" value={text} placeholder="Was ist zu tun?" aria-label="Aufgabe" onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="au-f">
        <label>Fällig</label>
        <div className="au-fw">
          {(
            [
              ['heute', 'Heute'],
              ['morgen', 'Morgen'],
              ['woche', 'In 1 Woche'],
            ] as const
          ).map(([art, t]) => (
            <button key={art} type="button" className={`chip knopf-rein ${faellig === schnellDatum(art, heute) ? 'on' : ''}`} onClick={() => setFaellig(schnellDatum(art, heute))}>
              {t}
            </button>
          ))}
          <DatumChip wert={faellig && !(['heute', 'morgen', 'woche'] as const).some((a) => schnellDatum(a, heute) === faellig) ? faellig : null} onChange={setFaellig} />
        </div>
      </div>
      <div className="au-f">
        <label>Priorität</label>
        <div className="au-fw">
          <div className="seg sm">
            <button type="button" className={`knopf-rein ${prio === 'normal' ? 'on' : ''}`} onClick={() => setPrio('normal')}>
              Normal
            </button>
            <button type="button" className={`knopf-rein ${prio === 'hoch' ? 'on' : ''}`} onClick={() => setPrio('hoch')}>
              <Sym n="flag" /> Hoch
            </button>
          </div>
        </div>
      </div>
      <div className="au-f">
        <label>Zuständig</label>
        <div className="au-fw">
          {personen.map((p) => (
            <button key={p} type="button" className={`chip knopf-rein ${wer === p ? 'on' : ''}`} onClick={() => setWer(p)}>
              <Avatar id={p} name={p} cls="mini" />
              {p === benutzer ? 'Ich' : p}
            </button>
          ))}
          {team.length === 0 && (
            <span className="au-hint" title="Einstellungen → Allgemein → Team">
              Team unter Einstellungen → Allgemein
            </span>
          )}
        </div>
      </div>
      {bezuege.length > 0 && (
        <div className="au-f">
          <label>Bezug</label>
          <div className="au-fw">
            <label className="kk-input au-sel">
              <Sym n="file" />
              <select value={bezug} aria-label="Bezug" onChange={(e) => setBezug(e.target.value)}>
                <option value="">Ganze Übersicht</option>
                {gruppen.map((g) => (
                  <optgroup key={g} label={g}>
                    {bezuege
                      .filter((b) => b.gruppe === g)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <Sym n="down" />
            </label>
          </div>
        </div>
      )}
      <div className="au-f" title="Folgt mit der Outlook-Anbindung (Meilenstein 5b)">
        <label>Erinnerung</label>
        <div className="au-fw nw gesperrt">
          <span className="cbx" />
          <span className="au-cb">
            In Outlook-Kalender <small>· folgt mit Outlook</small>
          </span>
        </div>
      </div>
      <div className="au-btns">
        <span className="au-hint">Enter = {anfang ? 'speichern' : 'anlegen'}</span>
        <span className="spacer" />
        <button type="button" className="btn" onClick={onAbbrechen}>
          Abbrechen
        </button>
        <button type="button" className="btn primary" onClick={speichern}>
          {anfang ? 'Speichern' : 'Aufgabe anlegen'}
        </button>
      </div>
    </div>
  );
}

/** Eine Zeile im Seitenfeld (Bild 9). */
function AufgabeZeile({
  a,
  heute,
  benutzer,
  bezugName,
  onErledigt,
  onWoche,
  onZumVertrag,
  onBearbeiten,
  onLoeschen,
}: {
  a: Aufgabe;
  heute: string;
  benutzer: string;
  bezugName: string | null;
  onErledigt: () => void;
  onWoche: () => void;
  onZumVertrag: (() => void) | null;
  onBearbeiten: () => void;
  onLoeschen: () => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <div className={`au-row ${a.erledigt ? 'erledigt' : ''}`} onMouseLeave={() => setMenu(false)}>
      <button
        type="button"
        className={`box knopf-rein ${a.erledigt ? 'on' : ''}`}
        role="checkbox"
        aria-checked={a.erledigt}
        aria-label={a.erledigt ? 'Wieder öffnen' : 'Erledigt'}
        title={a.erledigt ? 'Wieder öffnen' : 'Erledigt'}
        onClick={onErledigt}
      >
        {a.erledigt && <Sym n="check" />}
      </button>
      <div className="au-main">
        <div className="au-t" onDoubleClick={onBearbeiten}>
          {a.text}
        </div>
        {(a.prioritaet === 'hoch' || bezugName) && (
          <div className="au-meta">
            {a.prioritaet === 'hoch' && (
              <span className="prio">
                <Sym n="flag" /> Hoch
              </span>
            )}
            {bezugName && (
              <span className="au-v">
                <Sym n="file" /> {bezugName}
              </span>
            )}
          </div>
        )}
        {!a.erledigt && (
          <div className="au-akt">
            <button type="button" className="knopf-rein" title="Fälligkeit um eine Woche verschieben" onClick={onWoche}>
              <Sym n="calendar" /> +1 Woche
            </button>
            {onZumVertrag && (
              <button type="button" className="knopf-rein" onClick={onZumVertrag}>
                <Sym n="arrow" /> Zum Vertrag
              </button>
            )}
            <span className="au-mehr">
              <button type="button" className="knopf-rein" aria-label="Weitere" aria-haspopup="menu" onClick={() => setMenu(!menu)}>
                <Sym n="more" />
              </button>
              {menu && (
                <div className="ub-menu" role="menu">
                  <button type="button" role="menuitem" className="ub-mi knopf-rein" onClick={onBearbeiten}>
                    <Sym n="pencil" />
                    <span>Bearbeiten</span>
                  </button>
                  <button type="button" role="menuitem" className="ub-mi knopf-rein rot" onClick={onLoeschen}>
                    <Sym n="trash" />
                    <span>Löschen</span>
                  </button>
                </div>
              )}
            </span>
          </div>
        )}
      </div>
      <div className="au-side">
        {a.erledigt ? (
          <span className="due">{a.erledigtAm ? `erledigt ${formatDatum(a.erledigtAm.slice(0, 10)).slice(0, 6)}` : 'erledigt'}</span>
        ) : (
          <span className={`due ${faelligKlasse(a.faellig, heute)}`}>{faelligText(a.faellig, heute)}</span>
        )}
        {a.zustaendig && <Avatar id={a.zustaendig} name={a.zustaendig} cls="mini" title={`zuständig: ${a.zustaendig === benutzer ? 'Ich' : a.zustaendig}`} />}
      </div>
    </div>
  );
}

/** Seitenfeld „Aufgaben“ einer Übersicht (Bild 9 v1). */
export function AufgabenPanel({
  u,
  editor,
  kunde,
  benutzer,
  team,
  hinweis,
  onSchliessen,
  onZumVertrag,
  bezugName,
}: {
  u: Uebersicht;
  editor: Editor;
  kunde: string;
  benutzer: string;
  team: string[];
  hinweis: (text: string) => void;
  onSchliessen: () => void;
  onZumVertrag: (id: string) => void;
  bezugName: (id: string) => string | null;
}) {
  const heute = heuteDatum();
  const [tab, setTab] = useState<'offen' | 'erledigt'>('offen');
  const [nurMeine, setNurMeine] = useState(false);
  const [formular, setFormular] = useState<null | 'neu' | string>(null);
  const bezuege = useMemo(() => bezugsListe(u), [u]);
  const meine = (a: Aufgabe) => !nurMeine || !a.zustaendig || a.zustaendig === benutzer;
  const offen = u.aufgaben.filter((a) => !a.erledigt);
  const erledigt = u.aufgaben.filter((a) => a.erledigt);
  const liste = (tab === 'offen' ? offen : erledigt).filter(meine);

  // N = neue Aufgabe (wenn kein Eingabefeld aktiv ist)
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      const imFeld = (e.target as HTMLElement).matches?.('input,textarea,select');
      if (!imFeld && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setTab('offen');
        setFormular('neu');
      }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, []);

  const zeile = (a: Aufgabe) =>
    formular === a.id ? (
      <AufgabeFormular
        key={a.id}
        heute={heute}
        benutzer={benutzer}
        team={team}
        bezuege={bezuege}
        anfang={a}
        onAbbrechen={() => setFormular(null)}
        onSpeichern={(neu) => {
          editor.aufgabeAendern(a.id, { ...neu, prioritaet: neu.prioritaet, bezug: neu.bezug });
          setFormular(null);
        }}
      />
    ) : (
      <AufgabeZeile
        key={a.id}
        a={a}
        heute={heute}
        benutzer={benutzer}
        bezugName={a.bezug ? bezugName(a.bezug) : null}
        onErledigt={() => {
          editor.aufgabeAendern(a.id, { erledigt: !a.erledigt });
          if (!a.erledigt) hinweis(`Aufgabe „${a.text}“ erledigt`);
        }}
        onWoche={() => editor.aufgabeAendern(a.id, { faellig: plusTage(a.faellig && a.faellig > heute ? a.faellig : heute, 7) })}
        onZumVertrag={a.bezug && bezugName(a.bezug) ? () => onZumVertrag(a.bezug!) : null}
        onBearbeiten={() => setFormular(a.id)}
        onLoeschen={() => {
          editor.aufgabeLoeschen(a.id);
          hinweis(`Aufgabe „${a.text}“ gelöscht`);
        }}
      />
    );

  return (
    <aside className="au-panel" aria-label="Aufgaben">
      <header>
        <div className="au-h">
          <h2>
            <Sym n="tasks" /> Aufgaben
          </h2>
          <span className="es-anz">{offen.length} offen</span>
          <span className="spacer" />
          <button type="button" className="au-x knopf-rein" aria-label="Aufgaben schließen" onClick={onSchliessen}>
            <Sym n="x" />
          </button>
        </div>
        <p>
          {u.titel || 'Vertragsübersicht'} · {kunde}
        </p>
        <div className="au-filter">
          <div className="seg sm" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'offen'} className={`knopf-rein ${tab === 'offen' ? 'on' : ''}`} onClick={() => setTab('offen')}>
              Offen {offen.length}
            </button>
            <button type="button" role="tab" aria-selected={tab === 'erledigt'} className={`knopf-rein ${tab === 'erledigt' ? 'on' : ''}`} onClick={() => setTab('erledigt')}>
              Erledigt {erledigt.length}
            </button>
          </div>
          <span className="spacer" />
          <Schalter an={nurMeine} onChange={setNurMeine} title="Nur Aufgaben, für die Sie zuständig sind">
            Nur meine
          </Schalter>
        </div>
      </header>
      <div className="au-body">
        {tab === 'offen' &&
          (formular === 'neu' ? (
            <AufgabeFormular
              heute={heute}
              benutzer={benutzer}
              team={team}
              bezuege={bezuege}
              onAbbrechen={() => setFormular(null)}
              onSpeichern={(a) => {
                editor.aufgabeAnlegen(a);
                setFormular(null);
              }}
            />
          ) : (
            <button type="button" className="au-neu knopf-rein" onClick={() => setFormular('neu')}>
              <Sym n="plus" /> Neue Aufgabe <span className="spacer" />
              <kbd>N</kbd>
            </button>
          ))}
        <div className="au-liste">
          {tab === 'offen'
            ? gruppiere(liste, heute).map((g) => (
                <div key={g.gruppe} className="au-gruppe">
                  <div className={`tgroup ${g.gruppe === 'ueberfaellig' ? 'rot' : g.gruppe === 'heute' ? 'orange' : ''}`}>
                    <span>{GRUPPEN_TITEL[g.gruppe]}</span>
                    <em>{g.aufgaben.length}</em>
                  </div>
                  {g.aufgaben.map(zeile)}
                </div>
              ))
            : [...liste].sort((a, b) => (b.erledigtAm ?? '').localeCompare(a.erledigtAm ?? '')).map(zeile)}
          {liste.length === 0 && formular !== 'neu' && <div className="au-leer">{tab === 'offen' ? 'Keine offenen Aufgaben' : 'Noch nichts erledigt'}</div>}
        </div>
        {tab === 'offen' && erledigt.length > 0 && (
          <button type="button" className="tmore knopf-rein" onClick={() => setTab('erledigt')}>
            <Sym n="check" /> {erledigt.length} {erledigt.length === 1 ? 'erledigte Aufgabe' : 'erledigte Aufgaben'} anzeigen
          </button>
        )}
      </div>
      <footer>
        <Sym n="info" /> Erscheint auch auf der Startseite und in der Kundenakte.
      </footer>
    </aside>
  );
}

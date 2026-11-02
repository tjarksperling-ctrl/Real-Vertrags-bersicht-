/**
 * Editor einer Übersicht: Kopfzeile, Bereichsleiste, Bereiche, Gesamtbetrag, Hinweis mit „Rückgängig“.
 * Ansichten (M3): „Aktuell“ (Bild 2), „Neu“ mit Markierungen + Vorteilen (Bild 3), „Nebeneinander“ (Bild 4 v2);
 * Sync-Schalter mit Erklärkarte und Leiste „Übernehmen ist aus“ (Bild 14 v2).
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type * as Y from 'yjs';
import {
  BEREICH_NAME,
  BEREICH_TYPEN,
  Editor,
  aenderungen,
  fassungSumme,
  formatBetrag,
  vergleicheBetraege,
  type Aenderung,
  type BereichTyp,
  type FassungName,
  type FassungSumme,
  type Katalog,
  type Kunde,
  type Uebersicht,
  type Vertrag,
  type VertragFeld,
} from '../../../shared';
import { useDocVersion } from '../daten/hooks';
import { Avatar, STRG, Schalter, Sym } from '../komponenten/ui';
import { Bereich, BereichAus, FARBE } from '../editor/Bereich';
import { EditorKontext, FokusRegister, useEditorKontext, type EditorKontextWert } from '../editor/kontext';
import { TextFeld } from '../editor/felder';
import { PdfDialog } from '../dialoge/Pdf';

export type Ansicht = FassungName | 'neben';

export interface HinweisDaten {
  text: string;
  n: number;
  /** Nur Info, ohne „Rückgängig“. */
  info?: boolean;
}

export function Hinweis({ h, onRueckgaengig, onZu }: { h: HinweisDaten | null; onRueckgaengig: () => void; onZu: () => void }) {
  useEffect(() => {
    if (!h) return;
    const t = setTimeout(onZu, 7000);
    return () => clearTimeout(t);
  }, [h, onZu]);
  if (!h) return null;
  return (
    <div className="ub-toast" role="status">
      <Sym n="check" />
      <span>{h.text}</span>
      {!h.info && (
        <>
          <button type="button" className="ub-toast-a knopf-rein" onClick={onRueckgaengig}>
            <Sym n="undo" /> Rückgängig
          </button>
          <span className="v2-tk">{STRG} + Z</span>
        </>
      )}
    </div>
  );
}

/** Text der dunklen Gesamt-Kachel in der Bereichsleiste: „Gesamtbetrag ohne Darlehen“. */
export function gesamtLabel(aus: BereichTyp[]): string {
  if (aus.length === 0) return 'Gesamtbetrag monatlich';
  return `Gesamtbetrag ohne ${aus.map((t) => BEREICH_NAME[t]).join(' und ')}`;
}

function uhrzeit(iso: string): string {
  const d = new Date(iso);
  const heute = new Date().toDateString() === d.toDateString();
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return heute ? `heute, ${hm}` : `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}., ${hm}`;
}

/** Gleicher Kontext, andere Fassung (für „Nebeneinander“). */
function MitFassung({ fassung, children }: { fassung: FassungName; children: ReactNode }) {
  const k = useEditorKontext();
  const wert = useMemo(() => ({ ...k, fassung }), [k, fassung]);
  return <EditorKontext.Provider value={wert}>{children}</EditorKontext.Provider>;
}

interface Uebertragung {
  vertragId: string;
  feld: VertragFeld;
  text: string;
}

export function EditorSeite({
  doc,
  kunde,
  katalog,
  ansicht,
  setAnsicht,
  band,
  benutzer,
  pdfPasswortStandard = false,
  pdfZiel,
}: {
  pdfPasswortStandard?: boolean;
  pdfZiel?: string | undefined;
  doc: Y.Doc;
  kunde: Kunde;
  katalog: Katalog | null;
  ansicht: Ansicht;
  setAnsicht: (a: Ansicht) => void;
  band?: ReactNode;
  benutzer: string;
}) {
  const editor = useMemo(() => new Editor(doc), [doc]);
  useEffect(() => () => editor.undo.destroy(), [editor]);
  const version = useDocVersion(doc);
  const u = useMemo(() => editor.lesen(), [editor, version]);
  const fokus = useMemo(() => new FokusRegister(), [doc]);
  const [markiert, setMarkiert] = useState<string | null>(null);
  const [symbolOffen, setSymbolOffen] = useState<string | null>(null);
  const [neueUg, setNeueUg] = useState<string | null>(null);
  const [neueZeile, setNeueZeile] = useState<string | null>(null);
  const [hinweisDaten, setHinweis] = useState<HinweisDaten | null>(null);
  const [nur, setNur] = useState<BereichTyp | null>(null);
  const [nurAenderungen, setNurAenderungen] = useState(false);
  const [titelBearbeiten, setTitelBearbeiten] = useState(false);
  const [uebertragung, setUebertragung] = useState<Uebertragung | null>(null);
  const [menu, setMenu] = useState(false);
  const [pdfOffen, setPdfOffen] = useState(false);
  const inhalt = useRef<HTMLDivElement>(null);
  const fassung: FassungName = ansicht === 'neben' ? 'aktuell' : ansicht;

  const hinweis = useCallback((text: string) => setHinweis((h) => ({ text, n: (h?.n ?? 0) + 1 })), []);
  const zu = useCallback(() => setHinweis(null), []);

  useEffect(() => {
    if (!uebertragung) return;
    const t = setTimeout(() => setUebertragung(null), 5000);
    return () => clearTimeout(t);
  }, [uebertragung]);

  /** Bild 14: nach einer Änderung in „Aktuell“ kurz „auch in ‚Neu‘“ zeigen, wenn sie übertragen wurde. */
  const nachAenderung = useCallback(
    (vertragId: string, feld: VertragFeld) => {
      const jetzt = editor.lesen();
      if (!jetzt.syncAktiv) return;
      const finde = (f: FassungName, pruefe: (v: Vertrag) => boolean) => {
        for (const t of BEREICH_TYPEN) for (const ug of jetzt[f].bereiche[t].untergruppen) for (const v of ug.vertraege) if (pruefe(v as Vertrag)) return v as Vertrag;
        return undefined;
      };
      const a = finde('aktuell', (v) => v.id === vertragId);
      const n = finde('neu', (v) => v.quelleId === vertragId);
      if (!a || !n) return;
      const lies = (v: Vertrag) => (feld.startsWith('leistung.') ? (v as unknown as { leistung: Record<string, unknown> }).leistung[feld.slice(9)] : (v as unknown as Record<string, unknown>)[feld]);
      if (lies(a) !== lies(n)) return;
      const w = lies(a);
      const wert = typeof w === 'number' ? formatBetrag(w) : String(w ?? '');
      setUebertragung({ vertragId, feld, text: `${a.name || 'Vertrag'} ${wert} in „Aktuell“`.replace(/\s+/g, ' ') });
    },
    [editor],
  );

  const kontext: EditorKontextWert = {
    editor,
    u,
    fassung,
    fokus,
    markiert,
    setMarkiert,
    hinweis,
    katalog,
    symbolOffen,
    setSymbolOffen,
    neueUg,
    setNeueUg,
    neueZeile,
    setNeueZeile,
    nachAenderung,
  };

  // Tastatur: Strg+Z / Strg+Y (Mac ⇧⌘Z), Entf auf markierter Zeile, Strg+1/2/3 (Festlegung 3 und 6)
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      const ziel = e.target as HTMLElement;
      const imFeld = ziel.matches?.('input,textarea');
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.altKey && (e.key === 'z' || e.key === 'Z' || e.key === 'y' || e.key === 'Y')) {
        if (imFeld && ziel.dataset['geaendert'] === '1') return; // Tippen im Feld zurücknehmen: Browser
        e.preventDefault();
        const wieder = e.key.toLowerCase() === 'y' || e.shiftKey;
        if (wieder) editor.wiederholen();
        else editor.rueckgaengig();
        setHinweis(null);
      } else if (mod && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur();
        setPdfOffen(true);
      } else if (mod && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        setAnsicht((['aktuell', 'neu', 'neben'] as const)[Number(e.key) - 1]!);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !imFeld && markiert) {
        e.preventDefault();
        const f = document.querySelector(`tr[data-vertrag="${markiert}"]`)?.closest('[data-fassung]')?.getAttribute('data-fassung') as FassungName | null;
        const r = editor.vertragLoeschen(f ?? fassung, markiert);
        if (r) hinweis(`Vertrag „${r.name || 'ohne Namen'}“ gelöscht`);
        setMarkiert(null);
      } else if (e.key === 'Escape' && !imFeld) {
        setMarkiert(null);
        setSymbolOffen(null);
        setMenu(false);
      }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [editor, fassung, markiert, hinweis, setAnsicht]);

  useEffect(() => {
    const klick = (e: MouseEvent) => {
      const z = e.target as HTMLElement;
      if (!z.closest?.('tr[data-vertrag]')) setMarkiert(null);
      if (!z.closest?.('.mehr-menu')) setMenu(false);
    };
    window.addEventListener('mousedown', klick);
    return () => window.removeEventListener('mousedown', klick);
  }, []);

  useEffect(() => {
    inhalt.current?.scrollTo({ top: 0 });
  }, [ansicht]);

  // Nebeneinander: Zeilen von Aktuell und Neu paarweise gleich hoch (Bild 4 v2)
  useLayoutEffect(() => {
    const box = inhalt.current;
    if (ansicht !== 'neben' || !box) return;
    const gruppen = new Map<string, HTMLElement[]>();
    box.querySelectorAll<HTMLElement>('tr[data-paar]').forEach((r) => {
      r.style.height = '';
      const k = r.dataset['paar']!;
      gruppen.set(k, [...(gruppen.get(k) ?? []), r]);
    });
    for (const rs of gruppen.values()) {
      if (rs.length < 2) continue;
      const h = Math.max(...rs.map((r) => r.getBoundingClientRect().height));
      rs.forEach((r) => (r.style.height = `${h}px`));
    }
  });

  const sa = useMemo(() => fassungSumme(u.aktuell), [u]);
  const sn = useMemo(() => fassungSumme(u.neu), [u]);
  const aend = useMemo(() => aenderungen(u.aktuell, u.neu), [u]);
  const f = u[fassung];
  const summe = fassung === 'neu' ? sn : sa;
  const aus = BEREICH_TYPEN.filter((t) => !f.bereiche[t].aktiv);

  const aktivSetzen = (t: BereichTyp, an: boolean) => {
    const vorher = summe.gesamtMonat;
    editor.bereichAktiv(fassung, t, an);
    if (ansicht === 'neben' && !u.syncAktiv) editor.bereichAktiv('neu', t, an); // vorläufig: in „Nebeneinander“ wirkt das Kästchen auf beide
    if (!an) {
      const nachher = fassungSumme(editor.lesen()[fassung]).gesamtMonat;
      hinweis(`„${BEREICH_NAME[t]}“ abgewählt – Gesamtbetrag jetzt ${formatBetrag(nachher)} statt ${formatBetrag(vorher)}`);
    }
  };

  const syncSetzen = (an: boolean) => {
    editor.syncSetzen(an, benutzer);
    if (!an) hinweis('Übernehmen ausgeschaltet – „Neu“ bleibt, wie es ist');
  };

  /** Zusatz unter Werten: in „Neu“ der vorherige Wert, in „Aktuell“ kurz „auch in ‚Neu‘“. */
  const zusatzFuer = (fn: FassungName) => (v: Vertrag) => {
    if (fn === 'neu') {
      const a: Aenderung | undefined = aend.get(v.id);
      if (!a) return undefined;
      return (feld: VertragFeld) => (feld === a.feld ? <span className="vorher">{a.vorher === null ? '–' : formatBetrag(a.vorher)}</span> : null);
    }
    if (uebertragung?.vertragId !== v.id) return undefined;
    return (feld: VertragFeld) =>
      feld === uebertragung.feld || (feld === 'leistung.betrag' && uebertragung.feld === 'leistung.art') ? (
        <span className="sy-tag" title="Wird sofort auch in „Neu“ eingetragen">
          <Sym n="sync" /> auch in „Neu“
        </span>
      ) : null;
  };

  const nurIds = fassung === 'neu' && nurAenderungen && ansicht === 'neu' ? new Set(aend.keys()) : null;
  const ersparnis = u.ersparnisAnzeigen;
  const titel = u.titel || 'Vertragsübersicht';

  const bereichOderAus = (fn: FassungName, t: BereichTyp, s: FassungSumme, seite = false) => {
    const fb = u[fn].bereiche[t];
    const vergleich = fn === 'neu' && ersparnis ? sa.bereiche[t] : undefined;
    return fb.aktiv ? (
      <Bereich
        key={`${fn}-${t}`}
        typ={t}
        b={fb}
        s={s.bereiche[t]}
        vergleich={vergleich}
        zusatz={zusatzFuer(fn)}
        seite={seite}
        fassTag={seite ? (fn === 'neu' ? 'Neu' : 'Aktuell') : undefined}
        nurIds={fn === 'neu' ? nurIds : null}
      />
    ) : (
      <BereichAus
        key={`${fn}-${t}`}
        typ={t}
        b={fb}
        s={s.bereiche[t]}
        onZuschalten={() => {
          editor.bereichAktiv(fn, t, true);
        }}
      />
    );
  };

  const aenderungsLeiste = (neben: boolean) => {
    const beispiel = [...aend.values()][0];
    return (
      <div className="aenderungen">
        {beispiel && <span className="ae-mark">{beispiel.nachher === null ? '–' : formatBetrag(beispiel.nachher)}</span>}
        <span>
          {aend.size === 0 ? (
            <>
              <b>Keine Änderungen</b> gegenüber „Aktuell“
            </>
          ) : neben ? (
            <>
              <b>
                {aend.size} {aend.size === 1 ? 'Änderung' : 'Änderungen'}
              </b>{' '}
              in „Neu“ · alle Spalten, direkt bearbeitbar
            </>
          ) : (
            <>
              <b>
                {aend.size} {aend.size === 1 ? 'Änderung' : 'Änderungen'}
              </b>{' '}
              gegenüber „Aktuell“ · vorheriger Wert steht darunter (nur in der App)
            </>
          )}
        </span>
        <span className="spacer" />
        {!neben && (
          <Schalter an={nurAenderungen} onChange={setNurAenderungen} title="Blendet unveränderte Verträge aus">
            Nur Änderungen zeigen
          </Schalter>
        )}
        <Schalter an={ersparnis} onChange={(an) => editor.ersparnisAnzeigen(an)} title="An: Ersparnis bzw. Mehrbeitrag ggü. Aktuell wird in der App und im PDF gezeigt. Aus: nirgends.">
          Ersparnis anzeigen
        </Schalter>
      </div>
    );
  };

  const syncAus = !u.syncAktiv && (
    <div className="sy-aus">
      <span className="sy-ic">
        <Sym n="sync" />
      </span>
      <div>
        <b>Übernehmen ist aus</b> – Änderungen in „Aktuell“ werden nicht nach „Neu“ übertragen.
        <small>
          {u.syncAusSeit ? `Ausgeschaltet ${uhrzeit(u.syncAusSeit)}${u.syncAusVon ? ` von ${u.syncAusVon}` : ''} · ` : ''}Wieder eingeschaltet wird nur übernommen, was Sie ab dann in „Aktuell“ ändern – nichts rückwirkend.
        </small>
      </div>
      <span className="spacer" />
      <button type="button" className="sy-an knopf-rein" onClick={() => syncSetzen(true)}>
        <Sym n="sync" /> Wieder einschalten
      </button>
    </div>
  );

  const vgl = vergleicheBetraege(sa.gesamtMonat, sn.gesamtMonat);
  const gesamtKarte = (fn: FassungName, s: FassungSumme, mitVergleich: boolean, neben = false) => {
    const ausF = BEREICH_TYPEN.filter((t) => !u[fn].bereiche[t].aktiv);
    return (
      <div className="gesamt v1">
        <span>Gesamtbetrag monatlich</span>
        {mitVergleich && ersparnis ? (
          <>
            <span className="spacer" />
            <div className="neben">
              {neben ? (
                <>
                  <b style={{ color: vgl.art === 'mehrbeitrag' ? '#ff9f8a' : '#7ee2a0' }}>{formatBetrag(vgl.differenzMonat, { mitVorzeichen: true })} pro Monat</b>
                  <br />
                  {formatBetrag(vgl.differenzJahr, { mitVorzeichen: true })} pro Jahr
                </>
              ) : (
                <>
                  Aktuell {formatBetrag(sa.gesamtMonat)}
                  <br />
                  <b style={{ color: vgl.art === 'mehrbeitrag' ? '#ff9f8a' : '#7ee2a0' }}>{formatBetrag(vgl.differenzMonat, { mitVorzeichen: true })} pro Monat</b>
                </>
              )}
            </div>
          </>
        ) : (
          ausF.length > 0 && (
            <>
              <span className="spacer" />
              <div className="neben">
                {4 - ausF.length} von 4 Bereichen
                <br />
                ohne {ausF.map((t) => BEREICH_NAME[t]).join(' und ')} ({formatBetrag(ausF.reduce((x, t) => x + s.bereiche[t].monat, 0))} / Monat)
              </div>
            </>
          )
        )}
        <b>{formatBetrag(s.gesamtMonat)}</b>
      </div>
    );
  };

  return (
    <EditorKontext.Provider value={kontext}>
      <main className="main">
        <div className="toolbar v1">
          <Avatar id={kunde.id} name={kunde.name} />
          <div className="crumb">
            <span className="kunde">
              {kunde.name} <Sym n="chev" />
            </span>
            {titelBearbeiten ? (
              <input
                className="titel-feld"
                autoFocus
                defaultValue={u.titel ?? ''}
                aria-label="Titel der Übersicht"
                onBlur={(e) => {
                  editor.titelAendern(e.target.value);
                  setTitelBearbeiten(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') setTitelBearbeiten(false);
                }}
              />
            ) : (
              <h1 title="Doppelklick zum Umbenennen" onDoubleClick={() => setTitelBearbeiten(true)}>
                {titel}
              </h1>
            )}
          </div>
          <div className="seg" style={{ marginLeft: 6 }} role="tablist">
            {(
              [
                ['aktuell', 'Aktuell', '1'],
                ['neu', 'Neu', '2'],
                ['neben', 'Nebeneinander', '3'],
              ] as const
            ).map(([a, t, z]) => (
              <button type="button" role="tab" key={a} aria-selected={ansicht === a} className={`knopf-rein ${ansicht === a ? 'on' : ''}`} title={`${STRG} + ${z}`} onClick={() => setAnsicht(a)}>
                {t}
              </button>
            ))}
          </div>
          <SyncSchalter u={u} onChange={syncSetzen} uebertragung={uebertragung} />
          <span className="spacer" />
          <button type="button" className="btn" disabled title="folgt mit Meilenstein 5">
            <Sym n="tasks" /> Aufgaben
          </button>
          <button type="button" className="btn" disabled title="folgt mit Meilenstein 5">
            <Sym n="monitor" /> Auf Desktop speichern
          </button>
          <button type="button" className="btn primary" title={`${STRG} + P`} onClick={() => setPdfOffen(true)}>
            <Sym n="pdf" /> PDF / E-Mail
          </button>
          <span className="mehr-menu">
            <button type="button" className="btn icon" title="Weitere: Umbenennen, Neu wieder wie Aktuell" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>
              <Sym n="more" />
            </button>
            {menu && (
              <div className="ub-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="ub-mi knopf-rein"
                  onClick={() => {
                    setMenu(false);
                    setTitelBearbeiten(true);
                  }}
                >
                  <Sym n="pencil" />
                  <span>Umbenennen</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="ub-mi knopf-rein"
                  onClick={() => {
                    setMenu(false);
                    editor.neuWieAktuell();
                    hinweis('„Neu“ ist wieder wie „Aktuell“');
                  }}
                >
                  <Sym n="copy" />
                  <span>Neu wieder wie Aktuell</span>
                  <small>überschreibt „Neu“</small>
                </button>
              </div>
            )}
          </span>
        </div>
        <div className="bleiste">
          <button type="button" className={`bl-item bl-gesamt knopf-rein ${nur ? '' : 'on'}`} onClick={() => setNur(null)}>
            <Sym n="columns" />
            Gesamt
          </button>
          <span className="bl-sep" />
          {BEREICH_TYPEN.map((t) => {
            const an = f.bereiche[t].aktiv;
            return (
              <span key={t} className={`bl-item ${FARBE[t]} ${nur === t ? 'on' : ''} ${an ? '' : 'off'}`}>
                <button
                  type="button"
                  className="chk knopf-rein"
                  role="checkbox"
                  aria-checked={an}
                  aria-label={`${BEREICH_NAME[t]} an-/abwählen`}
                  title={an ? 'Bereich an-/abwählen' : 'Kästchen anklicken: Bereich wieder zuschalten'}
                  onClick={() => aktivSetzen(t, !an)}
                >
                  {an && <Sym n="check" />}
                </button>
                <button
                  type="button"
                  className="bl-name knopf-rein"
                  onClick={() => {
                    setNur(nur === t ? null : t);
                    inhalt.current?.scrollTo({ top: 0 });
                  }}
                >
                  {BEREICH_NAME[t]}
                </button>
              </span>
            );
          })}
          <span className="spacer" />
          {ansicht === 'neben' ? (
            <div className="bl-total">
              <small>Aktuell</small>
              <b>{formatBetrag(sa.gesamtMonat)}</b>
              <small style={{ marginLeft: 6 }}>Neu</small>
              <b>{formatBetrag(sn.gesamtMonat)}</b>
            </div>
          ) : (
            <div className="bl-total">
              <small>{gesamtLabel(aus)}</small>
              <b>{formatBetrag(summe.gesamtMonat)}</b>
            </div>
          )}
        </div>
        {ansicht === 'neben' ? (
          <div className="content neu2 side2 ub v2e" ref={inhalt}>
            {aenderungsLeiste(true)}
            {syncAus}
            <div className="side-head v1">
              <div>
                <span className="fass">Aktuell</span> Bestand
              </div>
              <div>
                <span className="fass neu">Neu</span> Vorschlag
              </div>
            </div>
            {BEREICH_TYPEN.filter((t) => !nur || t === nur).map((t) => (
              <div className="side-row" key={t}>
                <div data-fassung="aktuell">
                  <MitFassung fassung="aktuell">{bereichOderAus('aktuell', t, sa, true)}</MitFassung>
                </div>
                <div data-fassung="neu">
                  <MitFassung fassung="neu">{bereichOderAus('neu', t, sn, true)}</MitFassung>
                </div>
              </div>
            ))}
            {!nur && (
              <div className="side-row">
                {gesamtKarte('aktuell', sa, false)}
                {gesamtKarte('neu', sn, true, true)}
              </div>
            )}
          </div>
        ) : (
          <div className={`content narrow ub v2e b13 ${fassung === 'neu' ? 'neu2' : ''}`} ref={inhalt} data-fassung={fassung}>
            {band}
            {fassung === 'neu' && aenderungsLeiste(false)}
            {fassung === 'neu' && syncAus}
            {BEREICH_TYPEN.filter((t) => !nur || t === nur).map((t) => bereichOderAus(fassung, t, summe))}
            {!nur && gesamtKarte(fassung, summe, fassung === 'neu')}
            {!nur && fassung === 'neu' && <Vorteile u={u} sa={sa.gesamtMonat} sn={sn.gesamtMonat} />}
          </div>
        )}
        {pdfOffen && (
          <PdfDialog
            editor={editor}
            u={u}
            kunde={kunde.name}
            passwortStandard={pdfPasswortStandard}
            ziel={pdfZiel}
            onSchliessen={() => setPdfOffen(false)}
            onFertig={(text) => {
              setPdfOffen(false);
              setHinweis((h) => ({ text, n: (h?.n ?? 0) + 1, info: true }));
            }}
          />
        )}
        <Hinweis
          h={hinweisDaten}
          onZu={zu}
          onRueckgaengig={() => {
            editor.rueckgaengig();
            setHinweis(null);
          }}
        />
      </main>
    </EditorKontext.Provider>
  );
}

/** Schalter „In ‚Neu‘ übernehmen“ mit Erklärkarte beim Darüberfahren (Bild 14 v2). */
function SyncSchalter({ u, onChange, uebertragung }: { u: Uebersicht; onChange: (an: boolean) => void; uebertragung: Uebertragung | null }) {
  const [karte, setKarte] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const zeigen = (an: boolean) => {
    clearTimeout(t.current);
    t.current = setTimeout(() => setKarte(an), an ? 450 : 150);
  };
  return (
    <span className="sync-wrap" onMouseEnter={() => zeigen(true)} onMouseLeave={() => zeigen(false)}>
      <Schalter an={u.syncAktiv} cls={`sync ${karte ? 'sy-hover' : ''}`} onChange={onChange}>
        In „Neu“ übernehmen
      </Schalter>
      {karte && (
        <div className="sy-karte" role="tooltip">
          <span className="sy-pfeil" />
          <div className="sy-kopf">
            <Sym n="sync" />
            <b>In „Neu“ übernehmen</b>
            <span className="spacer" />
            <span className="sy-scope">gilt nur für diese Übersicht</span>
          </div>
          <div className={`sy-zeile ${u.syncAktiv ? 'on' : ''}`}>
            <span className="switch on">
              <i />
            </span>
            <div>
              <b>An</b> – Was Sie in „Aktuell“ eintragen, ändern, löschen oder abwählen, passiert sofort auch in „Neu“.
              <small>Ausnahme: Was Sie in „Neu“ selbst geändert haben, bleibt so.</small>
            </div>
          </div>
          <div className={`sy-zeile ${u.syncAktiv ? '' : 'on aus'}`}>
            <span className="switch">
              <i />
            </span>
            <div>
              <b>Aus</b> – Solange der Schalter aus ist, wird keine Änderung aus „Aktuell“ nach „Neu“ übertragen.
              <small>Wieder an: Übertragen wird nur, was Sie ab dann ändern – nichts rückwirkend.</small>
            </div>
          </div>
          {uebertragung && (
            <div className="sy-bsp">
              <span className="sy-chip">Gerade</span>
              {uebertragung.text} <Sym n="arrow" /> steht jetzt auch in „Neu“
            </div>
          )}
        </div>
      )}
    </span>
  );
}

/** „Vorteile der Änderungen“ (Bild 3 v3): Stichpunkte + automatische Ersparnis bzw. Mehrbeitrag. */
function Vorteile({ u, sa, sn }: { u: Uebersicht; sa: number; sn: number }) {
  const k = useEditorKontext();
  const { editor, fokus } = k;
  const v = vergleicheBetraege(sa, sn);
  const wort = v.art === 'mehrbeitrag' ? 'Mehrbeitrag' : 'Ersparnis';
  const neu = () => {
    const i = editor.stichpunktAnlegen('');
    fokus.fokus(`sp:${i}`);
  };
  return (
    <div className={`vorteile ${u.vorteile.aktiv ? '' : 'aus'}`}>
      <h3>
        Vorteile der Änderungen
        <span className="spacer" />
        <Schalter an={u.vorteile.aktiv} onChange={(an) => editor.vorteileAktiv(an)} title="An: Vorteile erscheinen im PDF (nur „Neu“ und „Beide“)">
          <small>im PDF</small>
        </Schalter>
      </h3>
      <ul>
        {u.vorteile.stichpunkte.map((s, i) => (
          <li key={`${i}-${u.vorteile.stichpunkte.length}`}>
            <Sym n="check" />
            <TextFeld
              cls="stichpunkt"
              label={`Stichpunkt ${i + 1}`}
              wert={s}
              placeholder="Vorteil beschreiben"
              feldRef={(el) => fokus.setze(`sp:${i}`, el)}
              onCommit={(w) => editor.stichpunktAendern(i, w)}
              onEnter={() => {
                const j = editor.stichpunktAnlegen('', i + 1);
                fokus.fokus(`sp:${j}`);
              }}
              onEsc={() => {
                if (!editor.lesen().vorteile.stichpunkte[i]) editor.stichpunktLoeschen(i);
              }}
            />
            <button type="button" className="v2-del x knopf-rein sp-x" title="Stichpunkt löschen" tabIndex={-1} onClick={() => editor.stichpunktLoeschen(i)}>
              <Sym n="x" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="add knopf-rein" onClick={neu}>
        <Sym n="plus" /> Stichpunkt hinzufügen
      </button>
      {u.ersparnisAnzeigen && v.art !== 'gleich' && (
        <div className={`ersparnis ${v.art}`}>
          <div>
            <span>{wort} pro Monat (automatisch)</span>
            <b>{formatBetrag(v.betragMonat)}</b>
          </div>
          <div>
            <span>{wort} pro Jahr (automatisch)</span>
            <b>{formatBetrag(v.betragJahr)}</b>
          </div>
        </div>
      )}
    </div>
  );
}


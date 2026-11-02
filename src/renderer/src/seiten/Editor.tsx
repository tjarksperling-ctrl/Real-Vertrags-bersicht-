/** Editor einer Übersicht: Kopfzeile, Bereichsleiste, Bereiche, Gesamtbetrag, Hinweis mit „Rückgängig“. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as Y from 'yjs';
import {
  BEREICH_NAME,
  BEREICH_TYPEN,
  Editor,
  fassungSumme,
  formatBetrag,
  type BereichTyp,
  type FassungName,
  type Katalog,
  type Kunde,
} from '../../../shared';
import { useDocVersion } from '../daten/hooks';
import { Avatar, STRG, Schalter, Sym } from '../komponenten/ui';
import { Bereich, BereichAus, FARBE } from '../editor/Bereich';
import { EditorKontext, FokusRegister, type EditorKontextWert } from '../editor/kontext';

export interface HinweisDaten {
  text: string;
  n: number;
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
      <button type="button" className="ub-toast-a knopf-rein" onClick={onRueckgaengig}>
        <Sym n="undo" /> Rückgängig
      </button>
      <span className="v2-tk">{STRG} + Z</span>
    </div>
  );
}

/** Text der dunklen Gesamt-Kachel in der Bereichsleiste: „Gesamtbetrag ohne Darlehen“. */
export function gesamtLabel(aus: BereichTyp[]): string {
  if (aus.length === 0) return 'Gesamtbetrag monatlich';
  return `Gesamtbetrag ohne ${aus.map((t) => BEREICH_NAME[t]).join(' und ')}`;
}

export function EditorSeite({
  doc,
  kunde,
  katalog,
  ansicht,
  setAnsicht,
  band,
}: {
  band?: React.ReactNode;
  doc: Y.Doc;
  kunde: Kunde;
  katalog: Katalog | null;
  ansicht: FassungName;
  setAnsicht: (a: FassungName) => void;
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
  const [titelBearbeiten, setTitelBearbeiten] = useState(false);
  const inhalt = useRef<HTMLDivElement>(null);
  const fassung = ansicht;

  const hinweis = useCallback((text: string) => setHinweis((h) => ({ text, n: (h?.n ?? 0) + 1 })), []);
  const zu = useCallback(() => setHinweis(null), []);

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
  };

  // Tastatur: Strg+Z / Strg+Y (Mac ⇧⌘Z), Entf auf markierter Zeile (Festlegung 3 und 6)
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
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !imFeld && markiert) {
        e.preventDefault();
        const r = editor.vertragLoeschen(fassung, markiert);
        if (r) hinweis(`Vertrag „${r.name || 'ohne Namen'}“ gelöscht`);
        setMarkiert(null);
      } else if (e.key === 'Escape' && !imFeld) {
        setMarkiert(null);
        setSymbolOffen(null);
      }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [editor, fassung, markiert, hinweis]);

  useEffect(() => {
    const klick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest?.('tr[data-vertrag]')) setMarkiert(null);
    };
    window.addEventListener('mousedown', klick);
    return () => window.removeEventListener('mousedown', klick);
  }, []);

  const f = u[fassung];
  const summe = fassungSumme(f);
  const aus = BEREICH_TYPEN.filter((t) => !f.bereiche[t].aktiv);

  const aktivSetzen = (t: BereichTyp, an: boolean) => {
    const vorher = summe.gesamtMonat;
    editor.bereichAktiv(fassung, t, an);
    if (!an) {
      const nachher = fassungSumme(editor.lesen()[fassung]).gesamtMonat;
      hinweis(`„${BEREICH_NAME[t]}“ abgewählt – Gesamtbetrag jetzt ${formatBetrag(nachher)} statt ${formatBetrag(vorher)}`);
    }
  };

  const titel = u.titel || 'Vertragsübersicht';

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
                ['aktuell', 'Aktuell'],
                ['neu', 'Neu'],
              ] as const
            ).map(([a, t]) => (
              <button
                type="button"
                role="tab"
                key={a}
                aria-selected={ansicht === a}
                className={`knopf-rein ${ansicht === a ? 'on' : ''}`}
                onClick={() => setAnsicht(a)}
                disabled={a === 'neu'}
                title={a === 'neu' ? 'folgt mit Meilenstein 3' : undefined}
              >
                {t}
              </button>
            ))}
            <button type="button" role="tab" className="knopf-rein" disabled title="folgt mit Meilenstein 3">
              Nebeneinander
            </button>
          </div>
          <Schalter
            an={u.syncAktiv}
            cls="sync"
            onChange={(an) => editor.syncSetzen(an)}
            title="An: Was Sie in „Aktuell“ ändern, wird sofort auch in „Neu“ geändert. Aus: „Neu“ bleibt unverändert, nichts wird rückwirkend übernommen."
          >
            In „Neu“ übernehmen
          </Schalter>
          <span className="spacer" />
          <button type="button" className="btn" disabled title="folgt mit Meilenstein 5">
            <Sym n="tasks" /> Aufgaben
          </button>
          <button type="button" className="btn" disabled title="folgt mit Meilenstein 5">
            <Sym n="monitor" /> Auf Desktop speichern
          </button>
          <button type="button" className="btn primary" disabled title="folgt mit Meilenstein 4">
            <Sym n="pdf" /> PDF / E-Mail
          </button>
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
          <div className="bl-total">
            <small>{gesamtLabel(aus)}</small>
            <b>{formatBetrag(summe.gesamtMonat)}</b>
          </div>
        </div>
        <div className="content narrow ub v2e b13" ref={inhalt}>
          {band}
          {BEREICH_TYPEN.filter((t) => !nur || t === nur).map((t) =>
            f.bereiche[t].aktiv ? (
              <Bereich key={t} typ={t} b={f.bereiche[t]} s={summe.bereiche[t]} />
            ) : (
              <BereichAus key={t} typ={t} b={f.bereiche[t]} s={summe.bereiche[t]} onZuschalten={() => aktivSetzen(t, true)} />
            ),
          )}
          {!nur && (
            <div className="gesamt v1">
              <span>Gesamtbetrag monatlich</span>
              {aus.length > 0 && (
                <>
                  <span className="spacer" />
                  <div className="neben">
                    {4 - aus.length} von 4 Bereichen
                    <br />
                    ohne {aus.map((t) => BEREICH_NAME[t]).join(' und ')} (
                    {formatBetrag(aus.reduce((x, t) => x + summe.bereiche[t].monat, 0))} / Monat)
                  </div>
                </>
              )}
              <b>{formatBetrag(summe.gesamtMonat)}</b>
            </div>
          )}
        </div>
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

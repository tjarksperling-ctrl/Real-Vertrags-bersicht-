/**
 * Eingabefelder direkt in der Zeile (Bild 12 v4: anklicken und tippen, keine weißen Felder).
 * Gespeichert wird beim Verlassen des Feldes oder mit Enter; Esc bricht ab (Festlegung 6).
 */
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { formatBetrag, formatDatum, formatMonat, leseBetrag, leseDatum, leseMonat, type Betrag } from '../../../shared';
import { Sym } from '../komponenten/ui';

export interface FeldSteuerung {
  /** Registriert das Element für gezieltes Fokussieren (z. B. nach „+ Vertrag“). */
  feldRef?: (el: HTMLElement | null) => void;
  /** Enter gedrückt (nach dem Speichern). */
  onEnter?: () => void;
  /** Esc gedrückt (nach dem Zurücksetzen). */
  onEsc?: () => void;
  /** Zusätzliche Tasten (z. B. Vorschlagsliste); true = erledigt. `verwerfen` vergisst die Eingabe. */
  onTaste?: (e: KeyboardEvent<HTMLElement>, verwerfen: () => void) => boolean;
  /** Änderung während des Tippens (z. B. für Vorschläge). */
  onTippen?: (text: string) => void;
  onFokus?: () => void;
  onVerlassen?: () => void;
}

type TextProps = FeldSteuerung & {
  wert: string;
  onCommit: (wert: string) => void;
  mehrzeilig?: boolean;
  placeholder?: string;
  cls?: string;
  label: string;
  danach?: ReactNode;
};

/** Text: einzeilig (Vertrag, Untergruppe) oder mehrzeilig (Bemerkung, Shift+Enter = neue Zeile). */
export function TextFeld(p: TextProps) {
  const [entwurf, setEntwurf] = useState<string | null>(null);
  const abbruch = useRef(false);
  const text = entwurf ?? p.wert;

  const commit = () => {
    if (entwurf !== null && entwurf !== p.wert) p.onCommit(p.mehrzeilig ? entwurf.replace(/\s+$/, '') : entwurf.trim());
    setEntwurf(null);
  };

  const verwerfen = () => {
    abbruch.current = true;
    setEntwurf(null);
  };
  const taste = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (p.onTaste?.(e, verwerfen)) return;
    if (e.key === 'Enter' && !(p.mehrzeilig && e.shiftKey)) {
      e.preventDefault();
      commit();
      p.onEnter?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      abbruch.current = true;
      setEntwurf(null);
      (e.target as HTMLElement).blur();
      p.onEsc?.();
    }
  };

  const gemeinsam = {
    ref: (el: HTMLInputElement | HTMLTextAreaElement | null) => p.feldRef?.(el),
    className: `zelle ${p.cls ?? ''}`,
    value: text,
    'data-geaendert': entwurf !== null && entwurf !== p.wert ? '1' : undefined,
    placeholder: p.placeholder,
    'aria-label': p.label,
    spellCheck: false,
    onFocus: () => {
      abbruch.current = false;
      p.onFokus?.();
    },
    onChange: (e: { target: { value: string } }) => {
      setEntwurf(e.target.value);
      p.onTippen?.(e.target.value);
    },
    onBlur: () => {
      if (!abbruch.current) commit();
      abbruch.current = false;
      p.onVerlassen?.();
    },
    onKeyDown: taste,
  };
  return (
    <>
      {p.mehrzeilig ? <textarea rows={1} {...gemeinsam} /> : <input {...gemeinsam} />}
      {p.danach}
    </>
  );
}

type BetragProps = FeldSteuerung & {
  wert: Betrag;
  onCommit: (wert: Betrag) => void;
  placeholder?: string;
  label: string;
  /** Leeres Feld als „–“ zeigen (optionale Beträge). */
  strich?: boolean;
  cls?: string;
};

/** Betrag in Euro: Anzeige „1.234,56 €“, beim Tippen „1234,56“; ungültige Eingabe wird verworfen. */
export function BetragFeld(p: BetragProps) {
  const [entwurf, setEntwurf] = useState<string | null>(null);
  const [fehler, setFehler] = useState(false);
  const abbruch = useRef(false);
  // Optionale Beträge: leer und 0 erscheinen als „–“ (wie im Mockup)
  const anzeige = p.wert === null || p.wert === 0 ? '' : formatBetrag(p.wert);

  const commit = () => {
    if (entwurf === null) return;
    const b = leseBetrag(entwurf);
    if (b === undefined) {
      setFehler(true);
      setTimeout(() => setFehler(false), 1200);
    } else if (b !== p.wert) p.onCommit(b);
    setEntwurf(null);
  };

  return (
    <input
      ref={(el) => p.feldRef?.(el)}
      className={`zelle betrag ${fehler ? 'fehler' : ''} ${anzeige === '' && (p.strich || p.wert === 0) ? 'strich' : ''} ${p.cls ?? ''}`}
      value={entwurf ?? anzeige}
      data-geaendert={entwurf !== null && entwurf !== (p.wert === null ? '' : formatBetrag(p.wert, { mitEuro: false })) ? '1' : undefined}
      placeholder={p.strich || p.wert === 0 ? '–' : (p.placeholder ?? '0,00 €')}
      aria-label={p.label}
      inputMode="decimal"
      onFocus={(e) => {
        abbruch.current = false;
        setEntwurf(p.wert === null ? '' : formatBetrag(p.wert, { mitEuro: false }));
        const el = e.currentTarget;
        requestAnimationFrame(() => el.select());
        p.onFokus?.();
      }}
      onChange={(e) => setEntwurf(e.target.value)}
      onBlur={() => {
        if (!abbruch.current) commit();
        else setEntwurf(null);
        abbruch.current = false;
        p.onVerlassen?.();
      }}
      onKeyDown={(e) => {
        if (p.onTaste?.(e, () => (abbruch.current = true))) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
          p.onEnter?.();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          abbruch.current = true;
          e.currentTarget.blur();
          p.onEsc?.();
        }
      }}
    />
  );
}

type DatumProps = FeldSteuerung & {
  wert: string | null;
  onCommit: (wert: string | null) => void;
  art: 'datum' | 'monat';
  label: string;
};

/** Datum („TT.MM.JJJJ“) bzw. Monat („MM/JJJJ“): tippen oder über das Kalender-Symbol wählen. */
export function DatumFeld(p: DatumProps) {
  const [entwurf, setEntwurf] = useState<string | null>(null);
  const [fehler, setFehler] = useState(false);
  const abbruch = useRef(false);
  const picker = useRef<HTMLInputElement>(null);
  const format = p.art === 'datum' ? formatDatum : formatMonat;
  const lese = p.art === 'datum' ? leseDatum : leseMonat;

  const commit = () => {
    if (entwurf === null) return;
    const w = lese(entwurf);
    if (w === undefined) {
      setFehler(true);
      setTimeout(() => setFehler(false), 1200);
    } else if (w !== p.wert) p.onCommit(w);
    setEntwurf(null);
  };

  return (
    <span className="datum-feld">
      <input
        ref={(el) => p.feldRef?.(el)}
        className={`zelle datum ${fehler ? 'fehler' : ''}`}
        value={entwurf ?? format(p.wert)}
        data-geaendert={entwurf !== null && entwurf !== format(p.wert) ? '1' : undefined}
        placeholder={p.art === 'datum' ? 'TT.MM.JJJJ' : 'MM/JJJJ'}
        aria-label={p.label}
        onFocus={() => {
          abbruch.current = false;
          p.onFokus?.();
        }}
        onChange={(e) => setEntwurf(e.target.value)}
        onBlur={() => {
          if (!abbruch.current) commit();
          else setEntwurf(null);
          abbruch.current = false;
          p.onVerlassen?.();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            p.onEnter?.();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            abbruch.current = true;
            e.currentTarget.blur();
          }
        }}
      />
      <button type="button" className="kal knopf-rein" tabIndex={-1} title="Im Kalender wählen" onClick={() => picker.current?.showPicker()}>
        <Sym n="calendar" />
      </button>
      <input
        ref={picker}
        type={p.art === 'datum' ? 'date' : 'month'}
        className="picker-versteckt"
        tabIndex={-1}
        value={p.wert ?? ''}
        onChange={(e) => e.target.value && p.onCommit(e.target.value)}
      />
    </span>
  );
}

export interface Option<T extends string> {
  wert: T;
  text: string;
  kurz?: string;
  hinweis?: string;
}

/** Auswahl wie im Mockup (Zahlweise, Art der Leistung): Klick öffnet die Liste, Pfeiltasten + Enter. */
export function Auswahl<T extends string>(p: {
  wert: T;
  optionen: Option<T>[];
  onChange: (w: T) => void;
  label: string;
  cls?: string;
  kurz?: boolean;
  feldRef?: (el: HTMLElement | null) => void;
  onEnter?: () => void;
}) {
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(0);
  const box = useRef<HTMLSpanElement>(null);
  const akt = p.optionen.find((o) => o.wert === p.wert) ?? p.optionen[0]!;

  useEffect(() => {
    if (!offen) return;
    const zu = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOffen(false);
    };
    window.addEventListener('mousedown', zu);
    return () => window.removeEventListener('mousedown', zu);
  }, [offen]);

  const oeffnen = () => {
    setAktiv(Math.max(0, p.optionen.findIndex((o) => o.wert === p.wert)));
    setOffen(true);
  };
  const waehlen = (w: T) => {
    setOffen(false);
    if (w !== p.wert) p.onChange(w);
  };

  return (
    <span className="auswahl" ref={box}>
      <button
        type="button"
        ref={(el) => p.feldRef?.(el)}
        className={`${p.cls ?? 'zw-sel'} knopf-rein ${offen ? 'open' : ''}`}
        aria-label={p.label}
        aria-haspopup="listbox"
        aria-expanded={offen}
        onClick={() => (offen ? setOffen(false) : oeffnen())}
        onKeyDown={(e) => {
          if (!offen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ') {
              e.preventDefault();
              oeffnen();
            } else if (e.key === 'Enter') {
              e.preventDefault();
              p.onEnter?.();
            }
            return;
          }
          if (e.key === 'ArrowDown') setAktiv((a) => Math.min(a + 1, p.optionen.length - 1));
          else if (e.key === 'ArrowUp') setAktiv((a) => Math.max(a - 1, 0));
          else if (e.key === 'Enter' || e.key === ' ') waehlen(p.optionen[aktiv]!.wert);
          else if (e.key === 'Escape') setOffen(false);
          else if (e.key === 'Tab') setOffen(false);
          else return;
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {p.kurz ? (akt.kurz ?? akt.text) : akt.text}
        <Sym n="down" />
      </button>
      {offen && (
        <span className={`zw-menu ${p.cls === 'v2-art' ? 'v2-artmenu' : ''}`} role="listbox">
          {p.optionen.map((o, i) => (
            <span
              key={o.wert}
              role="option"
              aria-selected={o.wert === p.wert}
              className={i === aktiv ? 'on' : ''}
              onMouseEnter={() => setAktiv(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                waehlen(o.wert);
              }}
            >
              <i className="ck">{o.wert === p.wert && <Sym n="check" />}</i>
              {o.text}
              {o.hinweis && <small>{o.hinweis}</small>}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

/** Lässt ein mehrzeiliges Feld mit dem Inhalt wachsen (Fallback, falls field-sizing fehlt). */
export function useAutoHoehe(el: HTMLTextAreaElement | null, text: string): void {
  useLayoutEffect(() => {
    if (!el || CSS.supports('field-sizing', 'content')) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [el, text]);
}

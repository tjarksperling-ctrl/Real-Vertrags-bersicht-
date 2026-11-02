/** Eine Vertragszeile – alle Spalten direkt bearbeitbar, Griff zum Verschieben, × zum Löschen (Bild 12 v4). */
import { useMemo, useState, type CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  vorschlaege,
  type BereichTyp,
  type Betrag,
  type FeldWert,
  type Leistungsart,
  type Vertrag,
  type VertragAV,
  type VertragFeld,
  type Vorschlag,
  type Zahlweise,
} from '../../../shared';
import { Sym } from '../komponenten/ui';
import { Auswahl, BetragFeld, DatumFeld, TextFeld } from './felder';
import { useEditorKontext } from './kontext';
import { LEISTUNG_OPTIONEN, SPALTEN, ZAHLWEISE_OPTIONEN, type Spalte } from './spalten';
import { ZAHLWEISE_TEXT } from '../../../shared';

export function istLeer(v: Vertrag): boolean {
  const r = v as unknown as Record<string, unknown>;
  for (const [k, w] of Object.entries(r)) {
    if (k === 'id' || k === 'quelleId' || k === 'zahlweise') continue;
    if (k === 'leistung') {
      if ((w as VertragAV['leistung']).betrag !== null) return false;
    } else if (w !== null && w !== '') return false;
  }
  return true;
}

function feldWert(v: Vertrag, feld: VertragFeld): unknown {
  if (feld === 'leistung.betrag') return (v as VertragAV).leistung.betrag;
  if (feld === 'leistung.art') return (v as VertragAV).leistung.art;
  return (v as unknown as Record<string, unknown>)[feld];
}

export function VertragZeile({
  typ,
  ugId,
  v,
  ugNamen,
  ziehbar = true,
  zusatz,
}: {
  typ: BereichTyp;
  ugId: string;
  v: Vertrag;
  /** Untergruppen des Bereichs (für „wird dorthin verschoben“). */
  ugNamen: { id: string; name: string }[];
  ziehbar?: boolean;
  /** Zusatz je Zelle (z. B. vorheriger Wert in „Neu“, M3). */
  zusatz?: ((feld: VertragFeld) => React.ReactNode) | undefined;
}) {
  const k = useEditorKontext();
  const { editor, fassung, fokus } = k;
  const sortable = useSortable({ id: `v:${v.id}`, data: { typ: 'v', ugId }, disabled: !ziehbar });
  const stil: CSSProperties = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  };

  const aendern = (feld: VertragFeld, wert: FeldWert) => editor.vertragAendern(fassung, v.id, feld, wert);
  const key = (feld: VertragFeld) => `${v.id}:${feld}`;
  const ref = (feld: VertragFeld) => (el: HTMLElement | null) => fokus.setze(key(feld), el);

  /** Enter: gleiche Spalte nächste Zeile; in der letzten Zeile neuer Vertrag (Festlegung 6). */
  const weiter = (feld: VertragFeld) => {
    const u = editor.lesen();
    const ug = u[fassung].bereiche[typ].untergruppen.find((x) => x.id === ugId);
    if (!ug) return;
    const i = ug.vertraege.findIndex((x) => x.id === v.id);
    const naechster = ug.vertraege[i + 1];
    if (naechster) {
      fokus.fokus(`${naechster.id}:${feld}`);
      return;
    }
    const jetzt = ug.vertraege[i];
    if (jetzt && istLeer(jetzt)) {
      (document.activeElement as HTMLElement | null)?.blur();
      k.setNeueZeile(null);
      return;
    }
    const neu = editor.vertragAnlegen(fassung, ugId);
    if (neu) {
      k.setNeueZeile(neu);
      fokus.fokus(`${neu}:name`);
    }
  };

  /** Esc in einer leeren, neuen Zeile entfernt sie wieder („Esc fertig“). */
  const escLeer = () => {
    const u = editor.lesen();
    const akt = u[fassung].bereiche[typ].untergruppen.find((x) => x.id === ugId)?.vertraege.find((x) => x.id === v.id);
    if (akt && istLeer(akt)) editor.vertragLoeschen(fassung, v.id);
    k.setNeueZeile(null);
  };

  const loeschen = () => {
    const r = editor.vertragLoeschen(fassung, v.id);
    if (r) k.hinweis(`Vertrag „${r.name || 'ohne Namen'}“ gelöscht`);
  };

  const spalten = SPALTEN[typ];
  return (
    <tr
      ref={sortable.setNodeRef}
      style={stil}
      className={`${k.markiert === v.id ? 'focus markiert' : ''} ${sortable.isDragging ? 'zieht' : ''}`}
      data-vertrag={v.id}
      onMouseDown={(e) => {
        if (!(e.target as HTMLElement).closest('input,textarea,button')) k.setMarkiert(v.id);
      }}
      onFocus={() => k.setMarkiert(null)}
    >
      <td className="g grip" ref={sortable.setActivatorNodeRef} {...(ziehbar ? sortable.listeners : {})} {...sortable.attributes} title="Ziehen zum Verschieben">
        <Sym n="grip" />
      </td>
      {spalten.map((s, i) => (
        <Zelle
          key={s.feld}
          s={s}
          v={v}
          typ={typ}
          ugId={ugId}
          ugNamen={ugNamen}
          letzte={i === spalten.length - 1}
          aendern={aendern}
          feldRef={ref}
          weiter={weiter}
          escLeer={escLeer}
          loeschen={loeschen}
          zusatz={zusatz?.(s.feld)}
        />
      ))}
    </tr>
  );
}

function Zelle({
  s,
  v,
  typ,
  ugId,
  ugNamen,
  letzte,
  aendern,
  feldRef,
  weiter,
  escLeer,
  loeschen,
  zusatz,
}: {
  s: Spalte;
  v: Vertrag;
  typ: BereichTyp;
  ugId: string;
  ugNamen: { id: string; name: string }[];
  letzte: boolean;
  aendern: (feld: VertragFeld, wert: FeldWert) => void;
  feldRef: (feld: VertragFeld) => (el: HTMLElement | null) => void;
  weiter: (feld: VertragFeld) => void;
  escLeer: () => void;
  loeschen: () => void;
  zusatz?: React.ReactNode;
}) {
  const x = (
    <button type="button" className="v2-del x knopf-rein" title="Vertrag löschen – sofort, mit Rückgängig" tabIndex={-1} onClick={loeschen}>
      <Sym n="x" />
    </button>
  );
  const ende = letzte ? x : null;
  const gemeinsam = { feldRef: feldRef(s.feld), onEnter: () => weiter(s.feld), onEsc: escLeer };

  switch (s.art) {
    case 'name':
      return <NameZelle v={v} typ={typ} ugId={ugId} ugNamen={ugNamen} aendern={aendern} gemeinsam={gemeinsam} />;
    case 'bem':
      return (
        <td className="bem">
          <TextFeld {...gemeinsam} label="Bemerkung" mehrzeilig wert={v.bemerkung} placeholder="Bemerkung" onCommit={(w) => aendern('bemerkung', w)} />
          {zusatz}
          {ende}
        </td>
      );
    case 'betrag':
      return (
        <td className="num">
          <BetragFeld {...gemeinsam} label={s.titel} wert={feldWert(v, s.feld) as Betrag} strich={s.strich ?? false} onCommit={(w) => aendern(s.feld, w)} />
          {zusatz}
          {ende}
        </td>
      );
    case 'zw':
      return (
        <td className="zw">
          <Auswahl
            feldRef={gemeinsam.feldRef}
            onEnter={gemeinsam.onEnter}
            label="Zahlweise"
            wert={(v as { zahlweise: Zahlweise }).zahlweise}
            optionen={ZAHLWEISE_OPTIONEN}
            onChange={(w) => aendern('zahlweise', w)}
          />
          {ende}
        </td>
      );
    case 'rate':
      return (
        <td className="num rate-zelle">
          <span className="rate-reihe">
            <BetragFeld {...gemeinsam} label="Rate/Tilgung" wert={feldWert(v, 'rate') as Betrag} onCommit={(w) => aendern('rate', w)} />
            <Auswahl
              cls="v2-art"
              kurz
              label="Zahlweise der Rate"
              wert={(v as { zahlweise: Zahlweise }).zahlweise}
              optionen={ZAHLWEISE_OPTIONEN}
              onChange={(w) => aendern('zahlweise', w)}
            />
          </span>
          {zusatz}
          {ende}
        </td>
      );
    case 'leistung': {
      const l = (v as VertragAV).leistung;
      return (
        <td className="num v2-lz">
          <BetragFeld {...gemeinsam} label="Leistung/Guthaben" wert={l.betrag} strich onCommit={(w) => aendern('leistung.betrag', w)} />
          <Auswahl<Leistungsart>
            cls="v2-art"
            label="Art der Leistung"
            wert={l.art}
            optionen={LEISTUNG_OPTIONEN}
            onChange={(w) => aendern('leistung.art', w)}
          />
          {ende}
        </td>
      );
    }
    case 'datum':
    case 'monat':
      return (
        <td className={s.art === 'datum' ? 'num' : 'zw'}>
          <DatumFeld
            {...gemeinsam}
            art={s.art}
            label={s.titel}
            wert={(feldWert(v, s.feld) as string | null) ?? null}
            onCommit={(w) => aendern(s.feld, w)}
          />
          {ende}
        </td>
      );
  }
}

/** Vertragsname mit Vorschlägen beim Tippen (Bild 11 v1). */
function NameZelle({
  v,
  typ,
  ugId,
  ugNamen,
  aendern,
  gemeinsam,
}: {
  v: Vertrag;
  typ: BereichTyp;
  ugId: string;
  ugNamen: { id: string; name: string }[];
  aendern: (feld: VertragFeld, wert: FeldWert) => void;
  gemeinsam: { feldRef: (el: HTMLElement | null) => void; onEnter: () => void; onEsc: () => void };
}) {
  const k = useEditorKontext();
  const [text, setText] = useState<string | null>(null);
  const [aktiv, setAktiv] = useState(0);
  const [zu, setZu] = useState(false);
  const liste: Vorschlag[] = useMemo(
    () => (k.katalog && text !== null && !zu ? vorschlaege(k.katalog, typ, text, 3) : []),
    [k.katalog, typ, text, zu],
  );
  const erster = liste[0];
  const geist = erster && text && erster.name.toLocaleLowerCase('de').startsWith(text.toLocaleLowerCase('de')) ? erster.name.slice(text.length) : '';

  const uebernehmen = (s: Vorschlag) => {
    const { editor, fassung } = k;
    editor.vertragAendern(fassung, v.id, 'name', s.name);
    if (s.zahlweise && 'zahlweise' in v) editor.vertragAendern(fassung, v.id, 'zahlweise', s.zahlweise);
    const ziel = ugNamen.find((u) => u.name === s.ugName);
    if (ziel && ziel.id !== ugId) editor.vertragVerschieben(fassung, v.id, ziel.id, Number.MAX_SAFE_INTEGER);
    setText(null);
    setZu(true);
    requestAnimationFrame(() => k.fokus.fokus(`${v.id}:bemerkung`));
  };

  const offen = liste.length > 0;
  return (
    <td className={`vname ${offen ? 'ac-td' : ''}`}>
      <span className="ac-wrap">
        <TextFeld
          {...gemeinsam}
          label="Vertrag"
          wert={v.name}
          placeholder="Vertrag"
          onCommit={(w) => aendern('name', w)}
          onTippen={(t) => {
            setText(t);
            setAktiv(0);
            setZu(false);
          }}
          onVerlassen={() => setText(null)}
          onTaste={(e, verwerfen) => {
            if (!offen) return false;
            if (e.key === 'ArrowDown') setAktiv((a) => Math.min(a + 1, liste.length - 1));
            else if (e.key === 'ArrowUp') setAktiv((a) => Math.max(a - 1, 0));
            else if (e.key === 'Enter') {
              verwerfen();
              uebernehmen(liste[aktiv]!);
            }
            else if (e.key === 'Escape') setZu(true);
            else return false;
            e.preventDefault();
            return true;
          }}
        />
        {geist && aktiv === 0 && (
          <span className="ac-schatten" aria-hidden="true">
            <span className="unsichtbar">{text}</span>
            <span className="ac-ghost">{geist}</span>
          </span>
        )}
      </span>
      {offen && (
        <div className="ac-menu" role="listbox">
          <div className="ac-k">
            <Sym n="wand" /> Vorschläge aus der Agentur
          </div>
          {liste.map((s, i) => {
            const ziel = ugNamen.find((u) => u.name === s.ugName);
            const woanders = ziel && ziel.id !== ugId;
            const n = text?.length ?? 0;
            const beginnt = s.name.toLocaleLowerCase('de').startsWith((text ?? '').toLocaleLowerCase('de'));
            return (
              <div
                key={s.name}
                role="option"
                aria-selected={i === aktiv}
                className={`ac-i ${i === aktiv ? 'on' : ''}`}
                onMouseEnter={() => setAktiv(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  uebernehmen(s);
                }}
              >
                <span className="ac-n">
                  {beginnt ? (
                    <>
                      <b>{s.name.slice(0, n)}</b>
                      {s.name.slice(n)}
                    </>
                  ) : (
                    s.name
                  )}
                </span>
                <span className="ac-m">
                  {woanders ? `gehört zu „${s.ugName}“` : s.ugName}
                  {!woanders && s.zahlweise ? ` · meist ${ZAHLWEISE_TEXT[s.zahlweise]}` : ''}
                  {woanders && (
                    <span className="ac-move">
                      <Sym n="arrow" /> wird dorthin verschoben
                    </span>
                  )}
                </span>
                {s.anzahl > 0 && <span className="ac-z">{s.anzahl}×</span>}
              </div>
            );
          })}
          <div className="ac-f">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> auswählen
            </span>
            <span>
              <kbd>Enter</kbd> übernehmen
            </span>
            <span>
              <kbd>Esc</kbd> eigener Name „{text}“
            </span>
          </div>
        </div>
      )}
    </td>
  );
}

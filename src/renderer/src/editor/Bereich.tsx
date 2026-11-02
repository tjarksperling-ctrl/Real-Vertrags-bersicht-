/** Ein Bereich: farbiger Kopf, Spaltenköpfe einmal, Untergruppen-Karten mit Drag & Drop, Summen (Bild 2 v3, 12 v4, 13 v1). */
import { useState, type ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  BEREICH_NAME,
  formatBetrag,
  type Bereich as BereichDaten,
  type BereichSumme,
  type BereichTyp,
  type Vertrag,
  type VertragFeld,
} from '../../../shared';
import { Sym } from '../komponenten/ui';
import { useEditorKontext } from './kontext';
import { SPALTEN, START_SYMBOL, UG_SUMME } from './spalten';
import { Colgroup, Untergruppe } from './Untergruppe';

export const FARBE: Record<BereichTyp, string> = { VERS: 'vers', SPAR: 'spar', DARL: 'darl', AV: 'av' };
export const NUMMER: Record<BereichTyp, number> = { VERS: 1, SPAR: 2, DARL: 3, AV: 4 };

/** Summen im Bereichsfuß (SPAR Gesamtvermögen, DARL Gesamtrestschuld, Einmalbeträge nur wenn > 0). */
export function BereichSummen({ s, vergleich }: { s: BereichSumme; vergleich?: BereichSumme | undefined }) {
  const kv = (label: string, wert: number, alt?: number) => {
    const d = alt === undefined ? 0 : wert - alt;
    return (
      <div className="kv" key={label}>
        <span>{label}</span>
        <b>{formatBetrag(wert)}</b>
        {d !== 0 && <span className={`delta ${d < 0 ? 'minus' : 'plus'}`}>{formatBetrag(d, { mitVorzeichen: true })} ggü. Aktuell</span>}
      </div>
    );
  };
  const t = s.typ;
  return (
    <>
      {t === 'SPAR' && kv('Gesamtvermögen', s.gesamtvermoegen, vergleich?.gesamtvermoegen)}
      {t === 'DARL' && kv('Gesamtrestschuld', s.restschuld, vergleich?.restschuld)}
      {t !== 'DARL' && s.einmal > 0 && kv(t === 'AV' ? 'Einmalbeiträge' : 'Einmalbeträge', s.einmal, vergleich?.einmal)}
      {kv(`${UG_SUMME[t]} / Monat`, s.monat, vergleich?.monat)}
    </>
  );
}

/** Abgewählter Bereich: schmale graue Leiste an seinem Platz (Bild 13 v1). */
export function BereichAus({ typ, b, s, onZuschalten }: { typ: BereichTyp; b: BereichDaten; s: BereichSumme; onZuschalten: () => void }) {
  const n = b.untergruppen.reduce((x, u) => x + u.vertraege.length, 0);
  const werte = typ === 'DARL' ? `Rate ${formatBetrag(s.monat)} / Monat · Restschuld ${formatBetrag(s.restschuld)}` : `${formatBetrag(s.monat)} / Monat`;
  return (
    <section className={`bereich-aus ${FARBE[typ]}`} id={`bereich-${typ}`}>
      <button type="button" className="chk knopf-rein" title="Kästchen anklicken: Bereich wieder zuschalten" onClick={onZuschalten} />
      <span className="nr">{NUMMER[typ]}</span>
      <b>{BEREICH_NAME[typ]}</b>
      <span className="ba-tag">
        <Sym n="eyeoff" /> abgewählt
      </span>
      <span className="ba-info">
        {b.untergruppen.length} {b.untergruppen.length === 1 ? 'Untergruppe' : 'Untergruppen'} · {n} {n === 1 ? 'Vertrag bleibt' : 'Verträge bleiben'} gespeichert
        <br />
        <s>{werte}</s> – zählt nicht zum Gesamtbetrag, nicht im PDF
      </span>
      <span className="spacer" />
      <button type="button" className="ba-btn knopf-rein" onClick={onZuschalten}>
        <Sym n="check" /> Wieder zuschalten
      </button>
    </section>
  );
}

type Daten = { typ?: string; ugId?: string } | undefined;

/** Beim Ziehen einer Untergruppe zählen nur Untergruppen, beim Ziehen eines Vertrags nur Verträge/Untergruppen-Flächen. */
const kollision: CollisionDetection = (args) => {
  const art = (args.active.data.current as Daten)?.typ;
  const passend = args.droppableContainers.filter((c) => {
    const t = (c.data.current as Daten)?.typ;
    return art === 'ug' ? t === 'ug' : t === 'v' || t === 'ugdrop';
  });
  const treffer = pointerWithin({ ...args, droppableContainers: passend });
  if (treffer.length) {
    // Vertragszeile vor Untergruppen-Fläche
    return [...treffer].sort((a, b) => {
      const ta = (passend.find((c) => c.id === a.id)?.data.current as Daten)?.typ === 'v' ? 0 : 1;
      const tb = (passend.find((c) => c.id === b.id)?.data.current as Daten)?.typ === 'v' ? 0 : 1;
      return ta - tb;
    });
  }
  return closestCenter({ ...args, droppableContainers: passend });
};

export function Bereich({
  typ,
  b,
  s,
  vergleich,
  zusatz,
  ugSummeZusatz,
  seite = false,
  fassTag,
  nurIds,
}: {
  seite?: boolean;
  fassTag?: 'Aktuell' | 'Neu' | undefined;
  nurIds?: Set<string> | null | undefined;
  typ: BereichTyp;
  b: BereichDaten;
  s: BereichSumme;
  vergleich?: BereichSumme | undefined;
  zusatz?: ((v: Vertrag) => ((feld: VertragFeld) => ReactNode) | undefined) | undefined;
  ugSummeZusatz?: ((ugIndex: number) => ReactNode) | undefined;
}) {
  const k = useEditorKontext();
  const { editor, fassung } = k;
  const [zielUg, setZielUg] = useState<string | null>(null);
  const sensoren = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ugNamen = b.untergruppen.map((u) => ({ id: u.id, name: u.name }));

  const ugVon = (id: string): string | undefined => {
    if (id.startsWith('ug:') || id.startsWith('ugdrop:')) return id.slice(id.indexOf(':') + 1);
    const vid = id.slice(2);
    return b.untergruppen.find((u) => u.vertraege.some((v) => v.id === vid))?.id;
  };

  const ueber = (e: DragOverEvent) => {
    const art = (e.active.data.current as Daten)?.typ;
    if (art !== 'v' || !e.over) return setZielUg(null);
    const ziel = ugVon(String(e.over.id));
    setZielUg(ziel && ziel !== (e.active.data.current as Daten)?.ugId ? ziel : null);
  };

  const ende = (e: DragEndEvent) => {
    setZielUg(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const aId = String(active.id);
    const oId = String(over.id);
    if (aId.startsWith('ug:')) {
      const ziel = b.untergruppen.findIndex((u) => `ug:${u.id}` === oId);
      if (ziel >= 0) editor.untergruppeVerschieben(fassung, aId.slice(3), ziel);
      return;
    }
    const zielUgId = ugVon(oId);
    if (!zielUgId) return;
    const zug = b.untergruppen.find((u) => u.id === zielUgId)!;
    const index = oId.startsWith('v:') ? zug.vertraege.findIndex((v) => `v:${v.id}` === oId) : zug.vertraege.length;
    editor.vertragVerschieben(fassung, aId.slice(2), zielUgId, index);
  };

  const ugHinzu = () => {
    const id = editor.untergruppeAnlegen(fassung, typ, '', START_SYMBOL[typ]);
    k.setNeueUg(id);
    k.setSymbolOffen(id);
    k.fokus.fokus(`${id}:ugname`);
  };

  return (
    <section className={`bereich v1 ${FARBE[typ]} ${seite ? 'kompakt voll' : ''}`} id={seite ? undefined : `bereich-${typ}`}>
      <header className="bereich-kopf">
        <span className="nr">{NUMMER[typ]}</span>
        <h2>{BEREICH_NAME[typ]}</h2>
        <span className="spacer" />
        {fassTag && <span className={`fass ${fassTag === 'Neu' ? 'neu' : ''}`}>{fassTag}</span>}
      </header>
      <div className="spaltenkopf">
        <table className="vt">
          <Colgroup typ={typ} seite={seite} />
          <thead>
            <tr>
              {!seite && <th className="g" />}
              {SPALTEN[typ].map((sp) => (
                <th key={sp.feld} className={sp.num ? 'num' : ''}>
                  {sp.titel}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>
      <div className="ugs">
        <DndContext sensors={sensoren} collisionDetection={kollision} onDragOver={ueber} onDragEnd={ende} onDragCancel={() => setZielUg(null)}>
          <SortableContext items={b.untergruppen.map((u) => `ug:${u.id}`)} strategy={verticalListSortingStrategy}>
            {b.untergruppen.map((ug, i) => (nurIds && !ug.vertraege.some((v) => nurIds.has(v.id))) ? null : (
              <Untergruppe
                seite={seite}
                nurIds={nurIds}
                key={ug.id}
                typ={typ}
                ug={ug}
                summe={s.untergruppen[i]!}
                ugNamen={ugNamen}
                dropZiel={zielUg === ug.id}
                zusatz={zusatz}
                summeZusatz={ugSummeZusatz?.(i)}
              />
            ))}
          </SortableContext>
        </DndContext>
        {!seite && !nurIds && (
          <button type="button" className="add-ug v1 knopf-rein" onClick={ugHinzu}>
            <Sym n="plus" /> Untergruppe hinzufügen
          </button>
        )}
      </div>
      <footer className="bereich-summe v1">
        <span className="bs-label">{seite ? 'Summe' : `Summe ${BEREICH_NAME[typ]}`}</span>
        <span className="spacer" />
        <BereichSummen s={s} vergleich={vergleich} />
      </footer>
    </section>
  );
}

/** Untergruppe als getönte Karte: Griff, Symbol, Name, Mülleimer, Verträge, „+ Vertrag“, Summe (Bild 12 v4). */
import type { CSSProperties, ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatBetrag, type BereichTyp, type Untergruppe as UG, type UntergruppenSumme, type VertragFeld } from '../../../shared';
import type { Vertrag } from '../../../shared';
import { Sym } from '../komponenten/ui';
import { TextFeld } from './felder';
import { useEditorKontext } from './kontext';
import { BREITEN_SEITE, SPALTEN, SYMBOLE, UG_SUMME } from './spalten';
import { VertragZeile } from './VertragZeile';

export function Colgroup({ typ, seite = false }: { typ: BereichTyp; seite?: boolean }) {
  return (
    <colgroup>
      {!seite && <col style={{ width: 22 }} />}
      {SPALTEN[typ].map((s, i) => {
        const b = seite ? BREITEN_SEITE[typ][i] : s.breite;
        return <col key={s.feld} style={b ? { width: b } : undefined} />;
      })}
    </colgroup>
  );
}

export function Untergruppe({
  typ,
  ug,
  summe,
  ugNamen,
  dropZiel,
  zusatz,
  summeZusatz,
  seite = false,
  nurIds,
}: {
  seite?: boolean;
  /** Nur diese Verträge zeigen („Nur Änderungen zeigen“). */
  nurIds?: Set<string> | null | undefined;
  typ: BereichTyp;
  ug: UG;
  summe: UntergruppenSumme;
  ugNamen: { id: string; name: string }[];
  dropZiel: boolean;
  zusatz?: ((v: Vertrag) => ((feld: VertragFeld) => ReactNode) | undefined) | undefined;
  summeZusatz?: ReactNode;
}) {
  const k = useEditorKontext();
  const { editor, fassung, fokus } = k;
  const sortable = useSortable({ id: `ug:${ug.id}`, data: { typ: 'ug', ugId: ug.id } });
  const drop = useDroppable({ id: `ugdrop:${ug.id}`, data: { typ: 'ugdrop', ugId: ug.id } });
  const stil: CSSProperties = { transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition };
  const neu = k.neueUg === ug.id;
  const symbole = k.symbolOffen === ug.id;
  const zeilenHinweis = ug.vertraege.some((v) => v.id === k.neueZeile);
  const sichtbar = nurIds ? ug.vertraege.filter((v) => nurIds.has(v.id)) : ug.vertraege;

  const vertragHinzu = () => {
    const id = editor.vertragAnlegen(fassung, ug.id);
    if (id) {
      k.setNeueZeile(id);
      fokus.fokus(`${id}:name`);
    }
  };

  const nameFertig = () => {
    if (neu) {
      k.setNeueUg(null);
      k.setSymbolOffen(null);
      if (ug.vertraege.length === 0) vertragHinzu();
      else fokus.fokus(`${ug.vertraege[0]!.id}:name`);
    } else {
      (document.activeElement as HTMLElement | null)?.blur();
    }
  };

  const loeschen = () => {
    const r = editor.untergruppeLoeschen(fassung, ug.id);
    if (r) {
      if (k.symbolOffen === ug.id) k.setSymbolOffen(null);
      k.hinweis(`Untergruppe „${r.name || 'ohne Namen'}“ gelöscht${r.vertraege ? ` (${r.vertraege} ${r.vertraege === 1 ? 'Vertrag' : 'Verträge'})` : ''}`);
    }
  };

  return (
    <div
      ref={sortable.setNodeRef}
      style={stil}
      className={`ug v1 ${neu ? 'v2-ugneu' : ''} ${dropZiel ? 'drop-ziel' : ''} ${sortable.isDragging ? 'ub-drag zieht' : ''}`}
      data-ug={ug.id}
    >
      <div className="ug-kopf">
        {!seite && (
          <span className="grip" ref={sortable.setActivatorNodeRef} {...sortable.listeners} {...sortable.attributes} title="Ziehen zum Verschieben">
            <Sym n="grip" />
          </span>
        )}
        <button
          type="button"
          className={`ug-icon knopf-rein ${symbole ? 'v2-sym' : ''}`}
          title="Symbol ändern"
          onClick={() => k.setSymbolOffen(symbole ? null : ug.id)}
        >
          <Sym n={ug.symbol} />
        </button>
        <span className="name">
          <TextFeld
            cls="ug-name"
            label="Name der Untergruppe"
            wert={ug.name}
            placeholder="Name der Untergruppe"
            feldRef={(el) => fokus.setze(`${ug.id}:ugname`, el)}
            onCommit={(w) => editor.untergruppeAendern(fassung, ug.id, { name: w })}
            onEnter={nameFertig}
            onEsc={() => {
              if (neu) {
                k.setNeueUg(null);
                k.setSymbolOffen(null);
              }
            }}
          />
        </span>
        <button type="button" className="v2-del ug knopf-rein" title="Untergruppe löschen – sofort, mit Rückgängig" onClick={loeschen}>
          <Sym n="trash2" />
        </button>
      </div>
      {symbole && (
        <div className="v2-symrow">
          <span className="es-lab">Symbol</span>
          <span className="ub-syms v2">
            {SYMBOLE[typ].map((s) => (
              <button
                type="button"
                key={s}
                className={`knopf-rein ${s === ug.symbol ? 'on' : ''}`}
                title={s}
                onClick={() => {
                  editor.untergruppeAendern(fassung, ug.id, { symbol: s });
                  if (!neu) k.setSymbolOffen(null);
                  else fokus.fokus(`${ug.id}:ugname`);
                }}
              >
                <Sym n={s} />
              </button>
            ))}
          </span>
          {neu && (
            <span className="v2-keys">
              <kbd>Enter</kbd> fertig – danach direkt den ersten Vertrag eintragen
            </span>
          )}
        </div>
      )}
      <div ref={drop.setNodeRef} className="ug-inhalt">
        {sichtbar.length > 0 ? (
          <table className="vt">
            <Colgroup typ={typ} seite={seite} />
            <tbody>
              <SortableContext items={sichtbar.map((v) => `v:${v.id}`)} strategy={verticalListSortingStrategy}>
                {sichtbar.map((v) => (
                  <VertragZeile key={v.id} typ={typ} ugId={ug.id} v={v} ugNamen={ugNamen} zusatz={zusatz?.(v)} seite={seite} />
                ))}
              </SortableContext>
            </tbody>
          </table>
        ) : (
          !neu && !nurIds && <div className="ug-leer">Noch keine Verträge – erscheint erst im PDF, wenn ein Vertrag eingetragen ist</div>
        )}
        {!neu && (
          <div className="ug-fuss">
            {zeilenHinweis ? (
              <span className="v2-keys">
                <kbd>Tab</kbd> nächstes Feld · <kbd>Enter</kbd> noch ein Vertrag · <kbd>Esc</kbd> fertig
              </span>
            ) : (
              <button type="button" className="add-v knopf-rein" onClick={vertragHinzu}>
                <Sym n="plus" /> Vertrag
              </button>
            )}
            <span className="summe">
              <small>{UG_SUMME[typ]} / Monat</small> {formatBetrag(summe.monat)}
              {summeZusatz}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Einstellungen → Schnellstart (Bild 8 v1): 5–8 Links, Reihenfolge per Griff, Klick zum Bearbeiten. */
import { useState } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LINK_FARBEN, LINK_SYMBOLE, MAX_LINKS, istWebseite, neueId, symbolVorschlag, zielGueltig, zielNormal, type SchnellstartLink } from '../../../../shared';
import { Sym } from '../../komponenten/ui';
import { LinkSymbol } from '../../seiten/Start';

function Zeile({ l, offen, onOeffnen, onAendern, onEntfernen, onFertig }: { l: SchnellstartLink; offen: boolean; onOeffnen: () => void; onAendern: (l: SchnellstartLink) => void; onEntfernen: () => void; onFertig: () => void }) {
  const s = useSortable({ id: l.id, disabled: offen });
  const stil = { transform: CSS.Translate.toString(s.transform), transition: s.transition };
  const web = istWebseite(l.ziel);
  const gueltig = zielGueltig(l.ziel) && !!l.name.trim();
  if (offen)
    return (
      <div ref={s.setNodeRef} style={stil} className="es-l edit">
        <span className="es-grip">
          <Sym n="grip" />
        </span>
        <LinkSymbol l={l} />
        <div className="es-ed">
          <div className="es-ed-r">
            <input className="kk-input es-n" autoFocus value={l.name} placeholder="Name" aria-label="Name" onChange={(e) => onAendern({ ...l, name: e.target.value })} />
            <label className={`kk-input es-z ${l.ziel && !zielGueltig(l.ziel) ? 'fehler' : ''}`}>
              <Sym n={web || !l.ziel ? 'globe' : 'monitor'} />
              <input
                className="eingabe-rein"
                value={l.ziel}
                placeholder="https://… oder Programmpfad"
                aria-label="Adresse oder Programm"
                onChange={(e) => onAendern({ ...l, ziel: e.target.value })}
                onBlur={(e) => {
                  const z = zielNormal(e.target.value);
                  onAendern({ ...l, ziel: z, symbol: l.symbol === 'globe' ? symbolVorschlag(`${l.name} ${z}`) : l.symbol });
                }}
              />
            </label>
          </div>
          <div className="es-ed-r">
            <span className="es-lab">Symbol</span>
            <span className="es-syms">
              {LINK_SYMBOLE.map((n) => (
                <button key={n} type="button" className={`knopf-rein ${l.symbol === n ? 'on' : ''}`} aria-label={`Symbol ${n}`} onClick={() => onAendern({ ...l, symbol: n })}>
                  <Sym n={n} />
                </button>
              ))}
            </span>
            <span className="es-lab">Farbe</span>
            <span className="es-farben">
              {LINK_FARBEN.map((f) => (
                <button key={f} type="button" className={`knopf-rein ${l.farbe === f ? 'on' : ''}`} style={{ background: f }} aria-label={`Farbe ${f}`} onClick={() => onAendern({ ...l, farbe: f })} />
              ))}
            </span>
            <span className="spacer"></span>
            <button type="button" className="btn ghost kk-trennen" onClick={onEntfernen}>
              Entfernen
            </button>
            <button type="button" className="btn primary" disabled={!gueltig} title={gueltig ? undefined : 'Name und gültige Adresse bzw. Programmpfad eintragen'} onClick={onFertig}>
              Fertig
            </button>
          </div>
        </div>
      </div>
    );
  return (
    <div ref={s.setNodeRef} style={stil} className={`es-l ${s.isDragging ? 'drag' : ''}`} role="button" tabIndex={0} onClick={onOeffnen} onKeyDown={(e) => e.key === 'Enter' && onOeffnen()}>
      <span className="es-grip" {...s.attributes} {...s.listeners} onClick={(e) => e.stopPropagation()}>
        <Sym n="grip" />
      </span>
      <LinkSymbol l={l} />
      <b>{l.name || 'Ohne Namen'}</b>
      <span className="es-typ">{web ? 'Webseite' : 'App'}</span>
      <span className="es-ziel">{l.beschreibung || l.ziel}</span>
      <span className="es-akt">
        <Sym n="more" />
      </span>
    </div>
  );
}

export function SchnellstartSeite({ links, onChange }: { links: SchnellstartLink[]; onChange: (l: SchnellstartLink[]) => void }) {
  const [offen, setOffen] = useState<string | null>(null);
  const sensoren = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const voll = links.length >= MAX_LINKS;
  const neu = (l: Omit<SchnellstartLink, 'id'>) => {
    const x = { ...l, id: neueId() };
    onChange([...links, x]);
    setOffen(x.id);
  };
  const ende = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const a = links.findIndex((l) => l.id === e.active.id);
    const b = links.findIndex((l) => l.id === e.over!.id);
    onChange(arrayMove(links, a, b));
  };
  return (
    <>
      <p className="kk-lead">Ihre Links oben auf der Startseite: 5 bis 8 Apps oder Webseiten, die Sie täglich brauchen. Reihenfolge durch Ziehen am Griff, Klick auf einen Link zum Bearbeiten.</p>
      <div className="es-liste">
        <DndContext sensors={sensoren} collisionDetection={closestCenter} onDragEnd={ende}>
          <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            {links.map((l) => (
              <Zeile
                key={l.id}
                l={l}
                offen={offen === l.id}
                onOeffnen={() => setOffen(l.id)}
                onAendern={(n) => onChange(links.map((x) => (x.id === l.id ? n : x)))}
                onEntfernen={() => {
                  onChange(links.filter((x) => x.id !== l.id));
                  setOffen(null);
                }}
                onFertig={() => setOffen(null)}
              />
            ))}
          </SortableContext>
        </DndContext>
        {links.length === 0 && <div className="au-leer">Noch keine Links – unten hinzufügen oder „Agentur-Standard laden“.</div>}
      </div>
      <div className="es-add">
        <button
          type="button"
          className="es-add-b knopf-rein"
          disabled={voll}
          onClick={async () => {
            const p = await window.api.programmWaehlen();
            if (p) neu({ name: p.name, ziel: p.pfad, symbol: symbolVorschlag(p.name, 'monitor'), farbe: '#6e6e73', beschreibung: `${p.name} (installiert)` });
          }}
        >
          <Sym n="monitor" />
          <div>
            <b>App hinzufügen</b>
            <small>aus den installierten Programmen</small>
          </div>
        </button>
        <button type="button" className="es-add-b knopf-rein" disabled={voll} onClick={() => neu({ name: '', ziel: 'https://', symbol: 'globe', farbe: LINK_FARBEN[links.length % LINK_FARBEN.length]! })}>
          <Sym n="globe" />
          <div>
            <b>Webseite hinzufügen</b>
            <small>Adresse eintragen, Symbol wird vorgeschlagen</small>
          </div>
        </button>
      </div>
    </>
  );
}

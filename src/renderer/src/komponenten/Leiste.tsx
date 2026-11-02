/** Schmale Seitenleiste in „Nebeneinander“ (Bild 4 v2): nur Knöpfe und Kundenkürzel, ☰ klappt aus. */
import type { Bestand } from '../../../shared';
import { Avatar, Sym } from './ui';

export function Leiste(p: {
  bestand: Bestand;
  auswahl: string;
  onAusklappen: () => void;
  onSuche: () => void;
  onStart: () => void;
  onKunde: (id: string) => void;
  onNeuerKunde: () => void;
}) {
  return (
    <aside className="rail" title="Seitenleiste ist in „Nebeneinander“ eingeklappt">
      <button type="button" className="r-btn knopf-rein" title="Seitenleiste ausklappen" onClick={p.onAusklappen}>
        <Sym n="columns" />
      </button>
      <button type="button" className="r-btn knopf-rein" title="Kunde suchen" onClick={p.onSuche}>
        <Sym n="search" />
      </button>
      <button type="button" className="r-btn prim knopf-rein" title="Neuer Kunde" onClick={p.onNeuerKunde}>
        <Sym n="plus" />
      </button>
      <span className="r-sep" />
      <button type="button" className="r-btn knopf-rein" title="Übersicht" onClick={p.onStart}>
        <Sym n="home" />
      </button>
      <span className="r-sep" />
      {p.bestand.kunden.map((k) => (
        <button type="button" key={k.id} className="knopf-rein r-av" title={k.name} onClick={() => p.onKunde(k.id)}>
          <Avatar id={k.id} name={k.name} cls={k.id === p.auswahl ? 'sel' : ''} />
        </button>
      ))}
    </aside>
  );
}

/** Seitenleiste wie Bild 1 v4 / Bild 2 v3: Suche, „Neuer Kunde“, Start, Kundenliste, Konto + Einstellungen. */
import { forwardRef, useState } from 'react';
import type { Bestand } from '../../../shared';
import { Avatar, STRG, Sym } from './ui';

export interface SeitenleisteProps {
  bestand: Bestand;
  /** Gewählter Kunde (Id) oder „start“. */
  auswahl: string;
  benutzer: string;
  /** Frisch angelegter Kunde (Kennzeichen „neu“). */
  neuerKunde: string | null;
  onStart: () => void;
  onKunde: (kundeId: string) => void;
  onNeuerKunde: () => void;
  onEinstellungen: () => void;
}

export const Seitenleiste = forwardRef<HTMLInputElement, SeitenleisteProps>(function Seitenleiste(p, sucheRef) {
  const [suche, setSuche] = useState('');
  const q = suche.trim().toLocaleLowerCase('de');
  const kunden = p.bestand.kunden.filter((k) => !q || k.name.toLocaleLowerCase('de').includes(q));
  return (
    <aside className="sidebar">
      <div className="top">
        <label className="search">
          <Sym n="search" />
          <input
            ref={sucheRef}
            className="suche-feld"
            placeholder="Kunde suchen"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSuche('');
                e.currentTarget.blur();
              } else if (e.key === 'Enter' && kunden[0]) {
                p.onKunde(kunden[0].id);
                setSuche('');
                e.currentTarget.blur();
              }
            }}
          />
          <kbd>{STRG} K</kbd>
        </label>
        <button type="button" className="btn primary" style={{ justifyContent: 'center' }} onClick={p.onNeuerKunde}>
          <Sym n="plus" /> Neuer Kunde
        </button>
      </div>
      <div className="nav-title" style={{ display: 'flex' }}>
        Start
      </div>
      <ul className="nav" style={{ flex: 'none' }}>
        <li className={p.auswahl === 'start' ? 'sel' : ''} onClick={p.onStart}>
          <Sym n="home" /> Übersicht
        </li>
      </ul>
      <div className="nav-title">{q ? `Treffer (${kunden.length})` : 'Alle Kunden'}</div>
      <ul className="nav">
        {kunden.map((k) => (
          <li key={k.id} className={p.auswahl === k.id ? 'sel' : ''} onClick={() => p.onKunde(k.id)}>
            <Avatar id={k.id} name={k.name} />
            {k.name}
            {p.neuerKunde === k.id && <span className="nk-neu">neu</span>}
          </li>
        ))}
        {kunden.length === 0 && <li className="leer">{q ? 'Kein Kunde gefunden' : 'Noch keine Kunden'}</li>}
      </ul>
      <div className="bottom">
        <div className="row" title="Gespeichert im Benutzerprofil. Der Abgleich über OneDrive folgt mit Meilenstein 5.">
          <Sym n="cloud" /> Lokal gespeichert <span className="dot" style={{ marginLeft: 'auto' }} />
        </div>
        <div className="row">
          <Avatar id={p.benutzer} name={p.benutzer} cls="klein" /> {p.benutzer}
          <button type="button" className="knopf-rein einst-knopf" title="Einstellungen" onClick={p.onEinstellungen}>
            <Sym n="sliders" />
          </button>
        </div>
      </div>
    </aside>
  );
});

/** Seitenleiste wie Bild 1 v4 / Bild 2 v3: Suche, „Neuer Kunde“, Start, Kundenliste, Konto + Einstellungen. */
import { forwardRef, useState } from 'react';
import { heuteDatum, zaehleFaellige, type Bestand } from '../../../shared';
import { zeigeHinweis } from '../../../shared/update/update';
import { Avatar, STRG, Sym } from './ui';
import { useUpdate } from './update';
import { SpeicherStatus, useAblage } from '../mitarbeit/mitarbeit';

export interface SeitenleisteProps {
  bestand: Bestand;
  /** Gewählter Kunde (Id), „start“ oder „aufgaben“. */
  auswahl: string;
  /** Angepinnte Übersichten (Ids, max. 4). */
  angepinnt: string[];
  onAufgaben: () => void;
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
  const update = useUpdate();
  const ablage = useAblage();
  const q = suche.trim().toLocaleLowerCase('de');
  const treffer = p.bestand.kunden.filter((k) => !q || k.name.toLocaleLowerCase('de').includes(q));
  const pinKunden = [...new Set(p.angepinnt.map((id) => p.bestand.uebersichten.find((u) => u.id === id)?.kundeId).filter((x): x is string => !!x))]
    .map((id) => p.bestand.kunden.find((k) => k.id === id))
    .filter((k): k is NonNullable<typeof k> => !!k);
  const kunden = q ? treffer : treffer.filter((k) => !pinKunden.includes(k));
  const faellig = zaehleFaellige(
    p.bestand.uebersichten.flatMap((u) => u.aufgaben ?? []),
    heuteDatum(),
  );
  const eintrag = (k: (typeof kunden)[number]) => (
    <li key={k.id} className={p.auswahl === k.id ? 'sel' : ''} onClick={() => p.onKunde(k.id)}>
      <Avatar id={k.id} name={k.name} />
      {k.name}
      {p.neuerKunde === k.id && <span className="nk-neu">neu</span>}
    </li>
  );
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
        <li className={p.auswahl === 'aufgaben' ? 'sel' : ''} onClick={p.onAufgaben} title="Offene Aufgaben aller Kunden · Zahl = heute fällig oder überfällig">
          <Sym n="tasks" /> Aufgaben {faellig > 0 && <span className="badge orange">{faellig}</span>}
        </li>
      </ul>
      {!q && pinKunden.length > 0 && (
        <>
          <div className="nav-title">Angepinnt</div>
          <ul className="nav" style={{ flex: 'none' }}>
            {pinKunden.map(eintrag)}
          </ul>
        </>
      )}
      <div className="nav-title">{q ? `Treffer (${kunden.length})` : 'Alle Kunden'}</div>
      <ul className="nav">
        {kunden.map(eintrag)}
        {kunden.length === 0 && <li className="leer">{q ? 'Kein Kunde gefunden' : pinKunden.length ? 'Alle Kunden sind angepinnt' : 'Noch keine Kunden'}</li>}
      </ul>
      <div className="bottom">
        {update && zeigeHinweis(update.zustand) && update.zustand.art === 'bereit' && (
          <div className="update-hinweis" role="status">
            <Sym n="download" />
            <div>
              <b>Update bereit</b>
              <small>Version {update.zustand.version} wird beim nächsten Start installiert.</small>
            </div>
            <button type="button" className="btn klein" onClick={() => void window.api.updateNeustart()}>
              Jetzt neu starten
            </button>
          </div>
        )}
        <SpeicherStatus s={ablage} />
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

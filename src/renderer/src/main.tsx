import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/index.css';
import './stil/mockup.css';
import './stil/app.css';
import './stil/druck.css';
import { App } from './App';
import { DruckSeite } from './druck/Druck';
import { DateiFenster } from './datei/DateiFenster';

/** „#druck?s=…“ = unsichtbares Druckfenster für das PDF, „#datei?k=…“ = Fenster einer Desktop-Datei (Bild 10), sonst die App. */
const druck = /^#druck\?s=([0-9a-f-]+)$/.exec(location.hash);
const datei = /^#datei\?k=([0-9a-f-]+)$/.exec(location.hash);

createRoot(document.getElementById('wurzel')!).render(
  <StrictMode>{druck ? <DruckSeite schluessel={druck[1]!} /> : datei ? <DateiFenster schluessel={datei[1]!} /> : <App />}</StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/index.css';
import './stil/mockup.css';
import './stil/app.css';
import './stil/druck.css';
import { App } from './App';
import { DruckSeite } from './druck/Druck';

/** „#druck?s=…“ = unsichtbares Druckfenster für das PDF, sonst die App. */
const druck = /^#druck\?s=([0-9a-f-]+)$/.exec(location.hash);

createRoot(document.getElementById('wurzel')!).render(
  <StrictMode>{druck ? <DruckSeite schluessel={druck[1]!} /> : <App />}</StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/index.css';
import './stil/mockup.css';
import './stil/app.css';
import { App } from './App';

createRoot(document.getElementById('wurzel')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

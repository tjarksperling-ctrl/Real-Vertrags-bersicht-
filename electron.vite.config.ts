import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

/** Ein Build für main/preload/renderer (Quellen in src/main, src/preload, src/renderer). */
export default defineConfig({
  main: {},
  preload: {},
  renderer: { plugins: [react()] },
});

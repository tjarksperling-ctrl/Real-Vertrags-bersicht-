/**
 * Automatische Updates (M5c) über electron-updater, Quelle laut `publish` in electron-builder.yml
 * (GitHub Releases eines öffentlichen Repos nur für Installer). Im Hintergrund prüfen und laden,
 * Installation beim nächsten Start (autoInstallOnAppQuit) oder sofort über „Jetzt neu starten“.
 * Aus in der Entwicklung/bei Tests; `VTUE_UPDATE_DEMO=bereit|laedt|aktuell|fehler` zeigt einen Zustand für Screenshots.
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import updater from 'electron-updater';
import { ERSTE_PRUEFUNG_MS, fehlerText, PRUEF_ABSTAND_MS, weiter, type UpdateEreignis, type UpdateStand } from '../shared/update/update';

let stand: UpdateStand = { zustand: { art: 'bereit-zu-pruefen' }, version: app.getVersion() };

function senden(): void {
  for (const w of BrowserWindow.getAllWindows()) if (!w.isDestroyed()) w.webContents.send('update:stand', stand);
}

function melden(e: UpdateEreignis): void {
  stand = weiter(stand, e, new Date().toISOString());
  senden();
}

function demo(art: string): UpdateStand | null {
  const jetzt = new Date(Date.now() - 12 * 60 * 1000).toISOString();
  const v = app.getVersion();
  if (art === 'bereit') return { version: v, letztePruefung: jetzt, zustand: { art: 'bereit', version: '0.2.0' } };
  if (art === 'laedt') return { version: v, letztePruefung: jetzt, zustand: { art: 'laedt', version: '0.2.0', prozent: 64 } };
  if (art === 'aktuell') return { version: v, letztePruefung: jetzt, zustand: { art: 'aktuell' } };
  if (art === 'fehler') return { version: v, letztePruefung: jetzt, zustand: { art: 'fehler', meldung: fehlerText('ENOTFOUND') } };
  return null;
}

export function updatesEinrichten(): void {
  ipcMain.handle('update:stand', () => stand);
  const d = demo(process.env['VTUE_UPDATE_DEMO'] ?? '');
  if (d) {
    stand = d;
    ipcMain.handle('update:pruefen', () => undefined);
    ipcMain.handle('update:neustart', () => undefined);
    return;
  }
  if (!app.isPackaged || process.env['VTUE_DATEN']) {
    stand = { ...stand, zustand: { art: 'aus', grund: 'Entwicklungsversion – Updates nur in der installierten App.' } };
    ipcMain.handle('update:pruefen', () => undefined);
    ipcMain.handle('update:neustart', () => undefined);
    return;
  }

  const { autoUpdater } = updater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.logger = null;

  autoUpdater.on('checking-for-update', () => melden({ art: 'pruefen' }));
  autoUpdater.on('update-available', (i) => melden({ art: 'verfuegbar', version: i.version }));
  autoUpdater.on('update-not-available', () => melden({ art: 'nicht-verfuegbar' }));
  autoUpdater.on('download-progress', (p) => melden({ art: 'fortschritt', prozent: p.percent }));
  autoUpdater.on('update-downloaded', (i) => melden({ art: 'geladen', version: i.version }));
  autoUpdater.on('error', (e) => melden({ art: 'fehler', meldung: fehlerText(String(e?.message ?? e)) }));

  const pruefen = () => {
    // Fehler kommen zusätzlich über das „error“-Ereignis; hier nur nicht abstürzen.
    autoUpdater.checkForUpdates().catch(() => undefined);
  };
  ipcMain.handle('update:pruefen', () => pruefen());
  ipcMain.handle('update:neustart', () => {
    if (stand.zustand.art === 'bereit') autoUpdater.quitAndInstall(true, true);
  });
  setTimeout(pruefen, ERSTE_PRUEFUNG_MS);
  setInterval(pruefen, PRUEF_ABSTAND_MS);
}

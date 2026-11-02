/**
 * Electron-Hauptprozess: Fenster, lokales Speichern im Benutzerprofil, PDF-Erzeugung.
 * Daten liegen als Yjs-Dateien in <Benutzerprofil>/daten (OneDrive-Abgleich folgt mit M5 ohne Umbau).
 */
import { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme, shell } from 'electron';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { userInfo } from 'node:os';
import type { AppInfo, DruckDaten, PdfAuftrag, PdfErgebnis } from '../shared/api';
import { randomUUID } from 'node:crypto';
import type { Darstellung } from '../shared/modell/typen';

const datenOrdner = () => process.env['VTUE_DATEN'] || join(app.getPath('userData'), 'daten');
const NAME = /^[a-z0-9-]{1,80}$/i;

function pfad(name: string, endung = '.yjs'): string {
  if (!NAME.test(name)) throw new Error(`Ungültiger Name: ${name}`);
  return join(datenOrdner(), name + endung);
}

/** Schreibt erst in eine Hilfsdatei und benennt dann um – so entsteht nie eine halbe Datei. */
async function sicherSchreiben(ziel: string, daten: Uint8Array | string): Promise<void> {
  await mkdir(datenOrdner(), { recursive: true });
  const tmp = `${ziel}.${process.pid}.tmp`;
  await writeFile(tmp, daten);
  await rename(tmp, ziel);
}

async function lesenOderNull(p: string): Promise<Buffer | null> {
  try {
    return await readFile(p);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

function seiteLaden(win: BrowserWindow, hash = ''): Promise<void> {
  const dev = process.env['ELECTRON_RENDERER_URL'];
  if (dev) return win.loadURL(dev + (hash ? `#${hash}` : ''));
  return win.loadFile(join(__dirname, '../renderer/index.html'), hash ? { hash } : {});
}

const webPreferences = () => ({
  preload: join(__dirname, '../preload/index.mjs'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: false,
  spellcheck: false,
});

function fensterOeffnen(): BrowserWindow {
  const breite = Number(process.env['VTUE_BREITE']) || 1440;
  const hoehe = Number(process.env['VTUE_HOEHE']) || 900;
  const win = new BrowserWindow({
    width: breite,
    height: hoehe,
    minWidth: 1100,
    minHeight: 680,
    title: 'Vertragsübersicht',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1c1e' : '#fbfbfd',
    autoHideMenuBar: true,
    show: false,
    webPreferences: webPreferences(),
  });
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  void seiteLaden(win);
  return win;
}

// ---------------------------------------------------------------- PDF (Meilenstein 4)

const auftraege = new Map<string, DruckDaten>();

/** Seitenzahl eines (unverschlüsselten) PDFs. */
function seitenZahl(pdf: Buffer): number {
  return (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

/** Zeichnet die Druckansicht in einem unsichtbaren Fenster und erzeugt daraus das PDF (A4, immer hell). */
async function pdfErstellen(auftrag: PdfAuftrag, eltern: BrowserWindow | null): Promise<PdfErgebnis> {
  let ziel = auftrag.ziel;
  if (auftrag.vorschau) ziel = join(app.getPath('temp'), auftrag.dateiname);
  if (!ziel) {
    const optionen = {
      title: 'PDF speichern',
      defaultPath: join(app.getPath('documents'), auftrag.dateiname),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    };
    const r = eltern ? await dialog.showSaveDialog(eltern, optionen) : await dialog.showSaveDialog(optionen);
    if (r.canceled || !r.filePath) return { pfad: null };
    ziel = r.filePath;
  }
  const schluessel = randomUUID();
  auftraege.set(schluessel, { daten: auftrag.daten, kunde: auftrag.kunde, optionen: auftrag.optionen, datum: auftrag.datum });
  const win = new BrowserWindow({ show: false, width: 794, height: 1123, webPreferences: webPreferences() });
  try {
    const bereit = new Promise<void>((ok, fehler) => {
      const t = setTimeout(() => fehler(new Error('Druckansicht nicht bereit')), 20000);
      const h = (e: Electron.IpcMainEvent) => {
        if (e.sender !== win.webContents) return;
        clearTimeout(t);
        ipcMain.off('druck:bereit', h);
        ok();
      };
      ipcMain.on('druck:bereit', h);
    });
    win.webContents.setZoomFactor(1);
    await seiteLaden(win, `druck?s=${schluessel}`);
    await bereit;
    let pdf: Buffer = Buffer.from(
      await win.webContents.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
    );
    const seiten = seitenZahl(pdf);
    if (auftrag.passwort) pdf = await verschluesseln(pdf, auftrag.passwort);
    await writeFile(ziel, pdf);
    if (auftrag.vorschau) void shell.openPath(ziel);
    return { pfad: ziel, seiten };
  } catch (e) {
    return { pfad: null, fehler: (e as Error).message };
  } finally {
    auftraege.delete(schluessel);
    win.destroy();
  }
}

/** PDF-Passwort (Bild 5 v2): AES-256, Öffnen nur mit Passwort. */
async function verschluesseln(pdf: Buffer, passwort: string): Promise<Buffer> {
  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const doc = await PDFDocument.load(pdf);
  doc.encrypt({ userPassword: passwort, ownerPassword: randomUUID() + passwort, permissions: { printing: 'highResolution', copying: true, modifying: false } });
  return Buffer.from(await doc.save({ useObjectStreams: false }));
}

/** „tjark.sperling“ → „Tjark S.“ */
function anzeigename(konto: string): string {
  const teile = konto.split(/[._\s-]+/).filter(Boolean);
  const gross = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  if (teile.length >= 2) return `${gross(teile[0]!)} ${teile[teile.length - 1]!.charAt(0).toUpperCase()}.`;
  return gross(konto || 'Ich');
}

// ---------------------------------------------------------------- IPC

function ipcEinrichten(): void {
  ipcMain.handle('app:info', (): AppInfo => ({
    plattform: process.platform,
    version: app.getVersion(),
    benutzer: process.env['VTUE_BENUTZER'] || anzeigename(userInfo().username),
    demo: process.env['VTUE_DEMO'] === '1',
    ...(process.env['VTUE_PDF_ZIEL'] ? { pdfZiel: process.env['VTUE_PDF_ZIEL'] } : {}),
  }));
  ipcMain.handle('daten:laden', async (_e, name: string) => {
    const b = await lesenOderNull(pfad(name));
    return b ? new Uint8Array(b) : null;
  });
  ipcMain.handle('daten:speichern', (_e, name: string, daten: Uint8Array) => sicherSchreiben(pfad(name), daten));
  ipcMain.handle('einstellungen:laden', async () => {
    const b = await lesenOderNull(pfad('einstellungen', '.json'));
    try {
      return b ? JSON.parse(b.toString('utf8')) : null;
    } catch {
      return null;
    }
  });
  ipcMain.handle('einstellungen:speichern', (_e, daten: unknown) =>
    sicherSchreiben(pfad('einstellungen', '.json'), JSON.stringify(daten, null, 2)),
  );
  ipcMain.handle('darstellung:setzen', (_e, d: Darstellung) => {
    nativeTheme.themeSource = d === 'hell' ? 'light' : d === 'dunkel' ? 'dark' : 'system';
  });
  ipcMain.handle('pdf:erstellen', (e, auftrag: PdfAuftrag) => pdfErstellen(auftrag, BrowserWindow.fromWebContents(e.sender)));
  ipcMain.handle('druck:daten', (_e, schluessel: string) => auftraege.get(schluessel) ?? null);
}

if (process.env['VTUE_DATEN']) app.setPath('userData', join(process.env['VTUE_DATEN'], 'profil'));

app.whenReady().then(() => {
  if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
  ipcEinrichten();
  fensterOeffnen();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) fensterOeffnen();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

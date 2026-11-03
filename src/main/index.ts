/**
 * Electron-Hauptprozess: Fenster, lokales Speichern im Benutzerprofil, PDF-Erzeugung.
 * Daten liegen als Yjs-Dateien in <Benutzerprofil>/daten (OneDrive-Abgleich folgt mit M5 ohne Umbau).
 */
import { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme, shell } from 'electron';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, extname, isAbsolute, join } from 'node:path';
import { userInfo } from 'node:os';
import type { AppBefehl, AppInfo, DateiAuftrag, DateiInfo, DruckDaten, PdfAuftrag, PdfErgebnis, ProtokollEintrag } from '../shared/api';
import { updatesEinrichten } from './update';
import { istVerschluesselt, vtueInhalt, vtueLesen, vtueSchreiben, VtueFehler } from './vtue';
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

let hauptFenster: BrowserWindow | null = null;

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
  hauptFenster = win;
  win.on('closed', () => {
    if (hauptFenster === win) hauptFenster = null;
  });
  return win;
}

/** Hauptfenster holen (bei Bedarf öffnen und warten, bis die Oberfläche Befehle annimmt). */
async function hauptFensterBereit(): Promise<BrowserWindow> {
  if (hauptFenster && !hauptFenster.isDestroyed()) {
    if (hauptFenster.isMinimized()) hauptFenster.restore();
    hauptFenster.focus();
    return hauptFenster;
  }
  const win = fensterOeffnen();
  await new Promise<void>((ok) => {
    const h = (e: Electron.IpcMainEvent) => {
      if (e.sender !== win.webContents) return;
      ipcMain.off('app:bereit', h);
      ok();
    };
    ipcMain.on('app:bereit', h);
  });
  return win;
}

// ---------------------------------------------------------------- Desktop-Datei .vtue (Bild 10)

interface OffeneDatei {
  pfad: string;
  win: BrowserWindow;
}
const dateien = new Map<string, OffeneDatei>();

/** Öffnet eine .vtue-Datei in einem eigenen Fenster (mehrere gleichzeitig möglich, Bild 10). */
async function dateiOeffnen(pfad: string): Promise<void> {
  for (const d of dateien.values())
    if (d.pfad === pfad && !d.win.isDestroyed()) {
      d.win.focus();
      return;
    }
  let verschluesselt = false;
  try {
    verschluesselt = istVerschluesselt(vtueLesen(await readFile(pfad)));
  } catch (e) {
    const meldung = e instanceof VtueFehler ? e.message : 'Die Datei lässt sich nicht lesen.';
    dialog.showErrorBox('Datei kann nicht geöffnet werden', `${basename(pfad)}\n\n${meldung}`);
    return;
  }
  const schluessel = randomUUID();
  const klein = verschluesselt;
  const win = new BrowserWindow({
    width: klein ? 460 : 1440,
    height: klein ? 440 : 900,
    minWidth: klein ? 400 : 1100,
    minHeight: klein ? 380 : 680,
    resizable: !klein,
    maximizable: !klein,
    title: `${basename(pfad)} — Vertragsübersicht`,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1c1e' : '#fbfbfd',
    autoHideMenuBar: true,
    show: false,
    webPreferences: webPreferences(),
  });
  win.once('ready-to-show', () => win.show());
  win.on('page-title-updated', (e) => e.preventDefault());
  dateien.set(schluessel, { pfad, win });
  win.on('closed', () => dateien.delete(schluessel));
  void seiteLaden(win, `datei?k=${schluessel}`);
}

function dateiZuFenster(win: BrowserWindow): void {
  win.setResizable(true);
  win.setMaximizable(true);
  win.setMinimumSize(1100, 680);
  win.setSize(Number(process.env['VTUE_BREITE']) || 1440, Number(process.env['VTUE_HOEHE']) || 900);
  win.center();
}

/** .vtue-Pfade aus der Befehlszeile (Doppelklick unter Windows/Linux). */
function dateienAusArgs(argv: string[]): string[] {
  return argv.slice(1).filter((a) => !a.startsWith('-') && extname(a).toLowerCase() === '.vtue');
}

/** Freier Dateiname: „Name.vtue“, sonst „Name (2).vtue“ … */
async function freierPfad(ordner: string, name: string): Promise<string> {
  for (let i = 1; i < 100; i++) {
    const p = join(ordner, `${name}${i > 1 ? ` (${i})` : ''}.vtue`);
    try {
      await stat(p);
    } catch {
      return p;
    }
  }
  return join(ordner, `${name} ${Date.now()}.vtue`);
}

const unerlaubt = /[<>:"/\\|?*\u0000-\u001f]/g;

async function dateiSpeichern(a: DateiAuftrag, eltern: BrowserWindow | null): Promise<{ pfad: string | null; fehler?: string }> {
  const name = a.name.replace(unerlaubt, '-').trim().slice(0, 150) || 'Vertragsuebersicht';
  let ziel: string;
  if (a.ort === 'waehlen' || process.env['VTUE_DESKTOP'] === 'waehlen') {
    const o = {
      title: 'Stand speichern',
      defaultPath: join(app.getPath('desktop'), `${name}.vtue`),
      filters: [{ name: 'Vertragsübersicht', extensions: ['vtue'] }],
    };
    const r = eltern ? await dialog.showSaveDialog(eltern, o) : await dialog.showSaveDialog(o);
    if (r.canceled || !r.filePath) return { pfad: null };
    ziel = r.filePath.toLowerCase().endsWith('.vtue') ? r.filePath : `${r.filePath}.vtue`;
  } else {
    ziel = await freierPfad(process.env['VTUE_DESKTOP'] || app.getPath('desktop'), name);
  }
  try {
    await writeFile(ziel, vtueSchreiben(a.meta, a.daten, a.passwort));
    if (a.imOrdnerZeigen) shell.showItemInFolder(ziel);
    return { pfad: ziel };
  } catch (e) {
    return { pfad: null, fehler: (e as Error).message };
  }
}

// ---------------------------------------------------------------- Protokoll (Bild 16)

const PROTOKOLL_MONATE = 12;

async function protokollLaden(): Promise<ProtokollEintrag[]> {
  const b = await lesenOderNull(pfad('protokoll', '.json'));
  try {
    const l = b ? (JSON.parse(b.toString('utf8')) as ProtokollEintrag[]) : [];
    return Array.isArray(l) ? l : [];
  } catch {
    return [];
  }
}

let protokollKette = Promise.resolve();
function protokollSchreiben(e: ProtokollEintrag): Promise<void> {
  protokollKette = protokollKette.then(async () => {
    const grenze = new Date();
    grenze.setMonth(grenze.getMonth() - PROTOKOLL_MONATE);
    const g = grenze.toISOString();
    const l = (await protokollLaden()).filter((x) => x.zeit >= g);
    l.unshift(e);
    await sicherSchreiben(pfad('protokoll', '.json'), JSON.stringify(l.slice(0, 5000)));
  });
  return protokollKette;
}

// ---------------------------------------------------------------- PDF (Meilenstein 4)

const auftraege = new Map<string, DruckDaten>();

/** Seitenzahl eines (unverschlüsselten) PDFs. */
function seitenZahl(pdf: Buffer): number {
  return (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

/** Zeichnet die Druckansicht in einem unsichtbaren Fenster und erzeugt daraus das PDF (A4, immer hell). */
async function pdfErstellen(auftrag: PdfAuftrag, eltern: BrowserWindow | null): Promise<PdfErgebnis> {
  let ziel = auftrag.ziel ?? process.env['VTUE_PDF_ZIEL'];
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
  auftraege.set(schluessel, { daten: auftrag.daten, kunde: auftrag.kunde, optionen: auftrag.optionen, datum: auftrag.datum, ...(auftrag.auskunft ? { auskunft: auftrag.auskunft } : {}) });
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
    let pdf: Buffer = Buffer.from(await win.webContents.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true, margins: { top: 0, bottom: 0, left: 0, right: 0 } }));
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
  ipcMain.handle(
    'app:info',
    (): AppInfo => ({
      plattform: process.platform,
      version: app.getVersion(),
      benutzer: process.env['VTUE_BENUTZER'] || anzeigename(userInfo().username),
      demo: process.env['VTUE_DEMO'] === '1',
      ...(process.env['VTUE_PDF_ZIEL'] ? { pdfZiel: process.env['VTUE_PDF_ZIEL'] } : {}),
    }),
  );
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
  ipcMain.handle('einstellungen:speichern', (_e, daten: unknown) => sicherSchreiben(pfad('einstellungen', '.json'), JSON.stringify(daten, null, 2)));
  ipcMain.handle('darstellung:setzen', (_e, d: Darstellung) => {
    nativeTheme.themeSource = d === 'hell' ? 'light' : d === 'dunkel' ? 'dark' : 'system';
  });
  ipcMain.handle('pdf:erstellen', (e, auftrag: PdfAuftrag) => pdfErstellen(auftrag, BrowserWindow.fromWebContents(e.sender)));
  ipcMain.handle('druck:daten', (_e, schluessel: string) => auftraege.get(schluessel) ?? null);

  // ---- M5a
  ipcMain.handle('extern:oeffnen', async (_e, ziel: string) => {
    if (/^(https?|mailto):/i.test(ziel)) {
      await shell.openExternal(ziel);
      return true;
    }
    if (isAbsolute(ziel)) return (await shell.openPath(ziel)) === '';
    return false;
  });
  ipcMain.handle('programm:waehlen', async (e) => {
    const eltern = BrowserWindow.fromWebContents(e.sender);
    const o: Electron.OpenDialogOptions = {
      title: 'App auswählen',
      properties: ['openFile'],
      defaultPath: process.platform === 'win32' ? 'C:\\Program Files' : process.platform === 'darwin' ? '/Applications' : '/usr/bin',
      ...(process.platform === 'win32' ? { filters: [{ name: 'Programme', extensions: ['exe', 'lnk', 'url', 'bat', 'cmd'] }] } : {}),
    };
    const r = eltern ? await dialog.showOpenDialog(eltern, o) : await dialog.showOpenDialog(o);
    const p = r.filePaths[0];
    if (r.canceled || !p) return null;
    return { pfad: p, name: basename(p, extname(p)) };
  });
  ipcMain.handle('daten:loeschen', (_e, name: string) => rm(pfad(name), { force: true }));
  ipcMain.handle('protokoll:laden', () => protokollLaden());
  ipcMain.handle('protokoll:schreiben', (_e, eintrag: ProtokollEintrag) => protokollSchreiben(eintrag));
  ipcMain.handle('text:speichern', async (e, dateiname: string, text: string) => {
    const eltern = BrowserWindow.fromWebContents(e.sender);
    const o = { title: 'Speichern', defaultPath: join(app.getPath('documents'), dateiname) };
    const r = eltern ? await dialog.showSaveDialog(eltern, o) : await dialog.showSaveDialog(o);
    if (r.canceled || !r.filePath) return null;
    await writeFile(r.filePath, text, 'utf8');
    return r.filePath;
  });
  ipcMain.handle('datei:speichern', (e, a: DateiAuftrag) => dateiSpeichern(a, BrowserWindow.fromWebContents(e.sender)));
  ipcMain.handle('datei:info', async (_e, k: string): Promise<DateiInfo | null> => {
    const d = dateien.get(k);
    if (!d) return null;
    try {
      const v = vtueLesen(await readFile(d.pfad));
      return { ...v.meta, dateiname: basename(d.pfad), verschluesselt: istVerschluesselt(v) };
    } catch {
      return null;
    }
  });
  ipcMain.handle('datei:entsperren', async (_e, k: string, passwort?: string) => {
    const d = dateien.get(k);
    if (!d) return null;
    const inhalt = vtueInhalt(vtueLesen(await readFile(d.pfad)), passwort);
    if (inhalt && passwort && !d.win.isDestroyed()) dateiZuFenster(d.win);
    return inhalt;
  });
  ipcMain.handle('datei:oeffnenDialog', async (e) => {
    const eltern = BrowserWindow.fromWebContents(e.sender);
    const o: Electron.OpenDialogOptions = {
      title: 'Gespeicherten Stand öffnen',
      defaultPath: app.getPath('desktop'),
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Vertragsübersicht', extensions: ['vtue'] }],
    };
    const r = eltern ? await dialog.showOpenDialog(eltern, o) : await dialog.showOpenDialog(o);
    for (const p of r.filePaths) await dateiOeffnen(p);
  });
  ipcMain.handle('app:befehl', async (_e, b: AppBefehl) => {
    const win = await hauptFensterBereit();
    win.webContents.send('app:befehl', b);
  });
}

if (process.env['VTUE_DATEN']) app.setPath('userData', join(process.env['VTUE_DATEN'], 'profil'));

// Nur eine laufende App: ein weiterer Doppelklick auf eine .vtue-Datei öffnet sie im laufenden Programm.
const einzig = process.env['VTUE_MEHRFACH'] === '1' || app.requestSingleInstanceLock();
if (!einzig) app.quit();

/** macOS: Datei per Doppelklick (kommt vor oder nach „ready“). */
const fruehe: string[] = [];
app.on('open-file', (e, p) => {
  e.preventDefault();
  if (app.isReady()) void dateiOeffnen(p);
  else fruehe.push(p);
});

app.on('second-instance', (_e, argv) => {
  const l = dateienAusArgs(argv);
  if (l.length) for (const p of l) void dateiOeffnen(p);
  else void hauptFensterBereit();
});

app.whenReady().then(() => {
  if (!einzig) return;
  if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
  ipcEinrichten();
  updatesEinrichten();
  const start = [...dateienAusArgs(process.argv), ...fruehe];
  // Doppelklick auf eine Datei bei geschlossener App: nur das Datei-Fenster (Bild 10), sonst die App
  if (start.length) for (const p of start) void dateiOeffnen(p);
  else fensterOeffnen();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) fensterOeffnen();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

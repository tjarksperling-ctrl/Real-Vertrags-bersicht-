/**
 * Ablage im Hauptprozess (M5b): Einstellung „Speicherort“, Umzug, Abgleich mit dem gemeinsamen Ordner,
 * Anwesenheit (Bild 15) und Online-Status.
 */
import { app, BrowserWindow, dialog, ipcMain, net, shell } from 'electron';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AblageStand, AnwesenheitMeldung, OrdnerInfo } from '../shared/api';
import { Ablage, personId, sicherSchreiben, umziehen, type AblageOrt, type Person, type PersonStand } from './ablage';

const ABGLEICH_MS = 2000;
const PERSONEN_MS = 8000;
const HERZSCHLAG_MS = 20000;

interface Konfig {
  ort: AblageOrt;
  ich: Person;
}

let ablage: Ablage;
let datenOrdner = '';
const beobachtet = new Set<string>(['bestand']);
let online = true;
let wartend = 0;
let zuletzt: string | null = null;
let fehler: string | null = null;
let anwesenheit: Omit<PersonStand, 'id' | 'name' | 'zeit'> = {};

const konfigPfad = () => join(datenOrdner, 'ablage.json');

async function konfigLesen(benutzer: string): Promise<Konfig> {
  try {
    const j = JSON.parse(await readFile(konfigPfad(), 'utf8')) as Konfig;
    if (j?.ich?.id && j.ort) return { ort: j.ort, ich: { id: j.ich.id, name: benutzer || j.ich.name } };
  } catch {
    /* erste Nutzung */
  }
  const k: Konfig = { ort: umgebungsOrt() ?? { art: 'lokal', ordner: null }, ich: { id: personId(benutzer, randomUUID()), name: benutzer } };
  await sicherSchreiben(konfigPfad(), JSON.stringify(k, null, 2));
  return k;
}

/** Tests/Screenshots: gemeinsamen Ordner per Umgebung vorgeben. */
function umgebungsOrt(): AblageOrt | null {
  const o = process.env['VTUE_ORDNER'];
  return o ? { art: 'sharepoint', ordner: o } : null;
}

export function aktuelleAblage(): Ablage {
  return ablage;
}

const alle = (kanal: string, ...daten: unknown[]) => {
  for (const w of BrowserWindow.getAllWindows()) if (!w.isDestroyed()) w.webContents.send(kanal, ...daten);
};

function stand(): AblageStand {
  return { ort: ablage.ort, ich: ablage.ich, gemeinsam: ablage.gemeinsam, online, wartend, zuletzt, fehler, wurzel: ablage.gemeinsam ? ablage.wurzel : null };
}
const statusSenden = () => alle('ablage:status', stand());

/** Wird nach jedem Speichern aufgerufen. */
export function gespeichertMelden(ok: boolean, f?: string): void {
  if (ok) {
    zuletzt = new Date().toISOString();
    fehler = null;
    if (!online && ablage.gemeinsam) wartend++;
  } else fehler = f ?? 'Speichern fehlgeschlagen';
  statusSenden();
}

async function abgleich(): Promise<void> {
  if (!ablage.gemeinsam) return;
  try {
    const neu = await ablage.fremdePruefen(beobachtet);
    if (neu.length) alle('ablage:fremd', neu);
  } catch {
    /* Ordner kurz nicht erreichbar – nächster Durchlauf */
  }
}

async function personenSenden(): Promise<void> {
  if (!ablage.gemeinsam) return;
  try {
    alle('ablage:personen', await ablage.personen());
  } catch {
    /* egal */
  }
}

let letzterHerzschlag = 0;
let nachgereicht: ReturnType<typeof setTimeout> | null = null;
async function herzschlag(sofort = false): Promise<void> {
  if (!ablage.gemeinsam) return;
  const t = Date.now();
  if (!sofort && t - letzterHerzschlag < HERZSCHLAG_MS) return;
  letzterHerzschlag = t;
  await ablage.anwesenheitSchreiben(anwesenheit).catch(() => {});
}

export async function ablageEinrichten(ordner: string, benutzer: string): Promise<void> {
  datenOrdner = ordner;
  const k = await konfigLesen(benutzer);
  ablage = new Ablage(datenOrdner, k.ort, k.ich);
  await herzschlag(true);

  setInterval(() => void abgleich(), ABGLEICH_MS);
  setInterval(() => void personenSenden(), PERSONEN_MS);
  setInterval(() => void herzschlag(), 5000);
  setInterval(() => {
    // VTUE_OFFLINE=1: nur Tests/Screenshots (Bild 15 offline)
    const jetzt = process.env['VTUE_OFFLINE'] === '1' ? false : net.isOnline();
    if (jetzt !== online) {
      online = jetzt;
      if (online) wartend = 0;
      statusSenden();
    }
  }, 3000);
  app.on('before-quit', () => {
    // beim Beenden abmelden, damit andere einen nicht mehr „gerade drin“ sehen
    anwesenheit = {};
    void ablage.anwesenheitSchreiben({}, new Date(0)).catch(() => {});
  });

  ipcMain.handle('ablage:stand', () => stand());
  ipcMain.handle('ablage:beobachten', (_e, namen: string[]) => {
    beobachtet.clear();
    beobachtet.add('bestand');
    for (const n of namen) beobachtet.add(n);
  });
  ipcMain.handle('ablage:anwesenheit', (_e, m: AnwesenheitMeldung) => {
    const wechsel = m.uebersichtId !== anwesenheit.uebersichtId;
    anwesenheit = {
      ...(m.uebersichtId ? { uebersichtId: m.uebersichtId, seit: wechsel ? new Date().toISOString() : (anwesenheit.seit ?? new Date().toISOString()) } : {}),
      ...(m.ansicht ? { ansicht: m.ansicht } : {}),
      ...(m.ort ? { ort: m.ort } : {}),
    };
    // Ortswechsel zeitnah weitergeben, aber höchstens alle 3 s schreiben
    if (Date.now() - letzterHerzschlag > 3000) void herzschlag(true);
    else if (!nachgereicht)
      nachgereicht = setTimeout(() => {
        nachgereicht = null;
        void herzschlag(true);
      }, 3000);
  });
  ipcMain.handle('ablage:personen', () => ablage.personen());
  ipcMain.handle('ablage:ordnerWaehlen', async (e) => {
    const eltern = BrowserWindow.fromWebContents(e.sender);
    const o: Electron.OpenDialogOptions = {
      title: 'Gemeinsamen Ordner wählen (SharePoint oder OneDrive)',
      defaultPath: process.env['OneDriveCommercial'] || process.env['OneDrive'] || app.getPath('home'),
      properties: ['openDirectory', 'createDirectory'],
    };
    const r = eltern ? await dialog.showOpenDialog(eltern, o) : await dialog.showOpenDialog(o);
    return r.canceled ? null : (r.filePaths[0] ?? null);
  });
  ipcMain.handle('ablage:info', async (_e, ort: AblageOrt): Promise<OrdnerInfo> => {
    const a = new Ablage(datenOrdner, ort, ablage.ich);
    const [namen, groesse, personen] = await Promise.all([a.namen(), a.groesse(), a.personen()]);
    return {
      uebersichten: namen.filter((n) => n.startsWith('u-')).length,
      vorhanden: namen.includes('bestand'),
      groesse,
      personen: personen.map((p) => ({ id: p.id, name: p.name })),
    };
  });
  ipcMain.handle('ablage:oeffnen', async () => {
    await shell.openPath(ablage.gemeinsam ? ablage.wurzel : datenOrdner);
  });
  ipcMain.handle('ablage:wechseln', async (_e, ort: AblageOrt): Promise<{ ok: boolean; uebernommen: number; fehler?: string }> => {
    if (ort.art !== 'lokal' && !ort.ordner) return { ok: false, uebernommen: 0, fehler: 'Bitte einen Ordner wählen.' };
    try {
      const neu = new Ablage(datenOrdner, ort.art === 'lokal' ? { art: 'lokal', ordner: null } : ort, ablage.ich);
      const n = await umziehen(ablage, neu);
      await sicherSchreiben(konfigPfad(), JSON.stringify({ ort: neu.ort, ich: ablage.ich }, null, 2));
      ablage = neu;
      anwesenheit = {};
      await herzschlag(true);
      statusSenden();
      for (const w of BrowserWindow.getAllWindows()) if (!w.isDestroyed()) w.webContents.reload();
      return { ok: true, uebernommen: n };
    } catch (e) {
      return { ok: false, uebernommen: 0, fehler: e instanceof Error ? e.message : String(e) };
    }
  });
}

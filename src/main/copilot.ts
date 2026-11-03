/**
 * KI-Import über Microsoft 365 Copilot (M5b, Chat-API – Vorschau/beta).
 * Ablauf je Unterlage: kurz in den eigenen OneDrive laden (zufälliger Dateiname, kein Kundenname) →
 * Copilot-Gespräch mit der Datei als Kontext und festem Auftrag (ohne Websuche) → Antwort (Text mit JSON) →
 * Datei sofort endgültig löschen. Die Antwort prüft `kiAntwortLesen` in der Oberfläche.
 * Laut Microsoft braucht jede Person eine Lizenz „Microsoft 365 Copilot“.
 */
import { app, BrowserWindow, dialog } from 'electron';
import { randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { kiAuftrag } from '../shared/ki/import';
import type { KiDatei, KiErgebnis } from '../shared/api';
import { graph, MsFehler, SCOPES_COPILOT, token } from './microsoft';

const ORDNER = 'Vertragsuebersicht KI-Import (temporaer)';
const EINFACH_MAX = 4 * 1024 * 1024;
const DATEI_MAX = 25 * 1024 * 1024;
const TYPEN = ['pdf', 'jpg', 'jpeg', 'png', 'tif', 'tiff', 'heic', 'docx'];
const demo = () => process.env['VTUE_MS_DEMO'] === '1';

interface Item {
  id: string;
  webUrl: string;
}

async function hochladen(d: KiDatei): Promise<Item> {
  const name = `${randomUUID()}${extname(d.name).toLowerCase() || '.pdf'}`;
  const pfad = `/v1.0/me/drive/root:/${encodeURIComponent(ORDNER)}/${name}`;
  if (d.daten.length <= EINFACH_MAX) return graph<Item>('PUT', `${pfad}:/content`, SCOPES_COPILOT, d.daten, { headers: { 'Content-Type': 'application/octet-stream' } });
  // große Scans: Upload-Sitzung in Stücken
  const s = await graph<{ uploadUrl: string }>('POST', `${pfad}:/createUploadSession`, SCOPES_COPILOT, { item: { '@microsoft.graph.conflictBehavior': 'rename' } });
  const STUECK = 320 * 1024 * 10;
  let item: Item | null = null;
  for (let a = 0; a < d.daten.length; a += STUECK) {
    const teil = d.daten.subarray(a, Math.min(a + STUECK, d.daten.length));
    const r = await fetch(s.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Range': `bytes ${a}-${a + teil.length - 1}/${d.daten.length}` },
      body: Buffer.from(teil),
    });
    if (!r.ok) throw new MsFehler(`Hochladen fehlgeschlagen (${r.status}).`);
    if (r.status === 200 || r.status === 201) item = (await r.json()) as Item;
  }
  if (!item) throw new MsFehler('Hochladen nicht abgeschlossen.');
  return item;
}

async function loeschen(id: string): Promise<void> {
  try {
    await graph('POST', `/v1.0/me/drive/items/${id}/permanentDelete`, SCOPES_COPILOT);
  } catch {
    await graph('DELETE', `/v1.0/me/drive/items/${id}`, SCOPES_COPILOT).catch(() => {});
  }
}

interface Antwort {
  messages?: { id?: string; text?: string }[];
}

async function fragen(item: Item): Promise<string> {
  const auftrag = kiAuftrag();
  const g = await graph<{ id: string }>('POST', '/beta/copilot/conversations', SCOPES_COPILOT, {});
  const r = await graph<Antwort>(
    'POST',
    `/beta/copilot/conversations/${g.id}/chat`,
    SCOPES_COPILOT,
    {
      message: { text: auftrag },
      locationHint: { timeZone: 'Europe/Berlin' },
      contextualResources: { files: [{ uri: item.webUrl }], webContext: { isWebEnabled: false } },
    },
    { signal: AbortSignal.timeout(180_000) },
  );
  const texte = (r.messages ?? []).map((m) => m.text ?? '').filter((t) => t && t.trim() !== auftrag.trim());
  const t = texte[texte.length - 1];
  if (!t) throw new MsFehler('Copilot hat keine Antwort geliefert.');
  return t;
}

/** Eine Unterlage auswerten. Die Datei liegt nur während der Auswertung im OneDrive. */
export async function kiAuswerten(d: KiDatei): Promise<KiErgebnis> {
  if (d.daten.length > DATEI_MAX) return { ok: false, fehler: 'Die Datei ist größer als 25 MB.' };
  if (demo()) {
    await new Promise((r) => setTimeout(r, 400));
    return { ok: true, text: DEMO_ANTWORT[basename(d.name)] ?? DEMO_ANTWORT['*']! };
  }
  let item: Item | null = null;
  try {
    await token(SCOPES_COPILOT, true); // beim ersten Mal: Zustimmung im Browser
    item = await hochladen(d);
    return { ok: true, text: await fragen(item) };
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    if (/403|Forbidden|license|Lizenz/i.test(t)) return { ok: false, fehler: `${t} Hinweis: Für die Copilot-Schnittstelle braucht jede Person eine Lizenz „Microsoft 365 Copilot“.` };
    if (e instanceof Error && e.name === 'TimeoutError') return { ok: false, fehler: 'Copilot hat nicht rechtzeitig geantwortet. Bitte erneut versuchen.' };
    return { ok: false, fehler: t };
  } finally {
    if (item) await loeschen(item.id);
  }
}

/** „Verbindung testen“ (Einstellungen → KI-Konto). */
export async function kiTesten(): Promise<{ ok: boolean; ms?: number; fehler?: string }> {
  const t0 = Date.now();
  if (demo()) return { ok: true, ms: 800 };
  try {
    await token(SCOPES_COPILOT, true);
    await graph('POST', '/beta/copilot/conversations', SCOPES_COPILOT, {});
    return { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, fehler: e instanceof Error ? e.message : String(e) };
  }
}

/** „oder auswählen“: Unterlagen wählen und einlesen (nur zum Auswerten, nichts wird gespeichert). */
export async function kiDateienWaehlen(eltern: BrowserWindow | null): Promise<KiDatei[]> {
  // Tests/Screenshots: Dateien per Umgebung statt Dialog
  const vorgabe = process.env['VTUE_KI_DATEIEN'];
  if (vorgabe) return Promise.all(vorgabe.split('|').map(async (p) => ({ name: basename(p), daten: new Uint8Array(await readFile(p)) })));
  const o: Electron.OpenDialogOptions = {
    title: 'Unterlagen auswählen',
    defaultPath: app.getPath('downloads'),
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'PDFs und Scans', extensions: TYPEN }],
  };
  const r = eltern ? await dialog.showOpenDialog(eltern, o) : await dialog.showOpenDialog(o);
  const l: KiDatei[] = [];
  for (const p of r.filePaths) {
    const s = await stat(p).catch(() => null);
    if (!s || s.size > DATEI_MAX) continue;
    l.push({ name: basename(p), daten: new Uint8Array(await readFile(p)) });
  }
  return l;
}

/** Vorführmodus (Screenshots): Antworten wie im Mockup Bild 6. */
const DEMO_ANTWORT: Record<string, string> = {
  'Police_Wohngebaeude.pdf':
    '{"vertraege":[{"bereich":"VERS","untergruppe":"Wohnen","name":"Wohngebäude","bemerkung":"Einfamilienhaus Bj. 1998, inkl. Elementar","betrag":612.00,"zahlweise":"jaehrlich","unsicher":[]}]}',
  'Kfz_Beitragsrechnung_2026.pdf':
    '{"vertraege":[{"bereich":"VERS","untergruppe":"Kfz","name":"VW Golf","bemerkung":"VK 300 € / TK 150 €, SF 12","betrag":486.00,"zahlweise":"halbjaehrlich","unsicher":["zahlweise"],"hinweis":"Zahlweise unsicher – in der Rechnung steht „1. Rate“. Bitte prüfen."},{"bereich":"VERS","untergruppe":"Wohnen","name":"Glasversicherung","bemerkung":"Im Hausrat-Nachtrag erwähnt","betrag":24.00,"zahlweise":"jaehrlich","gekuendigt":true}]}',
  'Scan_BU_Nachtrag.jpg':
    '```json\n{"vertraege":[{"bereich":"AV","untergruppe":"Familienabsicherung","name":"Berufsunfähigkeit","bemerkung":"BU-Rente 1.500 € mtl. bis 67","betrag":86.40,"zahlweise":"monatlich","leistung":{"betrag":1500,"art":"RENTE_MTL"},"unsicher":["betrag"],"hinweis":"Beitrag im Scan schlecht lesbar. Bitte prüfen."}]}\n```',
  '*': '{"vertraege":[]}',
};

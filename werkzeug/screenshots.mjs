/**
 * Startet die gebaute App (npm run build) mit Vorführdaten per Playwright und legt Screenshots
 * zum Vergleich mit den Mockups nach mockups/bilder/app-m<n>-*.png.
 * Aufruf: node werkzeug/screenshots.mjs [m2|m3|m4|alle]
 * Playwright wird nicht als Abhängigkeit installiert: es wird die vorhandene, globale Installation genutzt
 * (Pfad über PLAYWRIGHT_PFAD oder NODE_PATH).
 */
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT_PFAD || 'playwright');
const electronPfad = require('electron');
const wurzel = resolve(import.meta.dirname, '..');
const bilder = join(wurzel, 'mockups/bilder');
mkdirSync(bilder, { recursive: true });
const was = process.argv[2] ?? 'alle';

async function starten(extraEnv = {}) {
  const daten = mkdtempSync(join(tmpdir(), 'vtue-'));
  const app = await pw._electron.launch({
    executablePath: electronPfad,
    args: ['--no-sandbox', join(wurzel, 'out/main/index.js')],
    env: { ...process.env, VTUE_DATEN: daten, VTUE_DEMO: '1', VTUE_BENUTZER: 'Tjark S.', ...extraEnv },
  });
  const win = await app.firstWindow();
  await win.setViewportSize({ width: 1440, height: 900 });
  await win.waitForSelector('.sidebar');
  await win.evaluate(() => document.fonts.ready);
  return { app, win, daten };
}

/** Untergruppen-Karte nach Name (der Name steht in einem Eingabefeld). */
async function ug(win, bereich, name) {
  const i = await win.evaluate(
    ([b, n]) => [...document.querySelectorAll(`.bereich.${b} .ug.v1`)].findIndex((e) => e.querySelector('input.ug-name')?.value === n),
    [bereich, name],
  );
  return win.locator(`.bereich.${bereich} .ug.v1`).nth(i);
}

/** Ziehen mit der Maus in kleinen Schritten (dnd-kit braucht echte Bewegungen). */
async function ziehen(win, von, nach) {
  const a = await von.boundingBox();
  const b = await nach.boundingBox();
  await win.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await win.mouse.down();
  for (let i = 1; i <= 12; i++) await win.mouse.move(a.x + a.width / 2 + ((b.x + 40 - a.x) * i) / 12, a.y + a.height / 2 + ((b.y + 8 - a.y) * i) / 12);
  await pause(150);
  await win.mouse.up();
  await pause(200);
}

const bild = (win, name) => win.screenshot({ path: join(bilder, `app-${name}.png`) });
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function m2() {
  const { app, win, daten } = await starten();
  try {
    await bild(win, 'm2-start');
    await win.click('.nav li:has-text("Familie Berger")');
    await win.waitForSelector('.bereich.v1.vers');
    await pause(300);
    await bild(win, 'm2-aktuell');

    // Bild 12: Vertrag in Kfz anlegen, neue Untergruppe, Löschen mit Hinweis
    const kfz = await ug(win, 'vers', 'Kfz');
    const glas = await ug(win, 'vers', 'Wohnen');
    await glas.locator('.add-v').click();
    await win.keyboard.type('Glasversicherung');
    await win.keyboard.press('Enter');
    await win.keyboard.press('Escape');
    await glas.locator('tr').last().locator('.v2-del.x').click();
    await kfz.locator('.add-v').click();
    await win.keyboard.type('Mot');
    await win.locator('.bereich.vers .add-ug').click();
    await win.keyboard.type('Gesundheit');
    await win.locator('.v2-symrow button[title="activity"]').click();
    await pause(200);
    await bild(win, 'm2-bearbeiten');
    await win.keyboard.press('Escape');

    // Drag & Drop: Untergruppe „Kfz“ am Griff über „Wohnen“ ziehen, danach Vertrag „VW Golf“ nach „Haftpflicht & Recht“
    await ziehen(win, (await ug(win, 'vers', 'Kfz')).locator('.ug-kopf .grip'), (await ug(win, 'vers', 'Wohnen')).locator('.ug-kopf'));
    const reihenfolge = await win.evaluate(() => [...document.querySelectorAll('.bereich.vers input.ug-name')].map((e) => e.value));
    console.log('  Reihenfolge nach Ziehen:', reihenfolge.join(', '));
    const golf = (await ug(win, 'vers', 'Kfz')).locator('tr').first().locator('td.grip');
    await ziehen(win, golf, (await ug(win, 'vers', 'Haftpflicht & Recht')).locator('tr').nth(1));
    const hp = await win.evaluate(() => [...document.querySelectorAll('.bereich.vers .ug.v1')][0].querySelectorAll('tr').length);
    console.log('  Verträge in Haftpflicht & Recht nach Ziehen:', hp);
    await win.keyboard.press('Control+z');
    await win.keyboard.press('Control+z');

    // Bild 12 v4 AV: Art der Leistung öffnen
    await win.click('.bl-item.av .bl-name');
    await win.locator('.bereich.av td.v2-lz .v2-art').first().click();
    await pause(150);
    await bild(win, 'm2-av');
    await win.keyboard.press('Escape');
    await win.click('.bl-gesamt');

    // Bild 13: Darlehen abwählen
    await win.click('.bl-item.darl .chk');
    await win.evaluate(() => document.querySelector('.bereich-aus')?.scrollIntoView({ block: 'center' }));
    await pause(200);
    await bild(win, 'm2-abgewaehlt');
    await win.keyboard.press('Control+z');
    await pause(100);

    // Bild 11: Neuer Kunde mit Vorlage „Junge Familie“, danach Vorschläge beim Tippen
    await win.click('.sidebar .btn.primary');
    await win.fill('#nk-name', 'Familie Hoffmann');
    await win.click('.nk-v:has-text("Junge Familie")');
    await pause(150);
    await bild(win, 'm2-neuer-kunde');
    await win.click('.sheet footer .btn.primary');
    await win.waitForSelector('.nk-band');
    const wohnen = await ug(win, 'vers', 'Wohnen');
    await wohnen.locator('.add-v').click();
    await win.keyboard.type('Haus');
    await pause(200);
    await bild(win, 'm2-vorschlaege');
    await win.keyboard.press('Escape');
    await win.keyboard.press('Escape');

    // Einstellungen → Vorlagen und Allgemein
    await win.click('.einst-knopf');
    await win.click('.kk-nav-i:has-text("Vorlagen")');
    await win.click('.vl-k:has-text("Junge Familie")');
    await pause(150);
    await bild(win, 'm2-vorlagen');
    await win.click('.kk-nav-i:has-text("Allgemein")');
    await win.click('.darstellung button:has-text("Dunkel")');
    await pause(300);
    await bild(win, 'm2-allgemein-dunkel');
    await win.click('.sheet footer .btn.primary');
    await win.click('.nav li:has-text("Familie Berger")');
    await pause(300);
    await bild(win, 'm2-aktuell-dunkel');
  } finally {
    await app.close();
    rmSync(daten, { recursive: true, force: true });
  }
}

/** Wert eines Betragsfelds in einer Fassung: Vertragszeile über den Vertragsnamen. */
async function betrag(win, fassung, name) {
  return win.evaluate(
    ([f, n]) => {
      const box = document.querySelector(`[data-fassung="${f}"]`) ?? document;
      const tr = [...box.querySelectorAll('tr[data-vertrag]')].find((r) => r.querySelector('td.vname input')?.value === n);
      return tr?.querySelector('input.betrag')?.value;
    },
    [fassung, name],
  );
}

async function m3() {
  const { app, win, daten } = await starten();
  try {
    await win.click('.nav li:has-text("Familie Berger")');
    await win.waitForSelector('.bereich.v1.vers');
    await win.click('.seg button:has-text("Neu")');
    await pause(300);
    await bild(win, 'm3-neu');
    await win.evaluate(() => document.querySelector('.vorteile')?.scrollIntoView({ block: 'end' }));
    await pause(200);
    await bild(win, 'm3-neu-vorteile');
    await win.mouse.move(700, 600);
    await win.keyboard.press('Control+3');
    await pause(400);
    await bild(win, 'm3-nebeneinander');

    // Bild 14 (a): Sync an – Hausrat in Aktuell ändern, Erklärkarte am Schalter
    await win.keyboard.press('Control+1');
    await pause(200);
    const hausrat = win.locator('tr[data-vertrag]').filter({ has: win.locator('td.vname input[value="Hausrat"]') }).locator('input.betrag');
    await hausrat.click();
    await win.keyboard.press('Control+a');
    await win.keyboard.type('158,40');
    await win.keyboard.press('Tab');
    await win.hover('.sync-wrap .switch');
    await pause(700);
    await bild(win, 'm3-sync-an');
    await win.mouse.move(700, 600);
    await win.keyboard.press('Control+2');
    await pause(200);
    console.log('  Neu Hausrat nach Änderung bei Sync an:', await betrag(win, 'neu', 'Hausrat'));

    // Bild 14 (b): Sync aus – Änderung bleibt in Aktuell
    await win.click('.sync-wrap .switch');
    await win.keyboard.press('Control+1');
    await pause(200);
    await hausrat.click();
    await win.keyboard.press('Control+a');
    await win.keyboard.type('170,00');
    await win.keyboard.press('Tab');
    await win.keyboard.press('Control+2');
    await pause(300);
    console.log('  Neu Hausrat nach Änderung bei Sync aus:', await betrag(win, 'neu', 'Hausrat'));
    await bild(win, 'm3-sync-aus');
  } finally {
    await app.close();
    rmSync(daten, { recursive: true, force: true });
  }
}

/** M4: PDF-Dialog (Bild 5 v2) und erzeugtes PDF (Bild 7 v1); Seiten werden mit pdftoppm zu PNG. */
async function m4() {
  const ausgabe = mkdtempSync(join(tmpdir(), 'vtue-pdf-'));
  const ziel = join(ausgabe, 'beide.pdf');
  const { app, win, daten } = await starten({ VTUE_PDF_ZIEL: ziel });
  try {
    await win.click('.nav li:has-text("Familie Berger")');
    await win.waitForSelector('.bereich.v1.vers');
    await win.keyboard.press('Control+p');
    await win.waitForSelector('.sheet.ex2');
    await pause(200);
    await bild(win, 'm4-pdf-dialog');
    await win.click('.sheet.ex2 footer .btn.primary');
    await win.waitForSelector('.ub-toast:has-text("PDF gespeichert")', { timeout: 30000 });
    console.log('  ' + (await win.textContent('.ub-toast span')));
    execFileSync('pdftoppm', ['-png', '-r', '110', ziel, join(bilder, 'app-m4-pdf-s')]);
    // Variante: Nur Neu, Ersparnis aus, Titel im Kopf, mit Passwort
    await win.keyboard.press('Control+p');
    await win.waitForSelector('.sheet.ex2');
    await win.click('.choice:has-text("Nur Neu")');
    await win.click('.optrow:has-text("Ersparnis anzeigen") .switch');
    await win.click('.cbl');
    await win.click('.optrow:has-text("Mit Passwort") .switch');
    await win.fill('.pw-feld input', 'geheim123');
    await pause(150);
    await bild(win, 'm4-pdf-dialog-passwort');
    await win.click('.sheet.ex2 footer .btn.primary');
    await win.waitForSelector('.ub-toast:has-text("mit Passwort")', { timeout: 30000 });
    console.log('  ' + (await win.textContent('.ub-toast span')));
  } finally {
    await app.close();
    rmSync(daten, { recursive: true, force: true });
  }
  console.log('  PDF:', ziel);
  return ausgabe;
}

const schritte = { m2, m3, m4 };
for (const [name, fn] of Object.entries(schritte)) {
  if (was === 'alle' || was === name) {
    console.log(`Screenshots ${name} …`);
    await fn();
  }
}
console.log('fertig:', bilder);

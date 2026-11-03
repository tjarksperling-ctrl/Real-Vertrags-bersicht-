/**
 * Erzeugt App- und Dateisymbol (Entwurf H „Nachtblau mit Schild“, freigegeben Sitzung 28) für electron-builder:
 *   build/icon.png (1024), build/fenster.png (256, Fenster/Taskleiste), build/icon.ico (16–256), build/icon.icns,
 *   build/vtue.ico, build/vtue.icns (Symbol der .vtue-Datei, fileAssociations)
 * Quelle: mockups/symbol/H_app.svg und H_datei.svg (erzeugt von mockups/symbol/symbole.py).
 * Aufruf: node werkzeug/app-symbol.mjs   (nutzt das vorhandene Playwright/Chromium)
 */
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT_PFAD || 'playwright');
const wurzel = resolve(import.meta.dirname, '..');
const ziel = join(wurzel, 'build');
mkdirSync(ziel, { recursive: true });

const browser = await pw.chromium.launch();
const seite = await browser.newPage();

/** SVG in einer Größe als PNG (transparenter Hintergrund). */
async function png(svg, groesse) {
  await seite.setViewportSize({ width: groesse, height: groesse });
  await seite.setContent(
    `<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${groesse}px;height:${groesse}px}</style>${svg}`,
  );
  return seite.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: groesse, height: groesse } });
}

/** ICO mit eingebetteten PNGs (Windows Vista und neuer). */
function ico(bilder) {
  const kopf = Buffer.alloc(6);
  kopf.writeUInt16LE(0, 0);
  kopf.writeUInt16LE(1, 2);
  kopf.writeUInt16LE(bilder.length, 4);
  let versatz = 6 + 16 * bilder.length;
  const eintraege = bilder.map(([g, daten]) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(g >= 256 ? 0 : g, 0);
    e.writeUInt8(g >= 256 ? 0 : g, 1);
    e.writeUInt16LE(1, 4); // Farbebenen
    e.writeUInt16LE(32, 6); // Bit je Pixel
    e.writeUInt32LE(daten.length, 8);
    e.writeUInt32LE(versatz, 12);
    versatz += daten.length;
    return e;
  });
  return Buffer.concat([kopf, ...eintraege, ...bilder.map(([, d]) => d)]);
}

/** ICNS mit PNG-Einträgen (macOS 10.7+). */
function icns(bilder) {
  const typ = { 16: 'icp4', 32: 'icp5', 64: 'icp6', 128: 'ic07', 256: 'ic08', 512: 'ic09', 1024: 'ic10' };
  const teile = bilder.map(([g, daten]) => {
    const k = Buffer.alloc(8);
    k.write(typ[g], 0, 'ascii');
    k.writeUInt32BE(daten.length + 8, 4);
    return Buffer.concat([k, daten]);
  });
  const k = Buffer.alloc(8);
  k.write('icns', 0, 'ascii');
  k.writeUInt32BE(8 + teile.reduce((s, t) => s + t.length, 0), 4);
  return Buffer.concat([k, ...teile]);
}

async function satz(svgDatei, name) {
  const svg = readFileSync(join(wurzel, 'mockups/symbol', svgDatei), 'utf8');
  const g = {};
  for (const s of [16, 24, 32, 48, 64, 128, 256, 512, 1024]) g[s] = await png(svg, s);
  writeFileSync(join(ziel, `${name}.ico`), ico([16, 24, 32, 48, 64, 128, 256].map((s) => [s, g[s]])));
  writeFileSync(join(ziel, `${name}.icns`), icns([16, 32, 64, 128, 256, 512, 1024].map((s) => [s, g[s]])));
  writeFileSync(join(ziel, `${name}.png`), g[1024]);
  // Fenster-/Taskleistensymbol unter Windows und Linux (BrowserWindow „icon“)
  if (name === 'icon') writeFileSync(join(ziel, 'fenster.png'), g[256]);
  console.log(`${name}: .png .ico .icns`);
}

await satz('H_app.svg', 'icon');
await satz('H_datei.svg', 'vtue');
await browser.close();

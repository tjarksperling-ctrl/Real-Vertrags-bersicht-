// Bild 7: Seiten einer PDF-Vorschau einzeln fotografieren, Überlauf prüfen, optional PDF erzeugen.
// node mockups/werkzeug/pdf-seiten.js <seite.html> <bild-präfix> [ausgabe.pdf]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [html, prefix, pdf] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 1.6 });
  await p.goto('file://' + path.resolve(html));
  await p.addStyleTag({ content: '.pdf-bar{display:none}' });
  const info = await p.$$eval('.page', ps => ps.map(e => ({ h: e.clientHeight, s: e.scrollHeight,
    last: Math.max(...[...e.children].filter(c => !c.classList.contains('page-label')).map(c => c.getBoundingClientRect().bottom)) - e.getBoundingClientRect().top })));
  info.forEach((x, i) => console.log(`Seite ${i + 1}: Inhalt bis ${Math.round(x.last)} von ${x.h} px${x.last > x.h - 45 ? '  ÜBERLAUF/zu knapp' : ''}`));
  const bad = await p.$$eval('.page td, .page th', cs => cs.filter(c => c.scrollWidth > c.clientWidth + 1).map(c => c.textContent.slice(0, 30)));
  if (bad.length) console.log('Zu breite Zellen:', bad);
  const pages = await p.$$('.page');
  for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: `${prefix}-s${i + 1}.png` });
  if (pdf) await p.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();

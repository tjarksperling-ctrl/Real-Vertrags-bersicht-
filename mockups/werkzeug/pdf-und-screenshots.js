const { chromium } = require('playwright');
(async () => {
  const dir = '/home/user/Real-Vertrags-bersicht-/mockups/';
  const out = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1488, height: 900 } });
  for (const n of ['start','aktuell','neu','nebeneinander','export','ki-import','index']) {
    await p.goto('file://' + dir + n + '.html');
    await p.screenshot({ path: `${out}/${n}.png` });
  }
  await p.goto('file://' + dir + 'pdf.html');
  await p.screenshot({ path: `${out}/pdf.png`, fullPage: true });
  await p.pdf({ path: dir + 'pdf-vorschau.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();

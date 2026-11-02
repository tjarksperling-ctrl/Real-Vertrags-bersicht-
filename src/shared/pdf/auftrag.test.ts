import { pdfAbschnitte, pdfBereiche, pdfDateiname, vergleichZeilen, type PdfOptionen } from './auftrag';
import { neueUebersicht } from '../modell/fabrik';
import { beispielAktuell, beispielNeu } from '../testdaten/beispiel';
import type { Uebersicht } from '../modell/typen';

function berger(): Uebersicht {
  const u = neueUebersicht('k', beispielAktuell());
  u.neu = beispielNeu();
  u.vorteile = { aktiv: true, stichpunkte: ['Günstiger'] };
  return u;
}
const opt = (o: Partial<PdfOptionen> = {}): PdfOptionen => ({ inhalt: 'beide', vergleich: true, vorteile: true, ersparnis: true, titel: false, ...o });

describe('PDF-Abschnitte (Bild 5 v2)', () => {
  it('Beide + Vergleichsseite: Aktuell, Neu, Vergleich mit Vorteilen', () => {
    expect(pdfAbschnitte(berger(), opt())).toEqual([
      { art: 'fassung', fassung: 'aktuell', mitDifferenz: false, vorteile: false },
      { art: 'fassung', fassung: 'neu', mitDifferenz: true, vorteile: false },
      { art: 'vergleich', mitDifferenz: true, vorteile: true },
    ]);
  });
  it('ohne Vergleichsseite stehen die Vorteile nach dem Gesamtbetrag „Neu“', () => {
    expect(pdfAbschnitte(berger(), opt({ vergleich: false }))[1]).toMatchObject({ fassung: 'neu', vorteile: true });
  });
  it('Nur Aktuell: keine Vorteile, keine Vergleichsseite', () => {
    expect(pdfAbschnitte(berger(), opt({ inhalt: 'aktuell' }))).toEqual([{ art: 'fassung', fassung: 'aktuell', mitDifferenz: false, vorteile: false }]);
  });
  it('Ersparnis aus: keine Differenzen', () => {
    const a = pdfAbschnitte(berger(), opt({ inhalt: 'neu', ersparnis: false }));
    expect(a).toEqual([{ art: 'fassung', fassung: 'neu', mitDifferenz: false, vorteile: true }]);
  });
});

describe('PDF-Inhalt', () => {
  it('ohne abgewählte Bereiche und leere Untergruppen', () => {
    const f = beispielAktuell();
    f.bereiche.DARL.aktiv = false;
    f.bereiche.VERS.untergruppen[2]!.vertraege = [];
    const r = pdfBereiche(f);
    expect(r.map((x) => x.typ)).toEqual(['VERS', 'SPAR', 'AV']);
    expect(r[0]!.b.untergruppen.map((u) => u.name)).toEqual(['Haftpflicht & Recht', 'Wohnen']);
  });
  it('Dateiname wie im Mockup', () => {
    expect(pdfDateiname('Familie Berger', new Date(2026, 10, 2))).toBe('Vertragsuebersicht_Berger_2026-11-02.pdf');
    expect(pdfDateiname('Elif Yılmaz', new Date(2026, 0, 5))).toBe('Vertragsuebersicht_Ylmaz_2026-01-05.pdf');
    expect(pdfDateiname('Jürgen Müßig', new Date(2026, 0, 5))).toBe('Vertragsuebersicht_Muessig_2026-01-05.pdf');
  });
  it('Vergleichsseite: Werte wie Bild 7 v1', () => {
    const { monat, weitere } = vergleichZeilen(berger());
    expect(monat.map((z) => [z.aktuell, z.neu])).toEqual([
      [18405, 16545],
      [20000, 20000],
      [143900, 143900],
      [21020, 20340],
      [203325, 200785],
      [2439900, 2409420],
    ]);
    expect(weitere.map((z) => [z.label, z.aktuell])).toEqual([
      ['Einmalbeträge', 800000],
      ['Gesamtvermögen', 2659250],
      ['Gesamtrestschuld', 22273000],
    ]);
  });
});

import { leereFassung, neuerVertrag } from '../modell/fabrik';
import type { Fassung, Untergruppe, VertragJeTyp } from '../modell/typen';
import { beispielAktuell, beispielNeu } from '../testdaten/beispiel';
import { bereichSumme, fassungSumme, untergruppenSumme, vertragEinmalbetrag, vertragJahresbetrag } from './summen';

const ug = <T extends keyof VertragJeTyp>(...vertraege: VertragJeTyp[T][]): Untergruppe<T> => ({
  id: 'u', name: 'UG', symbol: 'shield', vertraege,
});
const vers = (beitrag: number | null, zahlweise: VertragJeTyp['VERS']['zahlweise']) => ({
  ...neuerVertrag('VERS'), beitrag, zahlweise,
});

describe('Beispielkunde aus den Mockups (Bild 2/3)', () => {
  it('Aktuell: Bereiche und Gesamt/Monat = 2.033,25 €', () => {
    const s = fassungSumme(beispielAktuell());
    expect(s.bereiche.VERS.untergruppen.map((u) => u.monat)).toEqual([3995, 6310, 8100]);
    expect(s.bereiche.VERS.monat).toBe(18405);
    expect(s.bereiche.SPAR.monat).toBe(20000);
    expect(s.bereiche.DARL.monat).toBe(143900);
    expect(s.bereiche.AV.monat).toBe(21020);
    expect(s.gesamtMonat).toBe(203325);
  });

  it('Aktuell: Einmalbeträge, Gesamtvermögen, Gesamtrestschuld', () => {
    const s = fassungSumme(beispielAktuell());
    expect(s.bereiche.VERS.einmal).toBe(0);
    expect(s.bereiche.SPAR.einmal).toBe(500000);
    expect(s.bereiche.AV.einmal).toBe(300000);
    expect(s.bereiche.SPAR.gesamtvermoegen).toBe(1248000 + 231540 + 500000 + 41280 + 620000 + 18430);
    expect(s.bereiche.DARL.restschuld).toBe(22273000);
  });

  it('Neu: Gesamt/Monat = 2.007,85 €', () => {
    const s = fassungSumme(beispielNeu());
    expect(s.bereiche.VERS.monat).toBe(16545);
    expect(s.bereiche.AV.monat).toBe(20340);
    expect(s.gesamtMonat).toBe(200785);
  });
});

describe('Rundung „sichtbar stimmig“', () => {
  it('rundet einmal je Untergruppe aus dem exakten Jahresbetrag', () => {
    // 3 × 1,00 €/Jahr in einer Untergruppe: exakt 0,25 €/Monat (nicht 3 × 0,08 €)
    expect(untergruppenSumme('VERS', ug(vers(100, 'jaehrlich'), vers(100, 'jaehrlich'), vers(100, 'jaehrlich'))).monat).toBe(25);
  });

  it('Bereich = Summe der angezeigten Untergruppen-Summen', () => {
    // 3 Untergruppen à 1,00 €/Jahr: je 0,08 € angezeigt → Bereich 0,24 € (nicht 0,25 €)
    const b = { aktiv: true, untergruppen: [ug(vers(100, 'jaehrlich')), ug(vers(100, 'jaehrlich')), ug(vers(100, 'jaehrlich'))] };
    const s = bereichSumme('VERS', b);
    expect(s.untergruppen.map((u) => u.monat)).toEqual([8, 8, 8]);
    expect(s.monat).toBe(24);
  });

  it('Gesamt = Summe der angezeigten Bereichssummen', () => {
    const f = leereFassung();
    f.bereiche.VERS.untergruppen = [ug(vers(100, 'jaehrlich'))];
    f.bereiche.AV.untergruppen = [ug({ ...neuerVertrag('AV'), beitrag: 100, zahlweise: 'jaehrlich' })];
    const s = fassungSumme(f);
    expect(s.gesamtMonat).toBe(s.bereiche.VERS.monat + s.bereiche.AV.monat);
    expect(s.gesamtMonat).toBe(16);
  });

  it('kaufmännisch: 0,5 Cent wird aufgerundet', () => {
    expect(untergruppenSumme('VERS', ug(vers(6, 'jaehrlich'))).monat).toBe(1); // 0,5 Cent → 1
    expect(untergruppenSumme('VERS', ug(vers(5, 'jaehrlich'))).monat).toBe(0); // 0,4167 Cent → 0
  });
});

describe('Einmalbeträge', () => {
  it('VERS: Beitrag mit Zahlweise „einmalig“ nur im Einmal-Topf', () => {
    const s = untergruppenSumme('VERS', ug(vers(12000, 'einmalig'), vers(1000, 'monatlich')));
    expect(s.monat).toBe(1000);
    expect(s.einmal).toBe(12000);
  });

  it('SPAR: Einmalbetrag-Feld plus einmalige Sparrate', () => {
    const v: VertragJeTyp['SPAR'] = { ...neuerVertrag('SPAR'), sparrate: 2000, zahlweise: 'einmalig', einmalbetrag: 5000 };
    expect(vertragJahresbetrag('SPAR', v)).toBe(0);
    expect(vertragEinmalbetrag('SPAR', v)).toBe(7000);
  });

  it('SPAR: Einmalbetrag neben laufender Sparrate', () => {
    const v: VertragJeTyp['SPAR'] = { ...neuerVertrag('SPAR'), sparrate: 5000, zahlweise: 'monatlich', einmalbetrag: 100000 };
    expect(vertragJahresbetrag('SPAR', v)).toBe(60000);
    expect(vertragEinmalbetrag('SPAR', v)).toBe(100000);
  });

  it('AV: Einmalbeitrag-Feld plus einmaliger Beitrag', () => {
    const v: VertragJeTyp['AV'] = { ...neuerVertrag('AV'), beitrag: 1000, zahlweise: 'einmalig', einmalbeitrag: 300000 };
    expect(vertragJahresbetrag('AV', v)).toBe(0);
    expect(vertragEinmalbetrag('AV', v)).toBe(301000);
  });

  it('ohne Einmalbeträge ist der Einmal-Topf 0 (wird dann nicht angezeigt)', () => {
    expect(fassungSumme(beispielAktuell()).bereiche.VERS.einmal).toBe(0);
  });
});

describe('Bereiche', () => {
  it('abgewählter Bereich zählt nicht zum Gesamtbetrag, wird aber weiter berechnet', () => {
    const f: Fassung = beispielAktuell();
    f.bereiche.DARL.aktiv = false;
    const s = fassungSumme(f);
    expect(s.bereiche.DARL.monat).toBe(143900);
    expect(s.bereiche.DARL.aktiv).toBe(false);
    expect(s.gesamtMonat).toBe(203325 - 143900);
  });

  it('DARL: Rate/Monat und Gesamtrestschuld, Zahlweise wird umgerechnet', () => {
    const v: VertragJeTyp['DARL'] = { ...neuerVertrag('DARL'), rate: 30000, zahlweise: 'vierteljaehrlich', restschuld: 5000000 };
    const s = bereichSumme('DARL', { aktiv: true, untergruppen: [ug(v)] });
    expect(s.monat).toBe(10000);
    expect(s.restschuld).toBe(5000000);
  });

  it('SPAR: negative Wertentwicklung mindert das Gesamtvermögen', () => {
    const v: VertragJeTyp['SPAR'] = { ...neuerVertrag('SPAR'), guthaben: 1000000, wertentwicklung: -125050 };
    expect(bereichSumme('SPAR', { aktiv: true, untergruppen: [ug(v)] }).gesamtvermoegen).toBe(874950);
  });

  it('leere Fassung und leere Felder ergeben 0', () => {
    const f = leereFassung();
    f.bereiche.VERS.untergruppen = [ug(vers(null, 'monatlich'))];
    f.bereiche.SPAR.untergruppen = [ug(neuerVertrag('SPAR'))];
    const s = fassungSumme(f);
    expect(s.gesamtMonat).toBe(0);
    expect(s.bereiche.SPAR.gesamtvermoegen).toBe(0);
    expect(s.bereiche.SPAR.einmal).toBe(0);
  });

  it('große Beträge bleiben exakt', () => {
    const v = vers(99999999999, 'monatlich'); // ~ 1 Mrd. €
    expect(untergruppenSumme('VERS', ug(v)).monat).toBe(99999999999);
  });
});

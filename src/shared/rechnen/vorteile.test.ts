import { beispielAktuell, beispielNeu } from '../testdaten/beispiel';
import { vergleicheBetraege, vergleicheFassungen } from './vorteile';

describe('Vorteile: Ersparnis/Mehrbeitrag', () => {
  it('Beispiel Bild 3: 25,40 € Ersparnis im Monat, 304,80 € im Jahr', () => {
    const v = vergleicheFassungen(beispielAktuell(), beispielNeu());
    expect(v).toEqual({ differenzMonat: -2540, differenzJahr: -30480, art: 'ersparnis', betragMonat: 2540, betragJahr: 30480 });
  });

  it('Mehrbeitrag, wenn Neu teurer ist', () => {
    const v = vergleicheBetraege(10000, 12550);
    expect(v.art).toBe('mehrbeitrag');
    expect(v.betragMonat).toBe(2550);
    expect(v.betragJahr).toBe(30600);
  });

  it('gleich, wenn kein Unterschied', () => {
    const v = vergleicheBetraege(10000, 10000);
    expect(v.art).toBe('gleich');
    expect(v.differenzJahr).toBe(0);
  });

  it('Jahr = Monat × 12 (sichtbar stimmig)', () => {
    const v = vergleicheBetraege(203325, 200785);
    expect(v.differenzJahr).toBe(v.differenzMonat * 12);
  });

  it('abgewählter Bereich in Neu senkt den Vergleich', () => {
    const neu = beispielNeu();
    neu.bereiche.DARL.aktiv = false;
    expect(vergleicheFassungen(beispielAktuell(), neu).differenzMonat).toBe(-2540 - 143900);
  });
});

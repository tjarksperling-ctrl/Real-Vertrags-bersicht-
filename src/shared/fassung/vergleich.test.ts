import { aenderungen } from './vergleich';
import { beispielAktuell, beispielNeu } from '../testdaten/beispiel';
import { kopiereFassung } from './kopieren';

describe('Änderungen in „Neu“ (Bild 3)', () => {
  it('findet die 4 geänderten Beiträge des Beispielkunden mit vorherigem Wert', () => {
    const a = beispielAktuell();
    const n = beispielNeu();
    // beispielNeu kopiert eine eigene Aktuell-Fassung: quelleIds zeigen auf deren Ids → gleiche Testdaten verwenden
    const neu = kopiereFassung(a);
    const ziel = beispielNeu();
    const setze = (bi: 'VERS' | 'AV', ui: number, vi: number) => {
      (neu.bereiche[bi].untergruppen[ui]!.vertraege[vi] as { beitrag: number }).beitrag = (ziel.bereiche[bi].untergruppen[ui]!.vertraege[vi] as { beitrag: number }).beitrag;
    };
    setze('VERS', 0, 1);
    setze('VERS', 1, 1);
    setze('VERS', 2, 0);
    setze('AV', 1, 1);
    const r = aenderungen(a, neu);
    expect(r.size).toBe(4);
    const rs = r.get(neu.bereiche.VERS.untergruppen[0]!.vertraege[1]!.id);
    expect(rs).toEqual({ typ: 'VERS', feld: 'beitrag', vorher: 3250, nachher: 2890 });
    expect(n).toBeDefined();
  });

  it('ignoriert neue Verträge ohne Ursprung und gleiche Werte (0 = leer)', () => {
    const a = beispielAktuell();
    const neu = kopiereFassung(a);
    delete neu.bereiche.VERS.untergruppen[0]!.vertraege[0]!.quelleId;
    neu.bereiche.VERS.untergruppen[0]!.vertraege[0]!.beitrag = 1;
    expect(aenderungen(a, neu).size).toBe(0);
  });
});

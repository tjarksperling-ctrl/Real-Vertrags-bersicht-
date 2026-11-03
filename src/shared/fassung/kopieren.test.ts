import { neueUebersicht } from '../modell/fabrik';
import { BEREICH_TYPEN } from '../modell/typen';
import { fassungSumme } from '../rechnen/summen';
import { beispielAktuell } from '../testdaten/beispiel';
import { kopiereFassung, neuWieAktuell } from './kopieren';

describe('kopiereFassung (Neu als Kopie von Aktuell)', () => {
  it('neue Ids, quelleId zeigt auf das Original', () => {
    const a = beispielAktuell();
    const n = kopiereFassung(a);
    for (const typ of BEREICH_TYPEN) {
      a.bereiche[typ].untergruppen.forEach((ug, i) => {
        const k = n.bereiche[typ].untergruppen[i]!;
        expect(k.id).not.toBe(ug.id);
        expect(k.quelleId).toBe(ug.id);
        ug.vertraege.forEach((v, j) => {
          expect(k.vertraege[j]!.id).not.toBe(v.id);
          expect(k.vertraege[j]!.quelleId).toBe(v.id);
          expect(k.vertraege[j]!.name).toBe(v.name);
        });
      });
    }
  });

  it('gleiche Summen und gleiche Bereichsauswahl', () => {
    const a = beispielAktuell();
    a.bereiche.DARL.aktiv = false;
    const n = kopiereFassung(a);
    expect(n.bereiche.DARL.aktiv).toBe(false);
    expect(fassungSumme(n)).toEqual(fassungSumme(a));
  });

  it('tiefe Kopie: Änderungen an der Kopie ändern das Original nicht', () => {
    const a = beispielAktuell();
    const n = kopiereFassung(a);
    const av = n.bereiche.AV.untergruppen[0]!.vertraege[0]!;
    av.leistung.betrag = 1;
    av.beitrag = 1;
    n.bereiche.VERS.untergruppen[0]!.name = 'X';
    expect(a.bereiche.AV.untergruppen[0]!.vertraege[0]!.leistung.betrag).toBe(41200);
    expect(a.bereiche.AV.untergruppen[0]!.vertraege[0]!.beitrag).toBe(10000);
    expect(a.bereiche.VERS.untergruppen[0]!.name).toBe('Haftpflicht & Recht');
  });
});

describe('Übersicht', () => {
  it('neue Übersicht: Neu startet als Kopie von Aktuell', () => {
    const u = neueUebersicht('k1', beispielAktuell());
    expect(fassungSumme(u.neu).gesamtMonat).toBe(fassungSumme(u.aktuell).gesamtMonat);
    expect(u.neu.bereiche.VERS.untergruppen[0]!.quelleId).toBe(u.aktuell.bereiche.VERS.untergruppen[0]!.id);
  });

  it('„Neu wieder wie Aktuell“ überschreibt Neu komplett, Original bleibt erhalten', () => {
    const u = neueUebersicht('k1', beispielAktuell());
    u.neu.bereiche.VERS.untergruppen = [];
    const zurueck = neuWieAktuell(u, '2026-11-02T12:00:00.000Z');
    expect(zurueck.neu.bereiche.VERS.untergruppen).toHaveLength(3);
    expect(zurueck.geaendert).toBe('2026-11-02T12:00:00.000Z');
    expect(u.neu.bereiche.VERS.untergruppen).toHaveLength(0); // für Rückgängig unverändert
  });
});

describe('Aus letzter Übersicht übernehmen', () => {
  it('kopiert ohne quelleId mit neuen Ids', async () => {
    const { beispielNeu } = await import('../testdaten/beispiel');
    const neu = beispielNeu();
    const k = kopiereFassung(neu, false);
    const v = k.bereiche.VERS.untergruppen[0]!.vertraege[0]!;
    expect(v.quelleId).toBeUndefined();
    expect(k.bereiche.VERS.untergruppen[0]!.quelleId).toBeUndefined();
    expect(v.id).not.toBe(neu.bereiche.VERS.untergruppen[0]!.vertraege[0]!.id);
    expect(v.name).toBe(neu.bereiche.VERS.untergruppen[0]!.vertraege[0]!.name);
  });
});

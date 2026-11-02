import { BEREICH_TYPEN } from './typen';
import { fassungAusVorlage, leereFassung, neuerKunde, neuerVertrag, neueUebersicht, STANDARD_EINSTELLUNGEN } from './fabrik';
import { AGENTUR_STANDARD, AGENTUR_VORLAGEN, JUNGE_FAMILIE } from './vorlagen';

describe('Fabrik', () => {
  it('neuer Kunde speichert nur den Namen (getrimmt)', () => {
    const k = neuerKunde('  Familie Muster ');
    expect(Object.keys(k).sort()).toEqual(['erstellt', 'geaendert', 'id', 'name']);
    expect(k.name).toBe('Familie Muster');
  });

  it('leere Fassung: 4 aktive Bereiche ohne Untergruppen', () => {
    const f = leereFassung();
    expect(Object.keys(f.bereiche)).toEqual([...BEREICH_TYPEN]);
    for (const t of BEREICH_TYPEN) expect(f.bereiche[t]).toEqual({ aktiv: true, untergruppen: [] });
  });

  it('neue Verträge haben leere Beträge und Zahlweise monatlich', () => {
    expect(neuerVertrag('VERS')).toMatchObject({ beitrag: null, zahlweise: 'monatlich', bemerkung: '' });
    expect(neuerVertrag('AV', 'Private Rente')).toMatchObject({ name: 'Private Rente', leistung: { betrag: null, art: 'RENTE_MTL' }, laufzeitBis: null });
    expect(neuerVertrag('DARL')).toMatchObject({ rate: null, restschuld: null, zinsbindungBis: null });
  });

  it('Ids sind eindeutig', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => neuerVertrag('VERS').id));
    expect(ids.size).toBe(1000);
  });

  it('neue Übersicht: Sync an, Ersparnis an, Vorteile aus', () => {
    const u = neueUebersicht('k1');
    expect(u).toMatchObject({ kundeId: 'k1', syncAktiv: true, ersparnisAnzeigen: true, vorteile: { aktiv: false, stichpunkte: [] }, aufgaben: [] });
    expect(u.titel).toBeUndefined();
  });

  it('Standard-Einstellungen: Hell/Dunkel automatisch, Aufbewahrung 10 Jahre', () => {
    expect(STANDARD_EINSTELLUNGEN).toMatchObject({ darstellung: 'auto', aufbewahrungJahre: 10, pdfPasswortStandard: false, angepinnt: [] });
  });
});

describe('Vorlagen', () => {
  const anzahl = (v: typeof AGENTUR_STANDARD) => ({
    bereiche: BEREICH_TYPEN.filter((t) => v.bereiche[t].aktiv).length,
    untergruppen: BEREICH_TYPEN.filter((t) => v.bereiche[t].aktiv).reduce((s, t) => s + v.bereiche[t].untergruppen.length, 0),
  });

  it('Agentur-Standard: 4 Bereiche · 9 Untergruppen, Standard für neue Kunden', () => {
    expect(anzahl(AGENTUR_STANDARD)).toEqual({ bereiche: 4, untergruppen: 9 });
    expect(AGENTUR_VORLAGEN.filter((v) => v.standard)).toEqual([AGENTUR_STANDARD]);
  });

  it('Junge Familie: 3 Bereiche · 8 Untergruppen', () => {
    expect(anzahl(JUNGE_FAMILIE)).toEqual({ bereiche: 3, untergruppen: 8 });
  });

  it('Fassung aus Vorlage übernimmt Bereiche, Namen und Symbole', () => {
    const f = fassungAusVorlage(JUNGE_FAMILIE);
    expect(f.bereiche.DARL.aktiv).toBe(false);
    expect(f.bereiche.VERS.untergruppen.map((u) => [u.name, u.symbol])).toEqual([
      ['Haftpflicht & Recht', 'shield'], ['Wohnen', 'home'], ['Kfz', 'car'], ['Gesundheit', 'activity'],
    ]);
    expect(f.bereiche.VERS.untergruppen.every((u) => u.vertraege.length === 0)).toBe(true);
  });
});

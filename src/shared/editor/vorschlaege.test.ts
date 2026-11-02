import { baueKatalog, vorschlaege } from './vorschlaege';
import { findeDublette, initialen, titelVorschlag, avatarFarbe } from './bestand';
import { AGENTUR_VORLAGEN } from '../modell/vorlagen';
import { neueUebersicht, neuerKunde } from '../modell/fabrik';
import { beispielAktuell } from '../testdaten/beispiel';

describe('Vorschläge beim Tippen (Bild 11)', () => {
  const katalog = baueKatalog(AGENTUR_VORLAGEN, [neueUebersicht('k1', beispielAktuell()), neueUebersicht('k2', beispielAktuell())]);

  it('findet Namen, die mit der Eingabe beginnen, mit Untergruppe und üblicher Zahlweise', () => {
    expect(vorschlaege(katalog, 'VERS', 'Haus')).toEqual([{ name: 'Hausrat', ugName: 'Wohnen', zahlweise: 'jaehrlich', anzahl: 2 }]);
  });

  it('kennt Vorschläge aus Vorlagen auch ohne Kunden', () => {
    const nurVorlagen = baueKatalog(AGENTUR_VORLAGEN, []);
    expect(vorschlaege(nurVorlagen, 'VERS', 'kfz')[0]).toEqual({ name: 'Kfz-Versicherung', ugName: 'Kfz', anzahl: 0 });
  });

  it('findet auch Wortanfänge und sortiert nach Häufigkeit', () => {
    const r = vorschlaege(katalog, 'AV', 'rente');
    expect(r.map((v) => v.name)).toEqual(['Private Rente']);
  });

  it('erst ab zwei Zeichen, je Bereich getrennt', () => {
    expect(vorschlaege(katalog, 'VERS', 'H')).toEqual([]);
    expect(vorschlaege(katalog, 'SPAR', 'Haus')).toEqual([]);
  });
});

describe('Kunden', () => {
  it('Dublettenprüfung ignoriert Groß-/Kleinschreibung und Leerzeichen', () => {
    const k = [neuerKunde('Familie Berger')];
    expect(findeDublette(k, ' familie  berger ')).toBe(k[0]);
    expect(findeDublette(k, 'Familie Hoffmann')).toBeUndefined();
    expect(findeDublette(k, '  ')).toBeUndefined();
  });

  it('Kürzel wie in den Mockups', () => {
    expect(initialen('Familie Berger')).toBe('FB');
    expect(initialen('Jonas & Mira Albers')).toBe('JA');
    expect(initialen('Elif Yılmaz')).toBe('EY');
    expect(initialen('Müller')).toBe('M');
    expect(initialen('')).toBe('?');
  });

  it('Titelvorschlag aus Anlass und Jahr, feste Farbe je Kunde', () => {
    expect(titelVorschlag(new Date(2026, 10, 2))).toBe('Erstberatung 2026');
    expect(avatarFarbe('abc')).toBe(avatarFarbe('abc'));
  });
});

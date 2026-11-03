import { describe, expect, it } from 'vitest';
import { AGENTUR_SCHNELLSTART, linksAus, symbolVorschlag, zielGueltig, zielNormal } from './schnellstart';

describe('Schnellstart', () => {
  it('schlägt Symbole vor', () => {
    expect(symbolVorschlag('https://www.kfz-tarif.de')).toBe('car');
    expect(symbolVorschlag('Bank-Portal')).toBe('bank');
    expect(symbolVorschlag('Vergleichsrechner')).toBe('calc');
    expect(symbolVorschlag('https://example.org')).toBe('globe');
  });
  it('prüft Ziele', () => {
    expect(zielGueltig('https://www.maklerportal.de/login')).toBe(true);
    expect(zielGueltig('https://')).toBe(false);
    expect(zielGueltig('C:\\Program Files\\App\\app.exe')).toBe(true);
    expect(zielGueltig('/Applications/Teams.app')).toBe(true);
    expect(zielGueltig('javascript:alert(1)')).toBe(false);
    expect(zielGueltig('irgendwas')).toBe(false);
    expect(zielNormal('www.kfz-tarif.de')).toBe('https://www.kfz-tarif.de');
    expect(zielNormal('C:\\x.exe')).toBe('C:\\x.exe');
  });
  it('Agentur-Standard bekommt neue Ids', () => {
    const a = linksAus(AGENTUR_SCHNELLSTART);
    expect(a).toHaveLength(AGENTUR_SCHNELLSTART.length);
    expect(new Set(a.map((l) => l.id)).size).toBe(a.length);
    expect(a.every((l) => zielGueltig(l.ziel))).toBe(true);
  });
});

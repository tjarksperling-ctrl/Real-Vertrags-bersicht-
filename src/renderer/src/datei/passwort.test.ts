import { describe, expect, it } from 'vitest';
import { passwortStaerke, passwortVorschlag } from './passwort';

describe('Passwort für Desktop-Dateien', () => {
  it('bewertet die Stärke', () => {
    expect(passwortStaerke('').stufe).toBe(0);
    expect(passwortStaerke('abc').text).toBe('zu kurz');
    expect(passwortStaerke('abcdefgh').text).toBe('schwach');
    expect(passwortStaerke('Abcdefg1').text).toBe('mittel');
    expect(passwortStaerke('Mond-Hafen-Eule-47').text).toBe('stark');
  });
  it('schlägt starke Passwörter vor', () => {
    const p = passwortVorschlag();
    expect(p).toMatch(/^[A-Z][a-z]+-[A-Z][a-z]+-[A-Z][a-z]+-\d\d$/);
    expect(passwortStaerke(p).text).toBe('stark');
  });
});

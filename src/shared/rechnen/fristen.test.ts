import { neueAufgabe } from '../modell/fabrik';
import type { Kunde } from '../modell/typen';
import { alteKunden, istFaellig, jahreZurueck } from './fristen';

describe('Aufgaben: fällig', () => {
  it('fällig heute oder früher, nicht erledigt', () => {
    expect(istFaellig(neueAufgabe('A', '2026-11-02'), '2026-11-02')).toBe(true);
    expect(istFaellig(neueAufgabe('A', '2026-10-01'), '2026-11-02')).toBe(true);
    expect(istFaellig(neueAufgabe('A', '2026-11-03'), '2026-11-02')).toBe(false);
    expect(istFaellig(neueAufgabe('A'), '2026-11-02')).toBe(false);
    expect(istFaellig({ ...neueAufgabe('A', '2026-10-01'), erledigt: true }, '2026-11-02')).toBe(false);
  });
});

describe('Aufbewahrung: alte Kunden vorschlagen (Bild 16)', () => {
  const k = (name: string, geaendert: string): Kunde => ({ id: name, name, erstellt: geaendert, geaendert });

  it('jahreZurueck, auch über den 29.02.', () => {
    expect(jahreZurueck('2026-11-02', 10)).toBe('2016-11-02');
    expect(jahreZurueck('2028-02-29', 1)).toBe('2027-02-28');
  });

  it('schlägt Kunden ohne Änderung seit 10 Jahren vor (Standard)', () => {
    const kunden = [k('alt', '2015-03-01T10:00:00.000Z'), k('grenze', '2016-11-02T08:00:00.000Z'), k('neu', '2016-11-03T00:00:00.000Z')];
    expect(alteKunden(kunden, '2026-11-02').map((x) => x.name)).toEqual(['alt', 'grenze']);
  });

  it('Frist ist einstellbar', () => {
    expect(alteKunden([k('a', '2020-01-01T00:00:00.000Z')], '2026-11-02', 5).length).toBe(1);
    expect(alteKunden([k('a', '2020-01-01T00:00:00.000Z')], '2026-11-02', 7).length).toBe(0);
  });
});

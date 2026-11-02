import { formatDatum, formatHeute, formatMonat, leseDatum, leseMonat } from './datum';

describe('Datum (Laufzeit bis)', () => {
  it('liest deutsche Eingaben', () => {
    expect(leseDatum('01.07.2052')).toBe('2052-07-01');
    expect(leseDatum('1.7.52')).toBe('2052-07-01');
    expect(leseDatum('2051-12-31')).toBe('2051-12-31');
    expect(leseDatum(' ')).toBeNull();
  });
  it('lehnt ungültige Daten ab', () => {
    expect(leseDatum('31.02.2050')).toBeUndefined();
    expect(leseDatum('morgen')).toBeUndefined();
  });
  it('formatiert TT.MM.JJJJ', () => {
    expect(formatDatum('2052-07-01')).toBe('01.07.2052');
    expect(formatDatum(null)).toBe('');
    expect(formatHeute(new Date(2026, 10, 2))).toBe('02.11.2026');
  });
});

describe('Monat (Zinsbindung)', () => {
  it('liest und formatiert MM/JJJJ', () => {
    expect(leseMonat('6/2034')).toBe('2034-06');
    expect(leseMonat('06.34')).toBe('2034-06');
    expect(leseMonat('2034-06')).toBe('2034-06');
    expect(leseMonat('13/2030')).toBeUndefined();
    expect(leseMonat('')).toBeNull();
    expect(formatMonat('2034-06')).toBe('06/2034');
  });
});

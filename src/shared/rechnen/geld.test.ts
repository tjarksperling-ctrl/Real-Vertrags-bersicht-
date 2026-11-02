import { formatBetrag, leseBetrag, rundeDivision, wert } from './geld';

describe('rundeDivision (kaufmännisch)', () => {
  it.each([
    [10, 4, 3], // 2,5 → 3
    [9, 4, 2], // 2,25 → 2
    [11, 4, 3], // 2,75 → 3
    [-10, 4, -3], // −2,5 → −3 (vom Nullpunkt weg)
    [-9, 4, -2],
    [0, 12, 0],
    [8940, 12, 745], // 745,0
    [100, 12, 8], // 8,33 → 8
    [102, 12, 9], // 8,5 → 9
    [-102, 12, -9],
  ])('%i / %i = %i', (z, n, e) => expect(rundeDivision(z, n)).toBe(e));

  it('liefert nie −0', () => expect(Object.is(rundeDivision(-1, 12), 0)).toBe(true));
  it('lehnt Kommazahlen und Division durch 0 ab', () => {
    expect(() => rundeDivision(1.5, 2)).toThrow(RangeError);
    expect(() => rundeDivision(1, 0)).toThrow(RangeError);
  });
});

describe('wert', () => {
  it('leeres Feld zählt als 0', () => {
    expect(wert(null)).toBe(0);
    expect(wert(undefined)).toBe(0);
    expect(wert(1234)).toBe(1234);
  });
});

describe('leseBetrag', () => {
  it.each([
    ['1.234,56', 123456],
    ['1234,56', 123456],
    ['1234,5', 123450],
    ['12', 1200],
    ['0,07', 7],
    ['-3,20', -320],
    ['−3,20 €', -320],
    ['1.234,56 €', 123456],
    ['€ 12', 1200],
    ['1.000.000', 100000000],
    ['  89,40  ', 8940],
  ])('„%s“ → %i Cent', (eingabe, cent) => expect(leseBetrag(eingabe)).toBe(cent));

  it('leere Eingabe → null', () => {
    expect(leseBetrag('')).toBeNull();
    expect(leseBetrag('  € ')).toBeNull();
  });

  it.each(['abc', '1,234', '12.34', '1.23,45', '1,2,3', '--1', '12,'])('ungültig: „%s“', (eingabe) =>
    expect(leseBetrag(eingabe)).toBeUndefined(),
  );
});

describe('formatBetrag', () => {
  const nb = ' ';
  it.each([
    [123456, `1.234,56${nb}€`],
    [0, `0,00${nb}€`],
    [7, `0,07${nb}€`],
    [100000000, `1.000.000,00${nb}€`],
    [-2540, `−25,40${nb}€`],
  ])('%i → %s', (cent, text) => expect(formatBetrag(cent)).toBe(text));

  it('mit Vorzeichen und ohne €', () => {
    expect(formatBetrag(2540, { mitVorzeichen: true })).toBe(`+25,40${nb}€`);
    expect(formatBetrag(0, { mitVorzeichen: true })).toBe(`0,00${nb}€`);
    expect(formatBetrag(123456, { mitEuro: false })).toBe('1.234,56');
  });

  it('Hin und zurück ergibt denselben Wert', () => {
    for (const c of [0, 1, 99, 100, 123456, -98765, 100000000]) expect(leseBetrag(formatBetrag(c))).toBe(c);
  });
});

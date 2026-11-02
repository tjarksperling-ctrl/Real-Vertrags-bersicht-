import { ZAHLWEISEN } from '../modell/typen';
import { rundeDivision } from './geld';
import { einmalAnteil, jahresbetrag, MONATS_TEILER, ZAHLWEISE_TEXT } from './zahlweise';

describe('Zahlweise → Monat (÷1/3/6/12)', () => {
  it.each([
    ['monatlich', 1200, 1200],
    ['vierteljaehrlich', 3600, 1200],
    ['halbjaehrlich', 7200, 1200],
    ['jaehrlich', 14400, 1200],
  ] as const)('%s: %i Cent → %i Cent/Monat', (zw, betrag, monat) => {
    expect(rundeDivision(jahresbetrag(betrag, zw), 12)).toBe(monat);
    expect(rundeDivision(betrag, MONATS_TEILER[zw])).toBe(monat);
  });

  it('„einmalig“ zählt nie in den Jahres-/Monatsbetrag', () => {
    expect(jahresbetrag(500000, 'einmalig')).toBe(0);
    expect(einmalAnteil(500000, 'einmalig')).toBe(500000);
  });

  it('regelmäßige Zahlweisen haben keinen Einmalanteil', () => {
    for (const zw of ['monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich'] as const) {
      expect(einmalAnteil(1000, zw)).toBe(0);
    }
  });

  it('leerer Betrag zählt als 0', () => {
    expect(jahresbetrag(null, 'monatlich')).toBe(0);
    expect(einmalAnteil(null, 'einmalig')).toBe(0);
  });

  it('jahresbetrag ist exakt (keine Rundung)', () => {
    expect(jahresbetrag(8940, 'jaehrlich')).toBe(8940);
    expect(jahresbetrag(3250, 'monatlich')).toBe(39000);
    expect(jahresbetrag(48600, 'halbjaehrlich')).toBe(97200);
    expect(jahresbetrag(1001, 'vierteljaehrlich')).toBe(4004);
  });

  it('alle Zahlweisen haben einen deutschen Text', () => {
    for (const zw of ZAHLWEISEN) expect(ZAHLWEISE_TEXT[zw]).toBeTruthy();
    expect(ZAHLWEISE_TEXT.vierteljaehrlich).toBe('vierteljährlich');
  });
});

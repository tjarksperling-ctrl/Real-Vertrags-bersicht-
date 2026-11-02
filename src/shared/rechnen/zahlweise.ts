import type { Betrag, Cent, Zahlweise } from '../modell/typen';
import { wert } from './geld';

/** Zahlungen pro Jahr; „einmalig“ zählt nie in Monats-/Jahressummen. */
export const ZAHLUNGEN_PRO_JAHR: Record<Zahlweise, number> = {
  monatlich: 12,
  vierteljaehrlich: 4,
  halbjaehrlich: 2,
  jaehrlich: 1,
  einmalig: 0,
};

/** Teiler für den Monatsbetrag (÷1/3/6/12). */
export const MONATS_TEILER: Record<Exclude<Zahlweise, 'einmalig'>, number> = {
  monatlich: 1,
  vierteljaehrlich: 3,
  halbjaehrlich: 6,
  jaehrlich: 12,
};

export const ZAHLWEISE_TEXT: Record<Zahlweise, string> = {
  monatlich: 'monatlich',
  vierteljaehrlich: 'vierteljährlich',
  halbjaehrlich: 'halbjährlich',
  jaehrlich: 'jährlich',
  einmalig: 'einmalig',
};

/**
 * Exakter Jahresbetrag in Cent (ganze Zahl, ohne Rundung).
 * Monatsbetrag = Jahresbetrag / 12 – gerundet wird erst bei der Summe.
 */
export function jahresbetrag(betrag: Betrag, zahlweise: Zahlweise): Cent {
  return wert(betrag) * ZAHLUNGEN_PRO_JAHR[zahlweise];
}

/** Betrag, der als Einmalbetrag zählt (nur bei Zahlweise „einmalig“). */
export function einmalAnteil(betrag: Betrag, zahlweise: Zahlweise): Cent {
  return zahlweise === 'einmalig' ? wert(betrag) : 0;
}

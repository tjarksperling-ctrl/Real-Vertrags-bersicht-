import type { Betrag, Cent } from '../modell/typen';

/**
 * Ganzzahlige Division mit kaufmännischer Rundung (ab ,5 vom Nullpunkt weg).
 * Arbeitet nur mit ganzen Zahlen, daher ohne Gleitkomma-Fehler.
 */
export function rundeDivision(zaehler: number, nenner: number): number {
  if (!Number.isSafeInteger(zaehler) || !Number.isSafeInteger(nenner) || nenner === 0) {
    throw new RangeError(`Ungültige Division: ${zaehler} / ${nenner}`);
  }
  const vorzeichen = Math.sign(zaehler) * Math.sign(nenner);
  const z = Math.abs(zaehler);
  const n = Math.abs(nenner);
  const ergebnis = Math.floor((2 * z + n) / (2 * n));
  return vorzeichen * ergebnis || 0; // kein -0
}

/** Leeres Feld zählt als 0. */
export function wert(betrag: Betrag | undefined): Cent {
  return betrag ?? 0;
}

const MUSTER = /^([+-])?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;

/**
 * Liest eine Eingabe im deutschen Format in Cent.
 * Erlaubt: „1.234,56“, „1234,5“, „12“, „-3,20“, „1.234,56 €“, „€ 12“.
 * Leere Eingabe → `null`. Ungültige Eingabe → `undefined`.
 */
export function leseBetrag(eingabe: string): Betrag | undefined {
  const text = eingabe
    .replace(/€/g, '')
    .replace(/[\s  ]/g, '')
    .replace(/−/g, '-');
  if (text === '') return null;
  const treffer = MUSTER.exec(text);
  if (!treffer) return undefined;
  const [, vorzeichen, ganz = '0', nachkomma = ''] = treffer;
  const euro = Number(ganz.replace(/\./g, ''));
  const cent = Number(nachkomma.padEnd(2, '0'));
  const betrag = euro * 100 + cent;
  if (!Number.isSafeInteger(betrag)) return undefined;
  return vorzeichen === '-' ? -betrag || 0 : betrag;
}

export interface FormatOptionen {
  /** „+“ bei positiven Beträgen (z. B. Differenzen). */
  mitVorzeichen?: boolean;
  /** Euro-Zeichen anhängen (Standard: ja). */
  mitEuro?: boolean;
}

/** Formatiert Cent im deutschen Format: 123456 → „1.234,56 €“ (geschütztes Leerzeichen vor €). */
export function formatBetrag(cent: Cent, optionen: FormatOptionen = {}): string {
  const { mitVorzeichen = false, mitEuro = true } = optionen;
  if (!Number.isSafeInteger(cent)) throw new RangeError(`Kein Cent-Betrag: ${cent}`);
  const abs = Math.abs(cent);
  const euro = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const rest = (abs % 100).toString().padStart(2, '0');
  const vorzeichen = cent < 0 ? '−' : mitVorzeichen && cent > 0 ? '+' : '';
  return `${vorzeichen}${euro},${rest}${mitEuro ? ' €' : ''}`;
}

/** Spalten je Bereich – Namen und Breiten wie in den freigegebenen Mockups (Bild 2 v3, Bild 12 v4). */
import type { BereichTyp, Leistungsart, Zahlweise } from '../../../shared';
import type { VertragFeld } from '../../../shared';
import type { Option } from './felder';

export type SpaltenArt = 'name' | 'bem' | 'betrag' | 'zw' | 'rate' | 'leistung' | 'datum' | 'monat';

export interface Spalte {
  titel: string;
  breite: string;
  art: SpaltenArt;
  feld: VertragFeld;
  /** Leeres Feld als „–“ (optionale Beträge) statt „0,00 €“. */
  strich?: boolean;
  /** Spaltenkopf rechtsbündig. */
  num?: boolean;
}

const N = (breite: string): Spalte => ({ titel: 'Vertrag', breite, art: 'name', feld: 'name' });
const BEM: Spalte = { titel: 'Bemerkung', breite: '', art: 'bem', feld: 'bemerkung' };
const ZW = (breite: string): Spalte => ({ titel: 'Zahlweise', breite, art: 'zw', feld: 'zahlweise' });
const B = (titel: string, breite: string, feld: VertragFeld, strich = false): Spalte => ({ titel, breite, art: 'betrag', feld, strich, num: true });

export const SPALTEN: Record<BereichTyp, Spalte[]> = {
  VERS: [N('22%'), BEM, B('Beitrag', '13%', 'beitrag'), ZW('14%')],
  SPAR: [
    N('16%'),
    BEM,
    B('Sparrate', '10%', 'sparrate'),
    ZW('11%'),
    B('Einmalbetrag', '11%', 'einmalbetrag', true),
    B('Guthaben', '11%', 'guthaben', true),
    B('Wertentw.', '10%', 'wertentwicklung', true),
  ],
  DARL: [
    N('22%'),
    BEM,
    { titel: 'Rate/Tilgung', breite: '14%', art: 'rate', feld: 'rate', num: true },
    B('Restschuld', '14%', 'restschuld'),
    { titel: 'Zinsbindung', breite: '12%', art: 'monat', feld: 'zinsbindungBis' },
  ],
  AV: [
    N('17%'),
    BEM,
    B('Beitrag', '10%', 'beitrag', true),
    B('Einmalbeitrag', '11%', 'einmalbeitrag', true),
    ZW('10%'),
    { titel: 'Leistung/Guthaben', breite: '15%', art: 'leistung', feld: 'leistung.betrag', num: true },
    { titel: 'Laufzeit bis', breite: '12%', art: 'datum', feld: 'laufzeitBis', num: true },
  ],
};

/** Bezeichnung der Untergruppen-Summe (Bild 2): „Beitrag / Monat“ usw. */
export const UG_SUMME: Record<BereichTyp, string> = { VERS: 'Beitrag', SPAR: 'Sparrate', DARL: 'Rate', AV: 'Beitrag' };

export const ZAHLWEISE_OPTIONEN: Option<Zahlweise>[] = [
  { wert: 'monatlich', text: 'monatlich', kurz: 'mtl.' },
  { wert: 'vierteljaehrlich', text: 'vierteljährlich', kurz: 'vtl.' },
  { wert: 'halbjaehrlich', text: 'halbjährlich', kurz: 'halbj.' },
  { wert: 'jaehrlich', text: 'jährlich', kurz: 'jährl.' },
  { wert: 'einmalig', text: 'einmalig', kurz: 'einm.', hinweis: 'nicht in Monatssumme' },
];

export const LEISTUNG_OPTIONEN: Option<Leistungsart>[] = [
  { wert: 'RENTE_MTL', text: 'Rente mtl.' },
  { wert: 'KAPITAL', text: 'Kapital' },
  { wert: 'GUTHABEN', text: 'Guthaben' },
  { wert: 'TODESFALL', text: 'Todesfall' },
];

export const LEISTUNG_TEXT: Record<Leistungsart, string> = { RENTE_MTL: 'Rente mtl.', KAPITAL: 'Kapital', GUTHABEN: 'Guthaben', TODESFALL: 'Todesfall' };

/** Symbole zum Auswählen je Bereich (Bild 12 v4: eine Reihe mit 12 Symbolen). */
export const SYMBOLE: Record<BereichTyp, string[]> = {
  VERS: ['shield', 'home', 'car', 'bike', 'plane', 'paw', 'activity', 'tooth', 'umbrella', 'briefcase', 'heart', 'star'],
  SPAR: ['trend', 'coins', 'piggy', 'key', 'bank', 'building', 'baby', 'home', 'briefcase', 'heart', 'gift', 'star'],
  DARL: ['bank', 'home', 'building', 'cart', 'car', 'key', 'briefcase', 'coins', 'piggy', 'plane', 'gift', 'star'],
  AV: ['hourglass', 'heart', 'umbrella', 'shield', 'baby', 'activity', 'piggy', 'coins', 'trend', 'briefcase', 'user', 'star'],
};

/** Standardsymbol einer neuen Untergruppe. */
export const START_SYMBOL: Record<BereichTyp, string> = { VERS: 'shield', SPAR: 'trend', DARL: 'bank', AV: 'hourglass' };

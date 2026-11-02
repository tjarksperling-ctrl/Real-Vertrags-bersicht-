import type { BereichTyp, Vorlage, VorlageBereich } from './typen';

/** Bereichsnamen wie in App und PDF (Sitzung 7). */
export const BEREICH_NAME: Record<BereichTyp, string> = {
  VERS: 'Versicherungen',
  SPAR: 'Sparen & Investieren',
  DARL: 'Darlehen',
  AV: 'Altersvorsorge & Familienabsicherung',
};

const ug = (symbol: string, name: string, vorschlaege: string[] = []) => ({ name, symbol, vorschlaege });
const an = (...untergruppen: ReturnType<typeof ug>[]): VorlageBereich => ({ aktiv: true, untergruppen });
const aus = (...untergruppen: ReturnType<typeof ug>[]): VorlageBereich => ({ aktiv: false, untergruppen });

/** Agentur-Standard: 4 Bereiche · 9 Untergruppen (Bild 11). */
export const AGENTUR_STANDARD: Vorlage = {
  id: 'vorlage-agentur-standard',
  name: 'Agentur-Standard',
  symbol: 'star',
  standard: true,
  eigene: false,
  bereiche: {
    VERS: an(
      ug('shield', 'Haftpflicht & Recht', ['Privathaftpflicht', 'Rechtsschutz']),
      ug('home', 'Wohnen', ['Hausrat', 'Wohngebäude']),
      ug('car', 'Kfz', ['Kfz-Versicherung']),
    ),
    SPAR: an(ug('trend', 'Fonds & ETF', ['ETF-Sparplan']), ug('key', 'Bausparen', ['Bausparvertrag'])),
    DARL: an(ug('bank', 'Immobilie', ['Annuitätendarlehen']), ug('cart', 'Konsum', ['Autokredit'])),
    AV: an(
      ug('hourglass', 'Altersvorsorge', ['Private Rente', 'Basisrente']),
      ug('heart', 'Familienabsicherung', ['Risikolebensversicherung', 'Berufsunfähigkeit']),
    ),
  },
};

/** Junge Familie: 3 Bereiche · 8 Untergruppen (Bild 11, Darlehen abgewählt). */
export const JUNGE_FAMILIE: Vorlage = {
  id: 'vorlage-junge-familie',
  name: 'Junge Familie',
  symbol: 'baby',
  standard: false,
  eigene: false,
  bereiche: {
    VERS: an(
      ug('shield', 'Haftpflicht & Recht', ['Privathaftpflicht', 'Rechtsschutz']),
      ug('home', 'Wohnen', ['Hausrat', 'Wohngebäude']),
      ug('car', 'Kfz', ['Kfz-Versicherung']),
      ug('activity', 'Gesundheit', ['Zahnzusatz', 'Kinder-Krankenzusatz']),
    ),
    SPAR: an(ug('trend', 'Fonds & ETF', ['ETF-Sparplan']), ug('baby', 'Sparen für Kinder', ['Kinder-Depot', 'Juniorsparen'])),
    DARL: aus(ug('bank', 'Immobilie'), ug('cart', 'Konsum')),
    AV: an(
      ug('hourglass', 'Altersvorsorge', ['Private Rente']),
      ug('heart', 'Familienabsicherung', ['Risikoleben', 'Berufsunfähigkeit']),
    ),
  },
};

/** Mitgelieferte Agentur-Vorlagen. Weitere (Single, Selbstständige, Ruhestand) folgen mit dem Editor. */
export const AGENTUR_VORLAGEN: readonly Vorlage[] = [AGENTUR_STANDARD, JUNGE_FAMILIE];

import type { Cent, Fassung } from '../modell/typen';
import { fassungSumme } from './summen';

export type VergleichArt = 'ersparnis' | 'mehrbeitrag' | 'gleich';

export interface Vergleich {
  /** Neu − Aktuell je Monat (negativ = Ersparnis). */
  differenzMonat: Cent;
  /** Neu − Aktuell je Jahr = Monat × 12 (sichtbar stimmig). */
  differenzJahr: Cent;
  art: VergleichArt;
  /** Betrag ohne Vorzeichen, für „Ersparnis 12,34 €“ bzw. „Mehrbeitrag 12,34 €“. */
  betragMonat: Cent;
  betragJahr: Cent;
}

/** Vergleich zweier Gesamt/Monat-Beträge (Grundlage für „Vorteile der Änderungen“). */
export function vergleicheBetraege(aktuellMonat: Cent, neuMonat: Cent): Vergleich {
  const differenzMonat = neuMonat - aktuellMonat;
  const differenzJahr = differenzMonat * 12;
  const art: VergleichArt = differenzMonat < 0 ? 'ersparnis' : differenzMonat > 0 ? 'mehrbeitrag' : 'gleich';
  return {
    differenzMonat,
    differenzJahr,
    art,
    betragMonat: Math.abs(differenzMonat),
    betragJahr: Math.abs(differenzJahr),
  };
}

/** Vergleich „Aktuell“ ↔ „Neu“ über Gesamt/Monat der aktiven Bereiche. */
export function vergleicheFassungen(aktuell: Fassung, neu: Fassung): Vergleich {
  return vergleicheBetraege(fassungSumme(aktuell).gesamtMonat, fassungSumme(neu).gesamtMonat);
}

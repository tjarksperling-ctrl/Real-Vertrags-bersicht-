import { neueId } from '../modell/ids';
import type { Bereich, BereichTyp, Fassung, Uebersicht } from '../modell/typen';
import { BEREICH_TYPEN } from '../modell/typen';

/**
 * Tiefe Kopie einer Fassung mit neuen Ids. Jedes kopierte Element merkt sich
 * sein Ursprungselement in `quelleId` (Grundlage für den Sync Aktuell → Neu).
 */
export function kopiereFassung(quelle: Fassung): Fassung {
  const bereiche = {} as Fassung['bereiche'];
  for (const typ of BEREICH_TYPEN) {
    bereiche[typ] = kopiereBereich(quelle.bereiche[typ]) as never;
  }
  return { bereiche };
}

function kopiereBereich<T extends BereichTyp>(b: Bereich<T>): Bereich<T> {
  return {
    aktiv: b.aktiv,
    untergruppen: b.untergruppen.map((ug) => ({
      id: neueId(),
      quelleId: ug.id,
      name: ug.name,
      symbol: ug.symbol,
      vertraege: ug.vertraege.map((v) => ({ ...structuredClone(v), id: neueId(), quelleId: v.id })),
    })),
  };
}

/**
 * „Neu wieder wie Aktuell“ (Menü „…“, Festlegung Sitzung 23): überschreibt „Neu“
 * komplett mit einer frischen Kopie von „Aktuell“. Gibt eine neue Übersicht zurück
 * (die alte bleibt für Rückgängig erhalten).
 */
export function neuWieAktuell(uebersicht: Uebersicht, zeit: string = new Date().toISOString()): Uebersicht {
  return { ...uebersicht, neu: kopiereFassung(uebersicht.aktuell), geaendert: zeit };
}

import { neueId } from '../modell/ids';
import type { Bereich, BereichTyp, Fassung, Uebersicht } from '../modell/typen';
import { BEREICH_TYPEN } from '../modell/typen';

/**
 * Tiefe Kopie einer Fassung mit neuen Ids. Jedes kopierte Element merkt sich
 * sein Ursprungselement in `quelleId` (Grundlage für den Sync Aktuell → Neu).
 */
export function kopiereFassung(quelle: Fassung, mitQuelle = true): Fassung {
  const bereiche = {} as Fassung['bereiche'];
  for (const typ of BEREICH_TYPEN) {
    bereiche[typ] = kopiereBereich(quelle.bereiche[typ], mitQuelle) as never;
  }
  return { bereiche };
}

/** `mitQuelle = false`: unabhängige Kopie ohne `quelleId` (z. B. „Aus letzter Übersicht übernehmen“ in der Kundenakte). */
function kopiereBereich<T extends BereichTyp>(b: Bereich<T>, mitQuelle: boolean): Bereich<T> {
  const quelle = (id: string) => (mitQuelle ? { quelleId: id } : {});
  return {
    aktiv: b.aktiv,
    untergruppen: b.untergruppen.map((ug) => ({
      id: neueId(),
      ...quelle(ug.id),
      name: ug.name,
      symbol: ug.symbol,
      vertraege: ug.vertraege.map((v) => {
        const k = { ...structuredClone(v), id: neueId(), ...quelle(v.id) };
        if (!mitQuelle) delete k.quelleId;
        return k;
      }),
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

import type { Aufgabe, Datum, Kunde } from '../modell/typen';

/** Offene Aufgabe, deren Fälligkeitsdatum heute oder früher ist. */
export function istFaellig(aufgabe: Aufgabe, heute: Datum): boolean {
  return !aufgabe.erledigt && aufgabe.faellig !== null && aufgabe.faellig <= heute;
}

/** Datum (JJJJ-MM-TT) minus volle Jahre; 29.02. wird zum 28.02. */
export function jahreZurueck(heute: Datum, jahre: number): Datum {
  const [j, m, t] = heute.split('-').map(Number) as [number, number, number];
  const zielJahr = j - jahre;
  const letzterTag = new Date(Date.UTC(zielJahr, m, 0)).getUTCDate();
  const tag = Math.min(t, letzterTag);
  return `${String(zielJahr).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(tag).padStart(2, '0')}`;
}

/**
 * Kunden, die seit `jahre` Jahren (Standard 10) nicht geändert wurden –
 * nur als Vorschlag zum Löschen (Bild 16), gelöscht wird nie automatisch.
 */
export function alteKunden(kunden: readonly Kunde[], heute: Datum, jahre = 10): Kunde[] {
  const grenze = jahreZurueck(heute, jahre);
  return kunden.filter((k) => k.geaendert.slice(0, 10) <= grenze);
}

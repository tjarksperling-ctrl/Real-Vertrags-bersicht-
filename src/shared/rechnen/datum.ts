/** Datums-Eingaben in der Zeile: Laufzeit bis „TT.MM.JJJJ“ (gespeichert JJJJ-MM-TT), Zinsbindung „MM/JJJJ“ (JJJJ-MM). */
import type { Datum, Monat } from '../modell/typen';

function gueltigesDatum(j: number, m: number, t: number): boolean {
  const d = new Date(Date.UTC(j, m - 1, t));
  return d.getUTCFullYear() === j && d.getUTCMonth() === m - 1 && d.getUTCDate() === t;
}

const jahr4 = (j: string) => (j.length === 2 ? 2000 + Number(j) : Number(j));

/** „1.7.2052“, „01.07.52“, „2052-07-01“ → „2052-07-01“. Leer → null, ungültig → undefined. */
export function leseDatum(eingabe: string): Datum | null | undefined {
  const s = eingabe.trim();
  if (!s) return null;
  let j: number, m: number, t: number;
  let r = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/.exec(s);
  if (r) [t, m, j] = [Number(r[1]), Number(r[2]), jahr4(r[3]!)];
  else if ((r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s))) [j, m, t] = [Number(r[1]), Number(r[2]), Number(r[3])];
  else return undefined;
  if (!gueltigesDatum(j, m, t)) return undefined;
  return `${j}-${String(m).padStart(2, '0')}-${String(t).padStart(2, '0')}`;
}

export function formatDatum(d: Datum | null | undefined): string {
  if (!d) return '';
  const [j, m, t] = d.split('-');
  return `${t}.${m}.${j}`;
}

/** „6/2034“, „06.2034“, „06/34“, „2034-06“ → „2034-06“. Leer → null, ungültig → undefined. */
export function leseMonat(eingabe: string): Monat | null | undefined {
  const s = eingabe.trim();
  if (!s) return null;
  let j: number, m: number;
  let r = /^(\d{1,2})[/.](\d{2}|\d{4})$/.exec(s);
  if (r) [m, j] = [Number(r[1]), jahr4(r[2]!)];
  else if ((r = /^(\d{4})-(\d{2})$/.exec(s))) [j, m] = [Number(r[1]), Number(r[2])];
  else return undefined;
  if (m < 1 || m > 12) return undefined;
  return `${j}-${String(m).padStart(2, '0')}`;
}

export function formatMonat(m: Monat | null | undefined): string {
  if (!m) return '';
  const [j, mo] = m.split('-');
  return `${mo}/${j}`;
}

/** Datum für Kopfzeilen: „02.11.2026“. */
export function formatHeute(d: Date = new Date()): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

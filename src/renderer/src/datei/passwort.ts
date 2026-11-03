/** Passwort-Hilfen für Desktop-Dateien (Bild 10): Stärke und Vorschlag. Rein, testbar. */

export interface Staerke {
  /** 0–4 Balken. */
  stufe: number;
  text: 'zu kurz' | 'schwach' | 'mittel' | 'gut' | 'stark';
}

export const MIN_LAENGE = 8;

export function passwortStaerke(pw: string): Staerke {
  if (pw.length < MIN_LAENGE) return { stufe: pw.length ? 1 : 0, text: 'zu kurz' };
  const arten = [/[a-zäöüß]/, /[A-ZÄÖÜ]/, /\d/, /[^\p{L}\d]/u].filter((r) => r.test(pw)).length;
  const punkte = (pw.length >= 12 ? 2 : pw.length >= 10 ? 1 : 0) + arten;
  if (punkte >= 5) return { stufe: 4, text: 'stark' };
  if (punkte >= 4) return { stufe: 3, text: 'gut' };
  if (punkte >= 3) return { stufe: 2, text: 'mittel' };
  return { stufe: 1, text: 'schwach' };
}

const WOERTER = ['Ahorn', 'Birke', 'Delfin', 'Eule', 'Fluss', 'Garten', 'Hafen', 'Insel', 'Jaguar', 'Kompass', 'Leuchte', 'Mond', 'Nebel', 'Orbit', 'Palme', 'Quelle', 'Regen', 'Sonne', 'Tanne', 'Ufer', 'Vogel', 'Wolke', 'Zeder', 'Brise'];

/** Gut merkbar und stark: drei Wörter, Zahl, Zeichen – z. B. „Mond-Hafen-Eule-47“. */
export function passwortVorschlag(zufall: (n: number) => number = (n) => crypto.getRandomValues(new Uint32Array(1))[0]! % n): string {
  const w = Array.from({ length: 3 }, () => WOERTER[zufall(WOERTER.length)]!);
  return `${w.join('-')}-${10 + zufall(90)}`;
}

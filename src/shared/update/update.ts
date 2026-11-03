/**
 * Automatische Updates (M5c): Zustände und Texte, ohne Electron.
 * Der Hauptprozess (src/main/update.ts) meldet Ereignisse von electron-updater, diese Datei
 * macht daraus den Zustand für die Oberfläche (Seitenleiste + Einstellungen → Allgemein).
 * Regel (PLAN): automatisch im Hintergrund laden, Installation beim nächsten Start.
 */

export type UpdateZustand =
  /** Keine Updates möglich (Entwicklung, Test, keine Quelle eingetragen). */
  | { art: 'aus'; grund: string }
  | { art: 'bereit-zu-pruefen' }
  | { art: 'pruefe' }
  | { art: 'aktuell' }
  | { art: 'laedt'; version: string; prozent: number }
  /** Heruntergeladen, wird beim nächsten Start installiert. */
  | { art: 'bereit'; version: string }
  | { art: 'fehler'; meldung: string };

export interface UpdateStand {
  zustand: UpdateZustand;
  /** Installierte Version. */
  version: string;
  /** ISO-Zeitstempel der letzten abgeschlossenen Prüfung. */
  letztePruefung?: string;
}

/** Abstand zwischen zwei Prüfungen im Hintergrund. */
export const PRUEF_ABSTAND_MS = 4 * 60 * 60 * 1000;
/** Erste Prüfung kurz nach dem Start, damit der Start selbst nicht gebremst wird. */
export const ERSTE_PRUEFUNG_MS = 15 * 1000;

export type UpdateEreignis =
  | { art: 'pruefen' }
  | { art: 'verfuegbar'; version: string }
  | { art: 'nicht-verfuegbar' }
  | { art: 'fortschritt'; prozent: number }
  | { art: 'geladen'; version: string }
  | { art: 'fehler'; meldung: string };

/** Nächster Stand nach einem Ereignis von electron-updater. */
export function weiter(s: UpdateStand, e: UpdateEreignis, jetzt: string): UpdateStand {
  const z = s.zustand;
  if (z.art === 'aus') return s;
  // Ein fertig geladenes Update bleibt „bereit“, auch wenn eine spätere Prüfung scheitert oder nichts Neueres findet.
  if (z.art === 'bereit' && e.art !== 'geladen') return e.art === 'pruefen' ? s : { ...s, letztePruefung: jetzt };
  switch (e.art) {
    case 'pruefen':
      return { ...s, zustand: { art: 'pruefe' } };
    case 'verfuegbar':
      return { ...s, zustand: { art: 'laedt', version: e.version, prozent: 0 }, letztePruefung: jetzt };
    case 'nicht-verfuegbar':
      return { ...s, zustand: { art: 'aktuell' }, letztePruefung: jetzt };
    case 'fortschritt':
      return z.art === 'laedt' ? { ...s, zustand: { ...z, prozent: Math.max(0, Math.min(100, Math.round(e.prozent))) } } : s;
    case 'geladen':
      return { ...s, zustand: { art: 'bereit', version: e.version } };
    case 'fehler':
      return { ...s, zustand: { art: 'fehler', meldung: e.meldung }, letztePruefung: jetzt };
  }
}

/**
 * Fehler beim Prüfen sind meist „kein Netz“ – das soll niemanden stören.
 * Kurzer, verständlicher Text für Einstellungen → Allgemein.
 */
export function fehlerText(roh: string): string {
  const t = roh.toLowerCase();
  if (/enotfound|eai_again|econnrefused|etimedout|econnreset|net::err_|getaddrinfo|network/.test(t)) return 'Keine Verbindung zum Update-Server. Neuer Versuch später.';
  if (/\b404\b|latest\.yml|cannot find/.test(t)) return 'Noch keine Version veröffentlicht.';
  if (/sha512|checksum|signature|signiert/.test(t)) return 'Das Update war beschädigt und wurde verworfen. Neuer Versuch später.';
  return 'Prüfung fehlgeschlagen. Neuer Versuch später.';
}

/** Statuszeile in Einstellungen → Allgemein. */
export function statusText(s: UpdateStand): string {
  const z = s.zustand;
  switch (z.art) {
    case 'aus':
      return z.grund;
    case 'bereit-zu-pruefen':
      return 'Noch nicht geprüft.';
    case 'pruefe':
      return 'Suche nach Updates …';
    case 'aktuell':
      return 'Sie haben die neueste Version.';
    case 'laedt':
      return `Version ${z.version} wird geladen … ${z.prozent} %`;
    case 'bereit':
      return `Version ${z.version} ist bereit und wird beim nächsten Start installiert.`;
    case 'fehler':
      return z.meldung;
  }
}

/** „Zuletzt geprüft: heute, 14:05“ / „gestern, …“ / „02.11.2026, …“. */
export function pruefZeit(iso: string | undefined, jetzt: Date): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const zwei = (n: number) => String(n).padStart(2, '0');
  const uhr = `${zwei(d.getHours())}:${zwei(d.getMinutes())}`;
  const tag = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((tag(jetzt) - tag(d)) / 86400000);
  if (diff === 0) return `heute, ${uhr}`;
  if (diff === 1) return `gestern, ${uhr}`;
  return `${zwei(d.getDate())}.${zwei(d.getMonth() + 1)}.${d.getFullYear()}, ${uhr}`;
}

/** Hinweis unten in der Seitenleiste – nur wenn es etwas zu tun gibt. */
export function zeigeHinweis(z: UpdateZustand): boolean {
  return z.art === 'bereit';
}

/** Darf „Nach Updates suchen“ gedrückt werden? */
export function pruefenMoeglich(z: UpdateZustand): boolean {
  return z.art !== 'aus' && z.art !== 'pruefe' && z.art !== 'laedt';
}

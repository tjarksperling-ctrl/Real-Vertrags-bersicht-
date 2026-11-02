import type { Id } from './typen';

/** Neue, weltweit eindeutige Id (funktioniert in Node, Electron und Browser). */
export function neueId(): Id {
  return globalThis.crypto.randomUUID();
}

/** Aktueller Zeitstempel (ISO, UTC). */
export function jetzt(): string {
  return new Date().toISOString();
}

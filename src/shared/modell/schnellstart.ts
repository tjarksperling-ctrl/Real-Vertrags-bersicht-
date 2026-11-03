/** Schnellstart (Bild 1 v4, Bild 8): Agentur-Standard, Symbolvorschlag, Prüfung des Ziels. Rein, getestet. */
import type { SchnellstartLink } from './typen';
import { neueId } from './ids';

export const MAX_LINKS = 8;
export const LINK_SYMBOLE = ['globe', 'calc', 'bank', 'shield', 'car', 'home', 'file', 'chat', 'mail', 'calendar'] as const;
export const LINK_FARBEN = ['#0a64d0', '#4b53bc', '#d63a5a', '#5e5ce6', '#c77800', '#1f8a4c', '#1f7f95', '#6e6e73'] as const;

type Vorlage = Omit<SchnellstartLink, 'id'>;

/** Agentur-Standard: Microsoft-365-Dienste im Browser (funktioniert ohne Installation). */
export const AGENTUR_SCHNELLSTART: readonly Vorlage[] = [
  { name: 'Outlook', symbol: 'mail', farbe: '#0a64d0', ziel: 'https://outlook.office.com/mail/', beschreibung: 'Microsoft Outlook' },
  { name: 'Teams', symbol: 'chat', farbe: '#4b53bc', ziel: 'https://teams.microsoft.com/', beschreibung: 'Microsoft Teams' },
  { name: 'Kalender', symbol: 'calendar', farbe: '#d63a5a', ziel: 'https://outlook.office.com/calendar/', beschreibung: 'Outlook-Kalender' },
  { name: 'OneDrive', symbol: 'globe', farbe: '#1f7f95', ziel: 'https://www.office.com/onedrive', beschreibung: 'Dateien der Agentur' },
];

export function linksAus(v: readonly Vorlage[]): SchnellstartLink[] {
  return v.map((x) => ({ ...x, id: neueId() }));
}

const REGELN: [RegExp, string][] = [
  [/kfz|auto|car|fahrzeug/i, 'car'],
  [/bank|finanz|kredit|spark|volksbank/i, 'bank'],
  [/rechner|vergleich|calc|tarif/i, 'calc'],
  [/versicher|schutz|insurance/i, 'shield'],
  [/haus|immo|wohn|bau/i, 'home'],
  [/mail|outlook/i, 'mail'],
  [/kalender|calendar|termin/i, 'calendar'],
  [/teams|chat|slack/i, 'chat'],
  [/doc|pdf|akte|datei/i, 'file'],
];

/** Symbol passend zu Name/Adresse vorschlagen („Symbol wird vorgeschlagen“, Bild 8). */
export function symbolVorschlag(text: string, standard = 'globe'): string {
  for (const [r, s] of REGELN) if (r.test(text)) return s;
  return standard;
}

/** Webadresse (http/https/mailto) oder absoluter Programmpfad. */
export function zielGueltig(ziel: string): boolean {
  const z = ziel.trim();
  if (/^mailto:\S+@\S+$/i.test(z)) return true;
  if (/^https?:\/\//i.test(z)) {
    try {
      return !!new URL(z).hostname.includes('.');
    } catch {
      return false;
    }
  }
  return /^([a-zA-Z]:[\\/]|\\\\|\/)/.test(z);
}

/** „www.kfz-tarif.de“ → „https://www.kfz-tarif.de“. */
export function zielNormal(ziel: string): string {
  const z = ziel.trim();
  if (/^(www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(z) && !/^[a-z]+:/i.test(z)) return `https://${z}`;
  return z;
}

export function istWebseite(ziel: string): boolean {
  return /^(https?|mailto):/i.test(ziel);
}

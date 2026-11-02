/**
 * Bestand = Kundenliste + Verzeichnis der Übersichten, ebenfalls ein Yjs-Dokument
 * (damit später der OneDrive-Abgleich ohne Umbau funktioniert, M5).
 *   doc.getMap('kunden'):       id → Y.Map { id, name, erstellt, geaendert }
 *   doc.getMap('uebersichten'): id → Y.Map { id, kundeId, titel, erstellt, geaendert, gesamtAktuell, gesamtNeu }
 */
import * as Y from 'yjs';
import type { Cent, Kunde } from '../modell/typen';

export interface UebersichtInfo {
  id: string;
  kundeId: string;
  titel: string;
  erstellt: string;
  geaendert: string;
  gesamtAktuell: Cent;
  gesamtNeu: Cent;
}

export interface Bestand {
  kunden: Kunde[];
  uebersichten: UebersichtInfo[];
}

type YMap = Y.Map<unknown>;

const alsY = (o: object): YMap => {
  const m = new Y.Map<unknown>();
  for (const [k, w] of Object.entries(o)) if (w !== undefined) m.set(k, w);
  return m;
};

export function leseBestand(doc: Y.Doc): Bestand {
  const kunden = [...doc.getMap<YMap>('kunden').values()].map((m) => m.toJSON() as Kunde);
  const uebersichten = [...doc.getMap<YMap>('uebersichten').values()].map((m) => m.toJSON() as UebersichtInfo);
  kunden.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  uebersichten.sort((a, b) => b.geaendert.localeCompare(a.geaendert));
  return { kunden, uebersichten };
}

export function kundeEintragen(doc: Y.Doc, k: Kunde): void {
  doc.getMap<YMap>('kunden').set(k.id, alsY(k));
}

export function kundeUmbenennen(doc: Y.Doc, id: string, name: string, zeit: string): void {
  const m = doc.getMap<YMap>('kunden').get(id);
  if (!m) return;
  doc.transact(() => {
    m.set('name', name.trim());
    m.set('geaendert', zeit);
  });
}

export function uebersichtEintragen(doc: Y.Doc, info: UebersichtInfo): void {
  doc.getMap<YMap>('uebersichten').set(info.id, alsY(info));
}

/** Aktualisiert Titel/Summen/Zeit im Verzeichnis (nur geänderte Werte werden geschrieben). */
export function uebersichtAktualisieren(doc: Y.Doc, id: string, teil: Partial<Omit<UebersichtInfo, 'id'>>): void {
  const m = doc.getMap<YMap>('uebersichten').get(id);
  if (!m) return;
  doc.transact(() => {
    for (const [k, w] of Object.entries(teil)) if (w !== undefined && m.get(k) !== w) m.set(k, w);
  });
}

function normal(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');
}

/** Dublettenprüfung beim Anlegen (Bild 11): gleicher Name, Groß-/Kleinschreibung und Leerzeichen egal. */
export function findeDublette(kunden: readonly Kunde[], name: string): Kunde | undefined {
  const n = normal(name);
  return n ? kunden.find((k) => normal(k.name) === n) : undefined;
}

/** Kürzel für den Kreis: „Familie Berger“ → FB, „Jonas & Mira Albers“ → JA, „Elif Yılmaz“ → EY. */
export function initialen(name: string): string {
  const w = name.trim().split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t));
  if (w.length === 0) return '?';
  const erst = (t: string) => [...t][0]!.toLocaleUpperCase('de');
  return w.length === 1 ? erst(w[0]!) : erst(w[0]!) + erst(w[w.length - 1]!);
}

const FARBEN = ['a1', 'a2', 'a3', 'a4', 'a5', 'a0'] as const;

/** Feste Farbe je Kunde (aus der Id abgeleitet). */
export function avatarFarbe(id: string): (typeof FARBEN)[number] {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FARBEN[h % FARBEN.length]!;
}

/** Vorschlag für den Titel der ersten Übersicht (Bild 11: „aus Anlass und Jahr“). */
export function titelVorschlag(datum: Date = new Date(), anlass = 'Erstberatung'): string {
  return `${anlass} ${datum.getFullYear()}`;
}

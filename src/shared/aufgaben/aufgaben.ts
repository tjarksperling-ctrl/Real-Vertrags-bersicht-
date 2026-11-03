/**
 * Aufgaben (Bild 9, Bild 1 v4, Bild 1b): Gruppen nach Fälligkeit, Texte, Kurzform fürs Verzeichnis.
 * Rein, ohne Electron/React. Datum immer JJJJ-MM-TT in Ortszeit.
 */
import type { Aufgabe, BereichTyp, Datum, Prioritaet, Uebersicht } from '../modell/typen';
import { BEREICH_TYPEN } from '../modell/typen';

const zwei = (n: number) => String(n).padStart(2, '0');

/** Datum als JJJJ-MM-TT (Ortszeit). */
export function alsDatum(d: Date): Datum {
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
}

export function heuteDatum(jetzt: Date = new Date()): Datum {
  return alsDatum(jetzt);
}

function alsDate(d: Datum): Date {
  const [j, m, t] = d.split('-').map(Number) as [number, number, number];
  return new Date(j, m - 1, t, 12);
}

export function plusTage(d: Datum, tage: number): Datum {
  const x = alsDate(d);
  x.setDate(x.getDate() + tage);
  return alsDatum(x);
}

/** Tage von `a` bis `b` (positiv, wenn b später). */
export function tageZwischen(a: Datum, b: Datum): number {
  return Math.round((alsDate(b).getTime() - alsDate(a).getTime()) / 86400000);
}

/** Letzter Tag (Sonntag) der Woche von `heute`. */
export function wochenEnde(heute: Datum): Datum {
  const tag = alsDate(heute).getDay(); // 0 = Sonntag
  return plusTage(heute, tag === 0 ? 0 : 7 - tag);
}

export type AufgabenGruppe = 'ueberfaellig' | 'heute' | 'woche' | 'spaeter';

export const GRUPPEN_TITEL: Record<AufgabenGruppe, string> = {
  ueberfaellig: 'Überfällig',
  heute: 'Heute',
  woche: 'Diese Woche',
  spaeter: 'Später',
};

export function gruppeVon(faellig: Datum | null, heute: Datum): AufgabenGruppe {
  if (!faellig) return 'spaeter';
  if (faellig < heute) return 'ueberfaellig';
  if (faellig === heute) return 'heute';
  if (faellig <= wochenEnde(heute)) return 'woche';
  return 'spaeter';
}

interface MitFaellig {
  faellig: Datum | null;
  prioritaet?: Prioritaet | undefined;
  text: string;
}

/** Sortierung: Datum aufsteigend (ohne Datum zuletzt), dann „Hoch“ zuerst, dann Text. */
export function vergleicheAufgaben(a: MitFaellig, b: MitFaellig): number {
  if (a.faellig !== b.faellig) {
    if (!a.faellig) return 1;
    if (!b.faellig) return -1;
    return a.faellig < b.faellig ? -1 : 1;
  }
  const pa = a.prioritaet === 'hoch' ? 0 : 1;
  const pb = b.prioritaet === 'hoch' ? 0 : 1;
  return pa - pb || a.text.localeCompare(b.text, 'de');
}

/** Offene Aufgaben gruppiert (leere Gruppen fehlen), Reihenfolge Überfällig → Später. */
export function gruppiere<T extends MitFaellig>(liste: readonly T[], heute: Datum): { gruppe: AufgabenGruppe; aufgaben: T[] }[] {
  const reihe: AufgabenGruppe[] = ['ueberfaellig', 'heute', 'woche', 'spaeter'];
  const map = new Map<AufgabenGruppe, T[]>();
  for (const a of [...liste].sort(vergleicheAufgaben)) {
    const g = gruppeVon(a.faellig, heute);
    map.set(g, [...(map.get(g) ?? []), a]);
  }
  return reihe.filter((g) => map.has(g)).map((g) => ({ gruppe: g, aufgaben: map.get(g)! }));
}

const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** „seit 2 Tagen“, „seit gestern“, „heute“, „morgen“, „Do, 05.11.“, „01.03.2027“. */
export function faelligText(faellig: Datum | null, heute: Datum): string {
  if (!faellig) return '';
  const diff = tageZwischen(heute, faellig);
  if (diff < -1) return `seit ${-diff} Tagen`;
  if (diff === -1) return 'seit gestern';
  if (diff === 0) return 'heute';
  if (diff === 1) return 'morgen';
  const d = alsDate(faellig);
  if (d.getFullYear() !== alsDate(heute).getFullYear()) return `${zwei(d.getDate())}.${zwei(d.getMonth() + 1)}.${d.getFullYear()}`;
  return `${WOCHENTAG[d.getDay()]}, ${zwei(d.getDate())}.${zwei(d.getMonth() + 1)}.`;
}

/** Klasse für die Farbe des Fälligkeitstexts (rot/orange/neutral). */
export function faelligKlasse(faellig: Datum | null, heute: Datum): '' | 'over' | 'today' {
  if (!faellig) return '';
  return faellig < heute ? 'over' : faellig === heute ? 'today' : '';
}

/** Kurzform einer Aufgabe im Verzeichnis (Bestand) – für Startseite, Seitenleiste und Kundenakte ohne alle Übersichten zu laden. */
export interface AufgabeKurz {
  id: string;
  text: string;
  faellig: Datum | null;
  erledigt: boolean;
  prioritaet?: Prioritaet;
  zustaendig?: string;
  /** Name des Vertrags/der Untergruppe, auf den sich die Aufgabe bezieht. */
  bezugName?: string;
}

/** Name eines Vertrags oder einer Untergruppe (Aktuell zuerst, dann Neu) samt Bereich. */
export function bezugFinden(u: Uebersicht, id: string): { name: string; typ: BereichTyp; vertrag: boolean } | null {
  for (const f of ['aktuell', 'neu'] as const)
    for (const typ of BEREICH_TYPEN)
      for (const ug of u[f].bereiche[typ].untergruppen) {
        if (ug.id === id) return { name: ug.name, typ, vertrag: false };
        for (const v of ug.vertraege) if (v.id === id) return { name: v.name || 'Vertrag', typ, vertrag: true };
      }
  return null;
}

export function aufgabenKurz(u: Uebersicht): AufgabeKurz[] {
  return u.aufgaben.map((a) => {
    const k: AufgabeKurz = { id: a.id, text: a.text, faellig: a.faellig, erledigt: a.erledigt };
    if (a.prioritaet) k.prioritaet = a.prioritaet;
    if (a.zustaendig) k.zustaendig = a.zustaendig;
    const b = a.bezug ? bezugFinden(u, a.bezug) : null;
    if (b) k.bezugName = b.name;
    return k;
  });
}

/** Zahl offener Aufgaben je Vertrag (Marke am Vertrag, Bild 9) und ob eine davon überfällig ist. */
export function aufgabenJeVertrag(aufgaben: readonly Aufgabe[], heute: Datum): Map<string, { n: number; ueberfaellig: boolean; texte: string[] }> {
  const m = new Map<string, { n: number; ueberfaellig: boolean; texte: string[] }>();
  for (const a of aufgaben) {
    if (a.erledigt || !a.bezug) continue;
    const x = m.get(a.bezug) ?? { n: 0, ueberfaellig: false, texte: [] };
    x.n++;
    x.texte.push(a.text);
    if (a.faellig !== null && a.faellig < heute) x.ueberfaellig = true;
    m.set(a.bezug, x);
  }
  return m;
}

/** „Heute“, „Morgen“, „In 1 Woche“ (Bild 9). */
export function schnellDatum(art: 'heute' | 'morgen' | 'woche', heute: Datum): Datum {
  return art === 'heute' ? heute : plusTage(heute, art === 'morgen' ? 1 : 7);
}

/** Zählt für die Seitenleiste: offene Aufgaben, die heute fällig oder überfällig sind. */
export function zaehleFaellige(liste: readonly { erledigt: boolean; faellig: Datum | null }[], heute: Datum): number {
  return liste.filter((a) => !a.erledigt && a.faellig !== null && a.faellig <= heute).length;
}

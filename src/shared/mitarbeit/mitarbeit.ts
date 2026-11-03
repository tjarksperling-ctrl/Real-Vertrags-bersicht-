/**
 * Gemeinsam bearbeiten (Bild 15, M5b): reine Logik ohne Electron/React.
 * - Änderungen anderer werden mit dem Ursprung `FERN` eingespielt: nicht rückgängig zu machen,
 *   nicht erneut gespeichert, nicht als eigene Bearbeitung protokolliert.
 * - Welche Verträge/Felder hat jemand geändert („geändert von Sabine K. · gerade eben“)?
 * - Wer ist gerade in derselben Übersicht?
 */
import { BEREICH_TYPEN, type Fassung, type Id, type Uebersicht, type Vertrag } from '../modell/typen';
import type { FassungName } from '../editor/dokument';

/** Ursprung für eingespielte Änderungen anderer Personen. */
export const FERN = 'fern';

/** So lange gilt jemand als „gerade drin“ (OneDrive braucht oft 10–60 s). */
export const ANWESEND_MS = 120_000;
/** So lange bleibt „geändert von …“ sichtbar. */
export const MARKE_MS = 10 * 60_000;

export interface FremdMarke {
  von: string;
  /** Person-ID (für die Farbe des Kürzels). */
  vonId?: string;
  /** ms seit 1970. */
  zeit: number;
  fassung: FassungName;
  felder: string[];
}

function vertraegeJe(f: Fassung): Map<Id, Vertrag> {
  const m = new Map<Id, Vertrag>();
  for (const t of BEREICH_TYPEN) for (const ug of f.bereiche[t].untergruppen) for (const v of ug.vertraege) m.set(v.id, v);
  return m;
}

/** Felder, die sich zwischen zwei Ständen eines Vertrags unterscheiden (neu = alle Felder mit Inhalt). */
export function geaenderteFelder(alt: Vertrag | undefined, neu: Vertrag): string[] {
  const felder: string[] = [];
  for (const [k, w] of Object.entries(neu)) {
    if (k === 'id' || k === 'quelleId') continue;
    const a = alt ? (alt as unknown as Record<string, unknown>)[k] : undefined;
    if (JSON.stringify(a) !== JSON.stringify(w)) {
      if (!alt && (w === null || w === '' || (typeof w === 'object' && w && Object.values(w).every((x) => x === null)))) continue;
      felder.push(k);
    }
  }
  return felder;
}

/** Verträge, die sich durch eine fremde Änderung geändert haben (je Fassung), mit den Feldern. */
export function fremdeMarken(vorher: Uebersicht, nachher: Uebersicht, von: string, zeit: number, vonId?: string): Map<Id, FremdMarke> {
  const r = new Map<Id, FremdMarke>();
  for (const fassung of ['aktuell', 'neu'] as const) {
    const a = vertraegeJe(vorher[fassung]);
    for (const [id, v] of vertraegeJe(nachher[fassung])) {
      const felder = geaenderteFelder(a.get(id), v);
      if (felder.length || !a.has(id)) r.set(id, { von, zeit, fassung, felder, ...(vonId ? { vonId } : {}) });
    }
  }
  return r;
}

/** „gerade eben“, „vor 3 Min.“, „vor 1 Std.“ */
export function vorWann(zeit: number, jetzt: number): string {
  const s = Math.max(0, Math.round((jetzt - zeit) / 1000));
  if (s < 60) return 'gerade eben';
  const m = Math.floor(s / 60);
  if (m < 60) return `vor ${m} Min.`;
  return `vor ${Math.floor(m / 60)} Std.`;
}

interface Anwesend {
  id: string;
  name: string;
  zeit: string;
  uebersichtId?: string;
}
/** Andere Personen, die gerade in dieser Übersicht arbeiten. */
export function anwesendIn<T extends Anwesend>(personen: T[], ichId: string, uebersichtId: string, jetzt: number): T[] {
  return personen.filter((p) => p.id !== ichId && p.uebersichtId === uebersichtId && jetzt - Date.parse(p.zeit) < ANWESEND_MS);
}

/** Andere Personen, die gerade irgendwo in der App sind (Startseite: „Sabine K. ist gerade drin“). */
export function anwesendUeberall<T extends Anwesend>(personen: T[], ichId: string, jetzt: number): T[] {
  return personen.filter((p) => p.id !== ichId && jetzt - Date.parse(p.zeit) < ANWESEND_MS);
}

/** „seit 10:38“ */
export function uhrzeit(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Wo liegt ein Vertrag? „Wohnen › Wohngebäude“ + Fassung (für „Hinspringen“). */
export function vertragOrt(u: Uebersicht, vertragId: string): { text: string; fassung: FassungName } | null {
  for (const fassung of ['aktuell', 'neu'] as const)
    for (const t of BEREICH_TYPEN)
      for (const ug of u[fassung].bereiche[t].untergruppen)
        for (const v of ug.vertraege) if (v.id === vertragId) return { text: `${ug.name || 'Untergruppe'} › ${v.name || 'Vertrag'}`, fassung };
  return null;
}

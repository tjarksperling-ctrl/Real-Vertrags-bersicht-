/**
 * Autovervollständigung beim Tippen im Feld „Vertrag“ (Bild 11 v1):
 * Vorschläge aus den Vorlagen und allen Kunden der Agentur, mit Untergruppe,
 * üblicher Zahlweise und Häufigkeit.
 */
import type { BereichTyp, Uebersicht, Vorlage, Zahlweise } from '../modell/typen';

export interface Vorschlag {
  name: string;
  /** Untergruppe, zu der der Vertrag meist gehört. */
  ugName: string;
  /** Häufigste Zahlweise (fehlt, wenn nur aus Vorlagen bekannt). */
  zahlweise?: Zahlweise;
  /** Wie oft der Name vorkommt. */
  anzahl: number;
}

interface Eintrag {
  name: string;
  anzahl: number;
  ug: Map<string, number>;
  zw: Map<Zahlweise, number>;
}

export type Katalog = Record<BereichTyp, Map<string, Eintrag>>;

function zaehle<K>(m: Map<K, number>, k: K, n = 1): void {
  m.set(k, (m.get(k) ?? 0) + n);
}

function haeufigster<K>(m: Map<K, number>): K | undefined {
  let best: K | undefined;
  let max = -1;
  for (const [k, n] of m) if (n > max) [best, max] = [k, n];
  return best;
}

/** Baut den Katalog aus Vorlagen und Übersichten (es zählt jeweils „Aktuell“). */
export function baueKatalog(vorlagen: readonly Vorlage[], uebersichten: readonly Uebersicht[]): Katalog {
  const k: Katalog = { VERS: new Map(), SPAR: new Map(), DARL: new Map(), AV: new Map() };
  const eintrag = (typ: BereichTyp, name: string): Eintrag | null => {
    const n = name.trim();
    if (!n) return null;
    const key = n.toLocaleLowerCase('de');
    let e = k[typ].get(key);
    if (!e) {
      e = { name: n, anzahl: 0, ug: new Map(), zw: new Map() };
      k[typ].set(key, e);
    }
    return e;
  };
  for (const vl of vorlagen) {
    for (const typ of Object.keys(vl.bereiche) as BereichTyp[]) {
      for (const ug of vl.bereiche[typ].untergruppen) {
        for (const name of ug.vorschlaege) {
          const e = eintrag(typ, name);
          if (e) zaehle(e.ug, ug.name, 0.5);
        }
      }
    }
  }
  for (const u of uebersichten) {
    for (const typ of Object.keys(u.aktuell.bereiche) as BereichTyp[]) {
      for (const ug of u.aktuell.bereiche[typ].untergruppen) {
        for (const v of ug.vertraege) {
          const e = eintrag(typ, v.name);
          if (!e) continue;
          e.anzahl++;
          zaehle(e.ug, ug.name);
          zaehle(e.zw, v.zahlweise);
        }
      }
    }
  }
  return k;
}

/**
 * Passende Vorschläge zur Eingabe: zuerst Namen, die mit der Eingabe beginnen,
 * dann Namen mit einem Wort, das so beginnt; jeweils nach Häufigkeit.
 */
export function vorschlaege(katalog: Katalog, typ: BereichTyp, eingabe: string, max = 3): Vorschlag[] {
  const q = eingabe.trim().toLocaleLowerCase('de');
  if (q.length < 2) return [];
  const treffer: { e: Eintrag; rang: number }[] = [];
  for (const [key, e] of katalog[typ]) {
    if (key === q) continue;
    if (key.startsWith(q)) treffer.push({ e, rang: 0 });
    else if (key.split(/[\s\-/&]+/).some((w) => w.startsWith(q))) treffer.push({ e, rang: 1 });
  }
  treffer.sort((a, b) => a.rang - b.rang || b.e.anzahl - a.e.anzahl || a.e.name.localeCompare(b.e.name, 'de'));
  return treffer.slice(0, max).map(({ e }) => {
    const v: Vorschlag = { name: e.name, ugName: haeufigster(e.ug) ?? '', anzahl: e.anzahl };
    const zw = haeufigster(e.zw);
    if (zw) v.zahlweise = zw;
    return v;
  });
}

/**
 * KI-Import (Bild 6, M5b): Auftrag an die KI, Antwort lesen und prüfen, Übernahme nach „Aktuell“.
 * Reine Logik ohne Electron/React – anbieterunabhängig (zuerst Microsoft 365 Copilot).
 * Datenschutz: Der Auftrag enthält nie den Kundennamen; die KI soll Namen von Personen nicht zurückgeben.
 */
import { BEREICH_TYPEN, LEISTUNGSARTEN, ZAHLWEISEN, type BereichTyp, type Fassung, type Leistungsart, type Zahlweise } from '../modell/typen';
import { leseBetrag } from '../rechnen/geld';
import type { Editor, FeldWert, VertragFeld } from '../editor/befehle';

/** Ein erkannter Vertrag im Prüf-Dialog. Beträge in Cent. */
export interface KiVertrag {
  /** Laufende Nummer im Dialog. */
  nr: number;
  bereich: BereichTyp;
  /** Vorschlag der KI für die Untergruppe (z. B. „Wohnen“). */
  untergruppe: string;
  name: string;
  bemerkung: string;
  /** Hauptbetrag: Beitrag (VERS/AV), Sparrate (SPAR), Rate (DARL). */
  betrag: number | null;
  zahlweise: Zahlweise;
  einmalbetrag: number | null;
  guthaben: number | null;
  restschuld: number | null;
  /** JJJJ-MM */
  zinsbindungBis: string | null;
  leistung: { betrag: number | null; art: Leistungsart };
  /** JJJJ-MM-TT */
  laufzeitBis: string | null;
  /** Felder, bei denen die KI unsicher ist. */
  unsicher: string[];
  hinweis: string | null;
  /** Vorauswahl (z. B. aus bei „vermutlich gekündigt“). */
  auswahl: boolean;
  /** Aus welcher Unterlage. */
  quelle?: string;
}

export const KI_BEREICH_TEXT: Record<BereichTyp, string> = {
  VERS: 'Versicherungen (Haftpflicht, Hausrat, Wohngebäude, Kfz, Rechtsschutz, Unfall, Kranken-Zusatz …)',
  SPAR: 'Sparen & Investieren (Bausparen, Fonds, Sparpläne, Tagesgeld …)',
  DARL: 'Darlehen (Baufinanzierung, Kredite)',
  AV: 'Altersvorsorge & Familienabsicherung (Rente, BU, Risikoleben, Pflege …)',
};

/** Auftrag an die KI. Enthält keine Kundendaten – nur Aufgabe und Antwortformat. */
export function kiAuftrag(): string {
  return [
    'Du liest Versicherungs- und Finanzunterlagen für eine Versicherungsagentur aus (Police, Beitragsrechnung, Nachtrag, Kontoauszug, Scan).',
    'Lies die angehängte Datei vollständig und liste jeden darin genannten Vertrag auf. Nutze ausschließlich die angehängte Datei, keine anderen Quellen.',
    'Gib KEINE Namen, Anschriften, Geburtsdaten, Vertrags- oder Kontonummern von Personen zurück.',
    '',
    'Antworte NUR mit JSON in genau diesem Format, ohne weiteren Text:',
    '{"vertraege":[{',
    '  "bereich": "VERS" | "SPAR" | "DARL" | "AV",',
    '  "untergruppe": "kurzer Oberbegriff, z. B. Wohnen, Kfz, Haftpflicht & Recht, Familienabsicherung, Rente, Bausparen, Immobilie",',
    '  "name": "Vertragsart, z. B. Wohngebäude, Hausrat, VW Golf, Berufsunfähigkeit",',
    '  "bemerkung": "wichtigste Merkmale in wenigen Worten, z. B. Deckung, Selbstbeteiligung, Tarif",',
    '  "betrag": Beitrag bzw. Sparrate bzw. Darlehensrate in Euro als Zahl (z. B. 612.00) oder null,',
    '  "zahlweise": "monatlich" | "vierteljaehrlich" | "halbjaehrlich" | "jaehrlich" | "einmalig",',
    '  "einmalbetrag": Euro oder null, "guthaben": Euro oder null, "restschuld": Euro oder null,',
    '  "zinsbindungBis": "JJJJ-MM" oder null, "laufzeitBis": "JJJJ-MM-TT" oder null,',
    '  "leistung": {"betrag": Euro oder null, "art": "RENTE_MTL" | "KAPITAL" | "GUTHABEN" | "TODESFALL"} oder null,',
    '  "unsicher": ["betrag", "zahlweise", …] Felder, die schlecht lesbar oder nicht eindeutig sind,',
    '  "hinweis": "kurzer Hinweis für die Prüfung, z. B. Zahlweise unklar" oder null,',
    '  "gekuendigt": true wenn der Vertrag gekündigt oder beendet scheint',
    '}]}',
    '',
    'Bereiche: ' + BEREICH_TYPEN.map((t) => `${t} = ${KI_BEREICH_TEXT[t]}`).join('; ') + '.',
    'Der Betrag ist immer der Betrag je Zahlweise (bei jährlicher Zahlung der Jahresbeitrag). Steuern sind im Beitrag enthalten.',
  ].join('\n');
}

export class KiAntwortFehler extends Error {}

/** JSON aus einer Textantwort holen (auch mit ```json-Zaun oder Text drumherum). */
export function jsonAusText(text: string): unknown {
  const zaun = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const roh = zaun ? zaun[1]! : text;
  const a = roh.indexOf('{');
  const b = roh.lastIndexOf('}');
  if (a < 0 || b <= a) throw new KiAntwortFehler('Die KI hat keine auswertbare Antwort geliefert.');
  try {
    return JSON.parse(roh.slice(a, b + 1));
  } catch {
    throw new KiAntwortFehler('Die Antwort der KI war unvollständig. Bitte erneut versuchen.');
  }
}

/** Euro (Zahl oder Text wie „612,00 €“) → Cent. */
export function euroZuCent(w: unknown): number | null {
  if (w === null || w === undefined || w === '') return null;
  if (typeof w === 'number') return Number.isFinite(w) ? Math.round(w * 100) : null;
  if (typeof w === 'string') {
    const t = w.replace(/[€\s]|EUR/gi, '');
    // „612.00“ (Punkt als Dezimaltrenner, wie im JSON-Auftrag) zuerst
    if (/^-?\d+\.\d{1,2}$/.test(t)) return Math.round(Number(t) * 100);
    const c = leseBetrag(t);
    return c ?? null;
  }
  return null;
}

const ZW_SYNONYME: [RegExp, Zahlweise][] = [
  [/^monat|mtl|^12/i, 'monatlich'],
  [/viertel|quartal|^4/i, 'vierteljaehrlich'],
  [/halb|^2/i, 'halbjaehrlich'],
  [/^j(ä|ae|a)hr|^1$|p\.?\s?a/i, 'jaehrlich'],
  [/einmal/i, 'einmalig'],
];
export function zahlweiseLesen(w: unknown): Zahlweise | null {
  if (typeof w !== 'string') return null;
  const t = w.trim().toLowerCase().replace('ä', 'ae');
  if ((ZAHLWEISEN as readonly string[]).includes(t)) return t as Zahlweise;
  for (const [re, z] of ZW_SYNONYME) if (re.test(w.trim())) return z;
  return null;
}

const text = (w: unknown, max = 200) => (typeof w === 'string' ? w.trim().slice(0, max) : '');
const monat = (w: unknown) => (typeof w === 'string' && /^\d{4}-\d{2}/.test(w) ? w.slice(0, 7) : null);
const tag = (w: unknown) => (typeof w === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w) ? w : null);

/** Antwort der KI lesen und prüfen. Unbrauchbare Einträge werden ausgelassen. */
export function kiAntwortLesen(antwort: string, quelle?: string, start = 1): KiVertrag[] {
  const j = jsonAusText(antwort) as { vertraege?: unknown };
  const liste = Array.isArray(j?.vertraege) ? j.vertraege : Array.isArray(j) ? (j as unknown[]) : null;
  if (!liste) throw new KiAntwortFehler('Die KI hat keine Verträge gefunden.');
  const r: KiVertrag[] = [];
  for (const e of liste as Record<string, unknown>[]) {
    if (!e || typeof e !== 'object') continue;
    const bereich = (BEREICH_TYPEN as readonly string[]).includes(String(e['bereich']).toUpperCase()) ? (String(e['bereich']).toUpperCase() as BereichTyp) : null;
    const name = text(e['name'], 80);
    if (!bereich || !name) continue;
    const unsicher = Array.isArray(e['unsicher']) ? (e['unsicher'] as unknown[]).filter((x): x is string => typeof x === 'string') : [];
    const zw = zahlweiseLesen(e['zahlweise']);
    if (!zw && e['zahlweise'] && !unsicher.includes('zahlweise')) unsicher.push('zahlweise');
    const l = (e['leistung'] ?? {}) as Record<string, unknown>;
    const art = (LEISTUNGSARTEN as readonly string[]).includes(String(l['art'])) ? (l['art'] as Leistungsart) : 'RENTE_MTL';
    const gekuendigt = e['gekuendigt'] === true;
    const hinweis = text(e['hinweis'], 160) || (gekuendigt ? 'Vermutlich bereits gekündigt – daher nicht ausgewählt.' : '');
    r.push({
      nr: start + r.length,
      bereich,
      untergruppe: text(e['untergruppe'], 60),
      name,
      bemerkung: text(e['bemerkung'], 300),
      betrag: euroZuCent(e['betrag']),
      zahlweise: zw ?? (bereich === 'DARL' || bereich === 'SPAR' ? 'monatlich' : 'jaehrlich'),
      einmalbetrag: euroZuCent(e['einmalbetrag']),
      guthaben: euroZuCent(e['guthaben']),
      restschuld: euroZuCent(e['restschuld']),
      zinsbindungBis: monat(e['zinsbindungBis']),
      leistung: { betrag: euroZuCent(l['betrag']), art },
      laufzeitBis: tag(e['laufzeitBis']),
      unsicher,
      hinweis: hinweis || null,
      auswahl: !gekuendigt,
      ...(quelle ? { quelle } : {}),
    });
  }
  return r;
}

const norm = (s: string) => s.toLocaleLowerCase('de').replace(/[^a-zäöüß0-9]+/g, '');

/** Ziel-Untergruppe: vorhandene mit passendem Namen (auch Teilwort), sonst „neu“. */
export function untergruppeFinden(f: Fassung, v: Pick<KiVertrag, 'bereich' | 'untergruppe' | 'name'>): { id: string; name: string } | null {
  const ugs = f.bereiche[v.bereich].untergruppen;
  const ziel = norm(v.untergruppe);
  if (ziel) {
    const genau = ugs.find((u) => norm(u.name) === ziel);
    if (genau) return { id: genau.id, name: genau.name };
    const teil = ugs.find((u) => norm(u.name) && (norm(u.name).includes(ziel) || ziel.includes(norm(u.name))));
    if (teil) return { id: teil.id, name: teil.name };
  }
  // gleicher Vertragsname schon in einer Untergruppe → dorthin
  const n = norm(v.name);
  const mitVertrag = ugs.find((u) => u.vertraege.some((x) => norm(x.name) === n));
  return mitVertrag ? { id: mitVertrag.id, name: mitVertrag.name } : null;
}

/** Gibt es den Vertrag (gleicher Name im selben Bereich) schon in der Fassung? Dann nicht vorauswählen. */
export function schonVorhanden(f: Fassung, v: KiVertrag): KiVertrag {
  const n = norm(v.name);
  const da = f.bereiche[v.bereich].untergruppen.find((u) => u.vertraege.some((x) => norm(x.name) === n));
  if (!da || !n) return v;
  return { ...v, auswahl: false, hinweis: `Gibt es schon in „Aktuell“ (${da.name}) – daher nicht ausgewählt.` };
}

/** Werte eines erkannten Vertrags als Felder des Editors (je Bereich). */
export function kiFelder(v: KiVertrag): Partial<Record<VertragFeld, FeldWert>> {
  const f: Partial<Record<VertragFeld, FeldWert>> = { name: v.name, bemerkung: v.bemerkung, zahlweise: v.zahlweise };
  if (v.bereich === 'VERS') f.beitrag = v.betrag;
  if (v.bereich === 'SPAR') Object.assign(f, { sparrate: v.betrag, einmalbetrag: v.einmalbetrag, guthaben: v.guthaben });
  if (v.bereich === 'DARL') Object.assign(f, { rate: v.betrag, restschuld: v.restschuld, zinsbindungBis: v.zinsbindungBis });
  if (v.bereich === 'AV') Object.assign(f, { beitrag: v.betrag, einmalbeitrag: v.einmalbetrag, laufzeitBis: v.laufzeitBis, 'leistung.betrag': v.leistung.betrag, 'leistung.art': v.leistung.art });
  for (const k of Object.keys(f) as VertragFeld[]) if (f[k] === null && k !== 'zahlweise') delete f[k];
  return f;
}

/** Symbol für neue Untergruppen nach Stichwort. */
export function ugSymbol(name: string, bereich: BereichTyp): string {
  const n = name.toLowerCase();
  if (/wohn|haus|immob/.test(n)) return 'home';
  if (/kfz|auto|fahrzeug/.test(n)) return 'car';
  if (/haftpflicht|recht/.test(n)) return 'shield';
  if (/famil|kind/.test(n)) return 'heart';
  if (/rente|alter/.test(n)) return 'hourglass';
  if (/bau|spar/.test(n)) return 'piggy';
  return { VERS: 'shield', SPAR: 'piggy', DARL: 'bank', AV: 'umbrella' }[bereich];
}

/**
 * Ausgewählte Verträge nach „Aktuell“ übernehmen. `ziel` je Vertrag: vorhandene Untergruppen-ID oder Name für eine neue.
 * Gibt die Zahl der übernommenen Verträge zurück.
 */
export function kiUebernehmen(editor: Editor, vertraege: KiVertrag[], ziel: (v: KiVertrag) => { id: string } | { neu: string }): number {
  const neu = new Map<string, string>();
  let n = 0;
  for (const v of vertraege) {
    if (!v.auswahl) continue;
    const z = ziel(v);
    let ugId: string;
    if ('id' in z) ugId = z.id;
    else {
      const schluessel = `${v.bereich}:${norm(z.neu)}`;
      ugId = neu.get(schluessel) ?? editor.untergruppeAnlegen('aktuell', v.bereich, z.neu || 'Weitere', ugSymbol(z.neu, v.bereich));
      neu.set(schluessel, ugId);
      if (!editor.lesen().aktuell.bereiche[v.bereich].aktiv) editor.bereichAktiv('aktuell', v.bereich, true);
    }
    if (editor.vertragAnlegen('aktuell', ugId, undefined, kiFelder(v))) n++;
  }
  return n;
}

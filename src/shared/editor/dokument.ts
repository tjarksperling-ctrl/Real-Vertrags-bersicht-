/**
 * Eine Übersicht = ein Yjs-Dokument (Festlegung M2).
 *
 * Aufbau (alles unter `doc.getMap('uebersicht')`):
 *   id, kundeId, titel, erstellt, geaendert, syncAktiv, ersparnisAnzeigen, syncAusSeit
 *   vorteile: Y.Map { aktiv, stichpunkte: Y.Array<string> }
 *   aufgaben: Y.Array<Y.Map>                       (ab M5)
 *   aktuell / neu: Y.Map { VERS|SPAR|DARL|AV: Y.Map { aktiv, untergruppen: Y.Array<Y.Map> } }
 *   Untergruppe: Y.Map { id, quelleId?, name, symbol, vertraege: Y.Array<Y.Map> }
 *   Vertrag:     Y.Map { id, quelleId?, name, bemerkung, …Felder je Typ, leistung: Y.Map { betrag, art } }
 *
 * Gelesen wird immer als einfache Objekte (Typen aus M1), damit die Rechenlogik unverändert bleibt.
 */
import * as Y from 'yjs';
import type {
  Aufgabe,
  Bereich,
  BereichTyp,
  Fassung,
  Untergruppe,
  Uebersicht,
  Vertrag,
  VertragJeTyp,
} from '../modell/typen';
import { BEREICH_TYPEN } from '../modell/typen';

export type FassungName = 'aktuell' | 'neu';
export type YMap = Y.Map<unknown>;

export const WURZEL = 'uebersicht';

export function wurzel(doc: Y.Doc): YMap {
  return doc.getMap(WURZEL);
}

// ---------------------------------------------------------------- Schreiben (einfache Objekte → Yjs)

export function vertragAlsY(v: Vertrag): YMap {
  const m = new Y.Map<unknown>();
  for (const [k, w] of Object.entries(v)) {
    if (w === undefined) continue;
    if (k === 'leistung') {
      const l = new Y.Map<unknown>();
      const lw = w as VertragJeTyp['AV']['leistung'];
      l.set('betrag', lw.betrag);
      l.set('art', lw.art);
      m.set(k, l);
    } else {
      m.set(k, w);
    }
  }
  return m;
}

export function untergruppeAlsY(ug: Untergruppe): YMap {
  const m = new Y.Map<unknown>();
  m.set('id', ug.id);
  if (ug.quelleId !== undefined) m.set('quelleId', ug.quelleId);
  m.set('name', ug.name);
  m.set('symbol', ug.symbol);
  const arr = new Y.Array<YMap>();
  arr.push((ug.vertraege as Vertrag[]).map(vertragAlsY));
  m.set('vertraege', arr);
  return m;
}

function bereichAlsY(b: Bereich): YMap {
  const m = new Y.Map<unknown>();
  m.set('aktiv', b.aktiv);
  const arr = new Y.Array<YMap>();
  arr.push(b.untergruppen.map((u) => untergruppeAlsY(u as Untergruppe)));
  m.set('untergruppen', arr);
  return m;
}

export function fassungAlsY(f: Fassung): YMap {
  const m = new Y.Map<unknown>();
  for (const typ of BEREICH_TYPEN) m.set(typ, bereichAlsY(f.bereiche[typ] as Bereich));
  return m;
}

function aufgabeAlsY(a: Aufgabe): YMap {
  const m = new Y.Map<unknown>();
  for (const [k, w] of Object.entries(a)) if (w !== undefined) m.set(k, w);
  return m;
}

/** Schreibt eine komplette Übersicht in ein (leeres) Dokument. */
export function schreibeUebersicht(doc: Y.Doc, u: Uebersicht): void {
  doc.transact(() => {
    const w = wurzel(doc);
    w.set('id', u.id);
    w.set('kundeId', u.kundeId);
    if (u.titel !== undefined) w.set('titel', u.titel);
    w.set('erstellt', u.erstellt);
    w.set('geaendert', u.geaendert);
    w.set('syncAktiv', u.syncAktiv);
    w.set('ersparnisAnzeigen', u.ersparnisAnzeigen);
    const vt = new Y.Map<unknown>();
    vt.set('aktiv', u.vorteile.aktiv);
    const sp = new Y.Array<string>();
    sp.push(u.vorteile.stichpunkte);
    vt.set('stichpunkte', sp);
    w.set('vorteile', vt);
    const af = new Y.Array<YMap>();
    af.push(u.aufgaben.map(aufgabeAlsY));
    w.set('aufgaben', af);
    w.set('aktuell', fassungAlsY(u.aktuell));
    w.set('neu', fassungAlsY(u.neu));
  });
}

export function neuesDokument(u: Uebersicht): Y.Doc {
  const doc = new Y.Doc();
  schreibeUebersicht(doc, u);
  return doc;
}

// ---------------------------------------------------------------- Lesen (Yjs → einfache Objekte)

function leseVertrag(m: YMap): Vertrag {
  const v: Record<string, unknown> = {};
  m.forEach((w, k) => {
    v[k] = w instanceof Y.Map ? { betrag: w.get('betrag') ?? null, art: w.get('art') } : w;
  });
  return v as unknown as Vertrag;
}

function leseUntergruppe(m: YMap): Untergruppe {
  const ug: Untergruppe = {
    id: m.get('id') as string,
    name: (m.get('name') as string) ?? '',
    symbol: (m.get('symbol') as string) ?? 'star',
    vertraege: (m.get('vertraege') as Y.Array<YMap>).map(leseVertrag) as never,
  };
  const q = m.get('quelleId');
  if (typeof q === 'string') ug.quelleId = q;
  return ug;
}

export function leseFassung(m: YMap): Fassung {
  const bereiche = {} as Fassung['bereiche'];
  for (const typ of BEREICH_TYPEN) {
    const b = m.get(typ) as YMap;
    bereiche[typ] = {
      aktiv: b.get('aktiv') !== false,
      untergruppen: (b.get('untergruppen') as Y.Array<YMap>).map(leseUntergruppe),
    } as never;
  }
  return { bereiche };
}

export function leseUebersicht(doc: Y.Doc): Uebersicht {
  const w = wurzel(doc);
  const vt = w.get('vorteile') as YMap | undefined;
  const af = w.get('aufgaben') as Y.Array<YMap> | undefined;
  const u: Uebersicht = {
    id: w.get('id') as string,
    kundeId: w.get('kundeId') as string,
    erstellt: w.get('erstellt') as string,
    geaendert: w.get('geaendert') as string,
    aktuell: leseFassung(w.get('aktuell') as YMap),
    neu: leseFassung(w.get('neu') as YMap),
    syncAktiv: w.get('syncAktiv') !== false,
    ersparnisAnzeigen: w.get('ersparnisAnzeigen') !== false,
    vorteile: {
      aktiv: vt?.get('aktiv') === true,
      stichpunkte: vt ? (vt.get('stichpunkte') as Y.Array<string>).toArray() : [],
    },
    aufgaben: af ? (af.map((m) => m.toJSON()) as Aufgabe[]) : [],
  };
  const titel = w.get('titel');
  if (typeof titel === 'string') u.titel = titel;
  return u;
}

// ---------------------------------------------------------------- Zugriff auf Teile

export function fassungY(doc: Y.Doc, f: FassungName): YMap {
  return wurzel(doc).get(f) as YMap;
}

export function bereichY(doc: Y.Doc, f: FassungName, typ: BereichTyp): YMap {
  return fassungY(doc, f).get(typ) as YMap;
}

export function untergruppenY(doc: Y.Doc, f: FassungName, typ: BereichTyp): Y.Array<YMap> {
  return bereichY(doc, f, typ).get('untergruppen') as Y.Array<YMap>;
}

export function vertraegeY(ug: YMap): Y.Array<YMap> {
  return ug.get('vertraege') as Y.Array<YMap>;
}

export interface UgFund {
  typ: BereichTyp;
  index: number;
  ug: YMap;
}

export interface VertragFund extends UgFund {
  vIndex: number;
  vertrag: YMap;
}

/** Sucht eine Untergruppe per Id (bzw. per quelleId, wenn `nachQuelle`). */
export function findeUg(doc: Y.Doc, f: FassungName, id: string, nachQuelle = false): UgFund | null {
  const feld = nachQuelle ? 'quelleId' : 'id';
  for (const typ of BEREICH_TYPEN) {
    const arr = untergruppenY(doc, f, typ);
    for (let i = 0; i < arr.length; i++) {
      const ug = arr.get(i);
      if (ug.get(feld) === id) return { typ, index: i, ug };
    }
  }
  return null;
}

export function findeVertrag(doc: Y.Doc, f: FassungName, id: string, nachQuelle = false): VertragFund | null {
  const feld = nachQuelle ? 'quelleId' : 'id';
  for (const typ of BEREICH_TYPEN) {
    const arr = untergruppenY(doc, f, typ);
    for (let i = 0; i < arr.length; i++) {
      const ug = arr.get(i);
      const vs = vertraegeY(ug);
      for (let j = 0; j < vs.length; j++) {
        const v = vs.get(j);
        if (v.get(feld) === id) return { typ, index: i, ug, vIndex: j, vertrag: v };
      }
    }
  }
  return null;
}

/** Tiefe Kopie einer Y.Map (für „Verschieben“: Yjs kennt kein Move). */
export function klone(m: YMap): YMap {
  return m.clone() as YMap;
}

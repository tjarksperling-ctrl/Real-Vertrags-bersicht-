/**
 * Editor-Befehle: alle Änderungen an einer Übersicht laufen hier durch (rein, ohne Electron/React, testbar).
 *
 * - Jede Änderung ist eine Yjs-Transaktion mit eigenem Ursprung → Rückgängig/Wiederholen
 *   (Y.UndoManager) betrifft nur eigene Änderungen, nie die anderer (Festlegung 3).
 * - Sync „In ‚Neu‘ übernehmen“ (Bild 14 v2): Ist der Schalter an, wird jede Änderung in „Aktuell“
 *   in derselben Transaktion auf das passende Element in „Neu“ (über `quelleId`) übertragen.
 *   Ausnahme: Ein Wert, den man in „Neu“ selbst geändert hat, bleibt (er wird nur überschrieben,
 *   wenn er noch dem bisherigen Wert in „Aktuell“ entspricht). In „Neu“ gelöschte Elemente werden
 *   nie wieder angelegt. Bei „aus“ wird nichts übertragen – auch später nicht.
 */
import * as Y from 'yjs';
import { neueId, jetzt } from '../modell/ids';
import { neuerVertrag, neueUntergruppe, fassungAusVorlage } from '../modell/fabrik';
import { kopiereFassung } from '../fassung/kopieren';
import type { BereichTyp, Fassung, Uebersicht, Vertrag, Vorlage } from '../modell/typen';
import {
  bereichY,
  fassungAlsY,
  findeUg,
  findeVertrag,
  klone,
  leseFassung,
  leseUebersicht,
  untergruppeAlsY,
  untergruppenY,
  vertragAlsY,
  vertraegeY,
  wurzel,
  type FassungName,
  type YMap,
} from './dokument';

/** Bearbeitbare Felder eines Vertrags; Leistung als „leistung.betrag“ / „leistung.art“. */
export type VertragFeld =
  | 'name'
  | 'bemerkung'
  | 'beitrag'
  | 'zahlweise'
  | 'sparrate'
  | 'einmalbetrag'
  | 'guthaben'
  | 'wertentwicklung'
  | 'rate'
  | 'restschuld'
  | 'zinsbindungBis'
  | 'einmalbeitrag'
  | 'laufzeitBis'
  | 'leistung.betrag'
  | 'leistung.art';

export type FeldWert = string | number | null;

export interface EditorOptionen {
  /** Zeitquelle (Tests). */
  zeit?: () => string;
  /** Ab hier zusammengefasste Änderungen (ms) – Standard 0: jeder Befehl ein Schritt. */
  captureTimeout?: number;
}

function leseFeld(v: YMap, feld: VertragFeld): unknown {
  if (feld.startsWith('leistung.')) {
    const l = v.get('leistung') as YMap | undefined;
    return l?.get(feld.slice(9));
  }
  return v.get(feld);
}

function schreibeFeld(v: YMap, feld: VertragFeld, wert: FeldWert): void {
  if (feld.startsWith('leistung.')) {
    let l = v.get('leistung') as YMap | undefined;
    if (!l) {
      l = new Y.Map<unknown>();
      v.set('leistung', l);
    }
    l.set(feld.slice(9), wert);
  } else {
    v.set(feld, wert);
  }
}

/** Index, an dem das Gegenstück in „Neu“ eingefügt werden soll (nach dem Gegenstück des Vorgängers). */
function zielIndexInNeu(quelle: Y.Array<YMap>, index: number, ziel: Y.Array<YMap>): number {
  for (let i = index - 1; i >= 0; i--) {
    const vorId = quelle.get(i).get('id');
    for (let j = 0; j < ziel.length; j++) if (ziel.get(j).get('quelleId') === vorId) return j + 1;
  }
  return 0;
}

export class Editor {
  readonly doc: Y.Doc;
  /** Ursprung aller eigenen Änderungen (für Rückgängig nur eigener Änderungen). */
  readonly ursprung: object = { name: 'lokal' };
  readonly undo: Y.UndoManager;
  private readonly zeit: () => string;

  constructor(doc: Y.Doc, optionen: EditorOptionen = {}) {
    this.doc = doc;
    this.zeit = optionen.zeit ?? jetzt;
    this.undo = new Y.UndoManager(wurzel(doc), {
      trackedOrigins: new Set([this.ursprung]),
      captureTimeout: optionen.captureTimeout ?? 0,
    });
  }

  lesen(): Uebersicht {
    return leseUebersicht(this.doc);
  }

  get syncAktiv(): boolean {
    return wurzel(this.doc).get('syncAktiv') !== false;
  }

  /** Führt eine Änderung als eigene Transaktion aus und setzt „geändert“. */
  private tx<T>(fn: () => T): T {
    let ergebnis!: T;
    this.doc.transact(() => {
      ergebnis = fn();
      wurzel(this.doc).set('geaendert', this.zeit());
    }, this.ursprung);
    return ergebnis;
  }

  private spiegeln(f: FassungName): boolean {
    return f === 'aktuell' && this.syncAktiv;
  }

  // ---------------------------------------------------------------- Rückgängig

  rueckgaengig(): boolean {
    return this.undo.undo() !== null;
  }

  wiederholen(): boolean {
    return this.undo.redo() !== null;
  }

  get kannRueckgaengig(): boolean {
    return this.undo.canUndo();
  }

  get kannWiederholen(): boolean {
    return this.undo.canRedo();
  }

  /** Beendet den aktuellen Rückgängig-Schritt (nächste Änderung wird ein eigener Schritt). */
  schrittBeenden(): void {
    this.undo.stopCapturing();
  }

  // ---------------------------------------------------------------- Übersicht

  titelAendern(titel: string): void {
    this.tx(() => wurzel(this.doc).set('titel', titel.trim()));
  }

  /** Sync-Schalter. Aus = nichts wird übertragen, auch später nicht; wieder an = nur ab dann. */
  syncSetzen(an: boolean, wer?: string): void {
    this.tx(() => {
      const w = wurzel(this.doc);
      w.set('syncAktiv', an);
      if (an) {
        w.delete('syncAusSeit');
        w.delete('syncAusVon');
      } else {
        w.set('syncAusSeit', this.zeit());
        if (wer) w.set('syncAusVon', wer);
      }
    });
  }

  ersparnisAnzeigen(an: boolean): void {
    this.tx(() => wurzel(this.doc).set('ersparnisAnzeigen', an));
  }

  /** „Neu wieder wie Aktuell“ (Festlegung Sitzung 23): überschreibt „Neu“ komplett, mit Rückgängig. */
  neuWieAktuell(): void {
    this.tx(() => {
      const aktuell = leseFassung(wurzel(this.doc).get('aktuell') as YMap);
      wurzel(this.doc).set('neu', fassungAlsY(kopiereFassung(aktuell)));
    });
  }

  /** Ersetzt „Aktuell“ (und „Neu“ als Kopie) durch eine Vorlage – z. B. „Vorlage wechseln“ direkt nach dem Anlegen. */
  vorlageAnwenden(vorlage: Vorlage): void {
    this.fassungSetzen(fassungAusVorlage(vorlage));
  }

  fassungSetzen(aktuell: Fassung): void {
    this.tx(() => {
      const w = wurzel(this.doc);
      w.set('aktuell', fassungAlsY(aktuell));
      w.set('neu', fassungAlsY(kopiereFassung(aktuell)));
    });
  }

  // ---------------------------------------------------------------- Vorteile (M3)

  vorteileAktiv(an: boolean): void {
    this.tx(() => this.vorteileY().set('aktiv', an));
  }

  stichpunktAnlegen(text = '', index?: number): number {
    return this.tx(() => {
      const sp = this.stichpunkteY();
      const i = index ?? sp.length;
      sp.insert(i, [text]);
      return i;
    });
  }

  stichpunktAendern(index: number, text: string): void {
    this.tx(() => {
      const sp = this.stichpunkteY();
      if (index < 0 || index >= sp.length || sp.get(index) === text) return;
      sp.delete(index, 1);
      sp.insert(index, [text]);
    });
  }

  stichpunktLoeschen(index: number): void {
    this.tx(() => {
      const sp = this.stichpunkteY();
      if (index >= 0 && index < sp.length) sp.delete(index, 1);
    });
  }

  private vorteileY(): YMap {
    const w = wurzel(this.doc);
    let vt = w.get('vorteile') as YMap | undefined;
    if (!vt) {
      vt = new Y.Map<unknown>();
      vt.set('aktiv', false);
      vt.set('stichpunkte', new Y.Array<string>());
      w.set('vorteile', vt);
    }
    return vt;
  }

  private stichpunkteY(): Y.Array<string> {
    return this.vorteileY().get('stichpunkte') as Y.Array<string>;
  }

  // ---------------------------------------------------------------- Bereiche

  /** Bereich an-/abwählen (Bild 13). Bei Sync an wird Abwählen in „Neu“ übernommen (Bild 14). */
  bereichAktiv(f: FassungName, typ: BereichTyp, aktiv: boolean): void {
    this.tx(() => {
      bereichY(this.doc, f, typ).set('aktiv', aktiv);
      if (this.spiegeln(f)) bereichY(this.doc, 'neu', typ).set('aktiv', aktiv);
    });
  }

  // ---------------------------------------------------------------- Untergruppen

  untergruppeAnlegen(f: FassungName, typ: BereichTyp, name: string, symbol: string, index?: number): string {
    return this.tx(() => {
      const arr = untergruppenY(this.doc, f, typ);
      const i = Math.max(0, Math.min(index ?? arr.length, arr.length));
      const ug = neueUntergruppe(name, symbol);
      arr.insert(i, [untergruppeAlsY(ug)]);
      if (this.spiegeln(f)) {
        const ziel = untergruppenY(this.doc, 'neu', typ);
        const kopie = { ...neueUntergruppe(name, symbol), quelleId: ug.id };
        ziel.insert(zielIndexInNeu(arr, i, ziel), [untergruppeAlsY(kopie)]);
      }
      return ug.id;
    });
  }

  untergruppeAendern(f: FassungName, id: string, aenderung: { name?: string; symbol?: string }): void {
    this.tx(() => {
      const fund = findeUg(this.doc, f, id);
      if (!fund) return;
      const gegen = this.spiegeln(f) ? findeUg(this.doc, 'neu', id, true) : null;
      for (const feld of ['name', 'symbol'] as const) {
        const wert = aenderung[feld];
        if (wert === undefined) continue;
        const alt = fund.ug.get(feld);
        if (alt === wert) continue;
        fund.ug.set(feld, wert);
        if (gegen && gegen.ug.get(feld) === alt) gegen.ug.set(feld, wert);
      }
    });
  }

  /** Löscht sofort (mit Rückgängig, Bild 12 v4). Gibt Name und Anzahl Verträge für den Hinweis zurück. */
  untergruppeLoeschen(f: FassungName, id: string): { name: string; vertraege: number } | null {
    return this.tx(() => {
      const fund = findeUg(this.doc, f, id);
      if (!fund) return null;
      const info = { name: String(fund.ug.get('name') ?? ''), vertraege: vertraegeY(fund.ug).length };
      untergruppenY(this.doc, f, fund.typ).delete(fund.index, 1);
      if (this.spiegeln(f)) {
        const gegen = findeUg(this.doc, 'neu', id, true);
        if (gegen) untergruppenY(this.doc, 'neu', gegen.typ).delete(gegen.index, 1);
      }
      return info;
    });
  }

  /** Verschiebt eine Untergruppe innerhalb ihres Bereichs an `zielIndex` (Endposition). */
  untergruppeVerschieben(f: FassungName, id: string, zielIndex: number): void {
    this.tx(() => {
      const fund = findeUg(this.doc, f, id);
      if (!fund) return;
      const arr = untergruppenY(this.doc, f, fund.typ);
      const ziel = Math.max(0, Math.min(zielIndex, arr.length - 1));
      if (ziel === fund.index) return;
      const kopie = klone(fund.ug);
      arr.delete(fund.index, 1);
      arr.insert(ziel, [kopie]);
      if (this.spiegeln(f)) {
        const gegen = findeUg(this.doc, 'neu', id, true);
        if (!gegen) return;
        const narr = untergruppenY(this.doc, 'neu', gegen.typ);
        const nk = klone(gegen.ug);
        narr.delete(gegen.index, 1);
        narr.insert(zielIndexInNeu(arr, ziel, narr), [nk]);
      }
    });
  }

  // ---------------------------------------------------------------- Verträge

  vertragAnlegen(f: FassungName, ugId: string, index?: number, werte: Partial<Record<VertragFeld, FeldWert>> = {}): string | null {
    return this.tx(() => {
      const fund = findeUg(this.doc, f, ugId);
      if (!fund) return null;
      const vs = vertraegeY(fund.ug);
      const i = Math.max(0, Math.min(index ?? vs.length, vs.length));
      const v = neuerVertrag(fund.typ) as Vertrag;
      const ym = vertragAlsY(v);
      for (const [k, w] of Object.entries(werte)) schreibeFeld(ym, k as VertragFeld, w as FeldWert);
      vs.insert(i, [ym]);
      if (this.spiegeln(f)) {
        const gegen = findeUg(this.doc, 'neu', ugId, true);
        if (gegen) {
          const nvs = vertraegeY(gegen.ug);
          const kopie = klone(ym);
          kopie.set('id', neueId());
          kopie.set('quelleId', v.id);
          nvs.insert(zielIndexInNeu(vs, i, nvs), [kopie]);
        }
      }
      return v.id;
    });
  }

  /** Ändert ein Feld. Bei Sync an: Gegenstück in „Neu“ nur, wenn es dort nicht selbst geändert wurde. */
  vertragAendern(f: FassungName, id: string, feld: VertragFeld, wert: FeldWert): void {
    this.tx(() => {
      const fund = findeVertrag(this.doc, f, id);
      if (!fund) return;
      const alt = leseFeld(fund.vertrag, feld) ?? null;
      if (alt === wert) return;
      schreibeFeld(fund.vertrag, feld, wert);
      if (this.spiegeln(f)) {
        const gegen = findeVertrag(this.doc, 'neu', id, true);
        if (gegen && (leseFeld(gegen.vertrag, feld) ?? null) === alt) schreibeFeld(gegen.vertrag, feld, wert);
      }
    });
  }

  vertragLoeschen(f: FassungName, id: string): { name: string } | null {
    return this.tx(() => {
      const fund = findeVertrag(this.doc, f, id);
      if (!fund) return null;
      const name = String(fund.vertrag.get('name') ?? '');
      vertraegeY(fund.ug).delete(fund.vIndex, 1);
      if (this.spiegeln(f)) {
        const gegen = findeVertrag(this.doc, 'neu', id, true);
        if (gegen) vertraegeY(gegen.ug).delete(gegen.vIndex, 1);
      }
      return { name };
    });
  }

  /** Verschiebt einen Vertrag in eine Untergruppe desselben Bereichs an `zielIndex` (Endposition). */
  vertragVerschieben(f: FassungName, id: string, zielUgId: string, zielIndex: number): void {
    this.tx(() => {
      const fund = findeVertrag(this.doc, f, id);
      const zielUg = findeUg(this.doc, f, zielUgId);
      if (!fund || !zielUg || zielUg.typ !== fund.typ) return;
      const zvs = vertraegeY(zielUg.ug);
      const gleich = zielUg.ug === fund.ug;
      const max = gleich ? zvs.length - 1 : zvs.length;
      const ziel = Math.max(0, Math.min(zielIndex, max));
      if (gleich && ziel === fund.vIndex) return;
      const kopie = klone(fund.vertrag);
      vertraegeY(fund.ug).delete(fund.vIndex, 1);
      zvs.insert(ziel, [kopie]);
      if (this.spiegeln(f)) {
        const gegen = findeVertrag(this.doc, 'neu', id, true);
        const gegenUg = findeUg(this.doc, 'neu', zielUgId, true);
        if (!gegen || !gegenUg) return;
        const nk = klone(gegen.vertrag);
        vertraegeY(gegen.ug).delete(gegen.vIndex, 1);
        const nvs = vertraegeY(gegenUg.ug);
        nvs.insert(zielIndexInNeu(zvs, ziel, nvs), [nk]);
      }
    });
  }
}

/** Alle Untergruppen-Namen je Bereich – z. B. für das Ziel „wird dorthin verschoben“ der Vorschläge. */
export function untergruppenListe(u: Uebersicht, f: FassungName, typ: BereichTyp): { id: string; name: string }[] {
  return u[f].bereiche[typ].untergruppen.map((ug) => ({ id: ug.id, name: ug.name }));
}


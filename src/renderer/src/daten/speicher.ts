/**
 * Lokaler Speicher der Oberfläche: hält die Yjs-Dokumente (Bestand + je Übersicht) und schreibt
 * jede Änderung kurz verzögert über `window.api` ins Benutzerprofil.
 */
import * as Y from 'yjs';
import {
  AGENTUR_VORLAGEN,
  Editor,
  kundeEntfernen,
  uebersichtEntfernen,
  STANDARD_EINSTELLUNGEN,
  aufgabenKurz,
  fassungSumme,
  kundeEintragen,
  leseBestand,
  leseUebersicht,
  neuesDokument,
  uebersichtAktualisieren,
  uebersichtEintragen,
  type Einstellungen,
  type Kunde,
  type Uebersicht,
  type Vorlage,
} from '../../../shared';
import { demoKunden } from './demo';

const VERZOEGERUNG = 300;

export interface Gespeichert {
  einstellungen: Einstellungen;
  /** Alle Vorlagen (Agentur + eigene). Agentur-Vorlagen werden mit M5 für alle geteilt. */
  vorlagen: Vorlage[];
  /** Autovervollständigung an/aus (Bild 11, Einstellungen → Vorlagen). */
  autovervollstaendigung: boolean;
}

export function standardGespeichert(): Gespeichert {
  return {
    einstellungen: structuredClone(STANDARD_EINSTELLUNGEN) as Einstellungen,
    vorlagen: structuredClone(AGENTUR_VORLAGEN) as Vorlage[],
    autovervollstaendigung: true,
  };
}

export class Speicher {
  readonly bestand = new Y.Doc();
  /** Anzeigename der Person (für „zuletzt geändert von“). */
  benutzer = '';
  private readonly docs = new Map<string, Y.Doc>();
  private readonly timer = new Map<string, ReturnType<typeof setTimeout>>();

  static async oeffnen(demo: boolean, benutzer = ''): Promise<Speicher> {
    const s = new Speicher();
    s.benutzer = benutzer;
    const daten = await window.api.laden('bestand');
    if (daten) Y.applyUpdate(s.bestand, daten);
    s.beobachten('bestand', s.bestand);
    if (demo && leseBestand(s.bestand).kunden.length === 0)
      for (const d of demoKunden()) {
        s.anlegen(d.kunde, d.uebersicht, d.von);
        if (d.umgesetzt) uebersichtAktualisieren(s.bestand, d.uebersicht.id, { umgesetzt: d.umgesetzt });
      }
    window.addEventListener('beforeunload', () => s.sofortSpeichern());
    return s;
  }

  private beobachten(name: string, doc: Y.Doc, nachher?: () => void): void {
    doc.on('update', () => {
      clearTimeout(this.timer.get(name));
      this.timer.set(
        name,
        setTimeout(() => {
          this.timer.delete(name);
          void window.api.speichern(name, Y.encodeStateAsUpdate(doc));
          nachher?.();
        }, VERZOEGERUNG),
      );
    });
  }

  sofortSpeichern(): void {
    for (const [name, t] of this.timer) {
      clearTimeout(t);
      const doc = name === 'bestand' ? this.bestand : this.docs.get(name.slice(2));
      if (doc) void window.api.speichern(name, Y.encodeStateAsUpdate(doc));
    }
    this.timer.clear();
  }

  /** Legt Kunde + erste Übersicht an. */
  anlegen(kunde: Kunde, u: Uebersicht, von = this.benutzer): void {
    const doc = neuesDokument(u);
    this.registrieren(u.id, doc);
    void window.api.speichern(`u-${u.id}`, Y.encodeStateAsUpdate(doc));
    this.bestand.transact(() => {
      kundeEintragen(this.bestand, kunde);
      uebersichtEintragen(this.bestand, {
        id: u.id,
        kundeId: kunde.id,
        titel: u.titel ?? '',
        erstellt: u.erstellt,
        geaendert: u.geaendert,
        gesamtAktuell: fassungSumme(u.aktuell).gesamtMonat,
        gesamtNeu: fassungSumme(u.neu).gesamtMonat,
        aufgaben: aufgabenKurz(u),
        ...(von ? { geaendertVon: von } : {}),
      });
    });
  }

  private registrieren(id: string, doc: Y.Doc): void {
    this.docs.set(id, doc);
    this.beobachten(`u-${id}`, doc, () => {
      const u = leseUebersicht(doc);
      uebersichtAktualisieren(this.bestand, id, {
        titel: u.titel ?? '',
        geaendert: u.geaendert,
        gesamtAktuell: fassungSumme(u.aktuell).gesamtMonat,
        gesamtNeu: fassungSumme(u.neu).gesamtMonat,
        aufgaben: aufgabenKurz(u),
        ...(this.benutzer ? { geaendertVon: this.benutzer } : {}),
      });
    });
  }

  async uebersicht(id: string): Promise<Y.Doc | null> {
    const da = this.docs.get(id);
    if (da) return da;
    const daten = await window.api.laden(`u-${id}`);
    if (!daten) return null;
    const doc = new Y.Doc();
    Y.applyUpdate(doc, daten);
    this.registrieren(id, doc);
    return doc;
  }

  /** Weitere Übersicht für einen bestehenden Kunden (Kundenakte). */
  uebersichtHinzufuegen(kundeId: string, u: Uebersicht): void {
    const doc = neuesDokument(u);
    this.registrieren(u.id, doc);
    void window.api.speichern(`u-${u.id}`, Y.encodeStateAsUpdate(doc));
    uebersichtEintragen(this.bestand, {
      id: u.id,
      kundeId,
      titel: u.titel ?? '',
      erstellt: u.erstellt,
      geaendert: u.geaendert,
      gesamtAktuell: fassungSumme(u.aktuell).gesamtMonat,
      gesamtNeu: fassungSumme(u.neu).gesamtMonat,
      aufgaben: aufgabenKurz(u),
      ...(this.benutzer ? { geaendertVon: this.benutzer } : {}),
    });
  }

  /** Eine Änderung an einer (ggf. noch nicht geladenen) Übersicht, z. B. Aufgabe abhaken von der Startseite. */
  async mitEditor(id: string, fn: (e: Editor) => void): Promise<void> {
    const doc = await this.uebersicht(id);
    if (!doc) return;
    const e = new Editor(doc);
    try {
      fn(e);
    } finally {
      e.undo.destroy();
    }
  }

  private vergessen(id: string): void {
    const name = `u-${id}`;
    clearTimeout(this.timer.get(name));
    this.timer.delete(name);
    this.docs.get(id)?.destroy();
    this.docs.delete(id);
  }

  /** Übersicht endgültig löschen (Verzeichnis + Datei). */
  async uebersichtLoeschen(id: string): Promise<void> {
    this.vergessen(id);
    uebersichtEntfernen(this.bestand, id);
    await window.api.loeschen(`u-${id}`);
  }

  /** Kunde endgültig löschen (Bild 16): alle Übersichten mit Aufgaben, Verzeichnis-Einträge und Dateien. */
  async kundeLoeschen(kundeId: string): Promise<number> {
    const ids = kundeEntfernen(this.bestand, kundeId);
    for (const id of ids) this.vergessen(id);
    await Promise.all(ids.map((id) => window.api.loeschen(`u-${id}`)));
    this.sofortSpeichern();
    return ids.length;
  }

  /** Alle Übersichten (für Vorschläge beim Tippen). */
  async alleUebersichten(): Promise<Uebersicht[]> {
    const ids = leseBestand(this.bestand).uebersichten.map((u) => u.id);
    const docs = await Promise.all(ids.map((id) => this.uebersicht(id)));
    return docs.filter((d): d is Y.Doc => d !== null).map(leseUebersicht);
  }
}

export async function gespeichertLaden(): Promise<Gespeichert> {
  const roh = (await window.api.einstellungenLaden()) as Partial<Gespeichert> | null;
  const std = standardGespeichert();
  if (!roh) return std;
  return {
    einstellungen: { ...std.einstellungen, ...(roh.einstellungen ?? {}) },
    vorlagen: Array.isArray(roh.vorlagen) && roh.vorlagen.length ? roh.vorlagen : std.vorlagen,
    autovervollstaendigung: roh.autovervollstaendigung ?? true,
  };
}

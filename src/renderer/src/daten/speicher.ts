/**
 * Lokaler Speicher der Oberfläche: hält die Yjs-Dokumente (Bestand + je Übersicht) und schreibt
 * jede Änderung kurz verzögert über `window.api` ins Benutzerprofil.
 */
import * as Y from 'yjs';
import {
  AGENTUR_VORLAGEN,
  STANDARD_EINSTELLUNGEN,
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
  private readonly docs = new Map<string, Y.Doc>();
  private readonly timer = new Map<string, ReturnType<typeof setTimeout>>();

  static async oeffnen(demo: boolean): Promise<Speicher> {
    const s = new Speicher();
    const daten = await window.api.laden('bestand');
    if (daten) Y.applyUpdate(s.bestand, daten);
    s.beobachten('bestand', s.bestand);
    if (demo && leseBestand(s.bestand).kunden.length === 0) for (const d of demoKunden()) s.anlegen(d.kunde, d.uebersicht);
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
  anlegen(kunde: Kunde, u: Uebersicht): void {
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

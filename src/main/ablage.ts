/**
 * Ablage (M5b, Mehrbenutzer M2 ohne Server): wo die Yjs-Dokumente liegen.
 *
 * - „lokal“: wie bisher `<daten>/<name>.yjs` im Benutzerprofil.
 * - „gemeinsam“ (SharePoint-/OneDrive-Ordner, den OneDrive auf jedem PC synchronisiert):
 *     <ordner>/Vertragsuebersicht/
 *       daten/<name>/<personId>.yjs   – jede Person schreibt NUR ihre eigene Datei (keine OneDrive-Konfliktkopien)
 *       personen/<personId>.json      – Name + Anwesenheit (Herzschlag)
 *       geloescht/<name>              – Grabstein: gelöschte Übersicht/Kunde wird nie wieder angelegt
 *       agentur.json                  – Agentur-Vorlagen + Team (zuletzt gespeichert gilt)
 *   Lesen = alle Dateien eines Dokuments per Yjs zusammenführen (konfliktfrei, Reihenfolge egal).
 *
 * Keine Electron-Abhängigkeit, damit sich alles mit Vitest prüfen lässt.
 */
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as Y from 'yjs';
import type { AblageOrt, FremdeAenderung, Person, PersonStand } from '../shared/api';

export type { AblageArt, AblageOrt, FremdeAenderung, Person, PersonStand } from '../shared/api';

export const UNTERORDNER = 'Vertragsuebersicht';
const NAME = /^[a-z0-9-]{1,80}$/i;

export function pruefeName(name: string): void {
  if (!NAME.test(name)) throw new Error(`Ungültiger Name: ${name}`);
}

/** Schreibt erst in eine Hilfsdatei und benennt dann um – so entsteht nie eine halbe Datei. */
export async function sicherSchreiben(ziel: string, daten: Uint8Array | string): Promise<void> {
  await mkdir(join(ziel, '..'), { recursive: true });
  const tmp = `${ziel}.${process.pid}.tmp`;
  await writeFile(tmp, daten);
  await rename(tmp, ziel);
}

async function lesenOderNull(p: string): Promise<Buffer | null> {
  try {
    return await readFile(p);
  } catch (e) {
    const c = (e as NodeJS.ErrnoException).code;
    if (c === 'ENOENT' || c === 'ENOTDIR') return null;
    throw e;
  }
}

async function eintraege(ordner: string): Promise<string[]> {
  try {
    return await readdir(ordner);
  } catch {
    return [];
  }
}

/** Person-ID aus dem Namen + Zufall: „Tjark S.“ → „tjark-s-3f9a“. */
export function personId(name: string, zufall: string): string {
  const s = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  return `${s || 'person'}-${zufall.replace(/[^a-z0-9]/gi, '').slice(0, 4).toLowerCase()}`;
}

export class Ablage {
  /** Zuletzt gesehene Änderungszeit je fremder Datei (für `fremdePruefen`). */
  private gesehen = new Map<string, number>();
  private namenCache = new Map<string, string>();

  constructor(
    readonly lokal: string,
    readonly ort: AblageOrt,
    readonly ich: Person,
  ) {}

  get gemeinsam(): boolean {
    return this.ort.art !== 'lokal' && !!this.ort.ordner;
  }
  /** Wurzel im gemeinsamen Ordner. */
  get wurzel(): string {
    return join(this.ort.ordner ?? this.lokal, UNTERORDNER);
  }
  private dokOrdner(name: string): string {
    return join(this.wurzel, 'daten', name);
  }
  private grab(name: string): string {
    return join(this.wurzel, 'geloescht', name);
  }

  async istGeloescht(name: string): Promise<boolean> {
    if (!this.gemeinsam) return false;
    return (await lesenOderNull(this.grab(name))) !== null;
  }

  /** Alle Stände eines Dokuments zusammengeführt (null = gibt es nicht). */
  async laden(name: string): Promise<Uint8Array | null> {
    pruefeName(name);
    if (!this.gemeinsam) {
      const b = await lesenOderNull(join(this.lokal, `${name}.yjs`));
      return b ? new Uint8Array(b) : null;
    }
    if (await this.istGeloescht(name)) return null;
    const ordner = this.dokOrdner(name);
    const teile: Uint8Array[] = [];
    for (const f of await eintraege(ordner)) {
      if (!f.endsWith('.yjs')) continue;
      const p = join(ordner, f);
      const b = await lesenOderNull(p);
      if (!b || b.length === 0) continue;
      teile.push(new Uint8Array(b));
      // gelesene fremde Stände gelten als gesehen
      if (f !== `${this.ich.id}.yjs`) this.gesehen.set(p, (await stat(p).catch(() => null))?.mtimeMs ?? 0);
    }
    if (!teile.length) return null;
    return teile.length === 1 ? teile[0]! : mergeSicher(teile);
  }

  /** Eigenen Stand schreiben. Gelöschte Dokumente werden nicht wieder angelegt (false). */
  async speichern(name: string, daten: Uint8Array): Promise<boolean> {
    pruefeName(name);
    if (!this.gemeinsam) {
      await sicherSchreiben(join(this.lokal, `${name}.yjs`), daten);
      return true;
    }
    if (await this.istGeloescht(name)) return false;
    await sicherSchreiben(join(this.dokOrdner(name), `${this.ich.id}.yjs`), daten);
    return true;
  }

  /** Dokument für alle löschen (DSGVO: wirklich weg, Grabstein verhindert Wiederanlegen). */
  async loeschen(name: string): Promise<void> {
    pruefeName(name);
    if (!this.gemeinsam) {
      await rm(join(this.lokal, `${name}.yjs`), { force: true });
      return;
    }
    await sicherSchreiben(this.grab(name), new Date().toISOString());
    await rm(this.dokOrdner(name), { recursive: true, force: true });
  }

  /** Neue/geänderte Dateien anderer Personen an den genannten Dokumenten. */
  async fremdePruefen(namen: Iterable<string>): Promise<FremdeAenderung[]> {
    if (!this.gemeinsam) return [];
    const neu: FremdeAenderung[] = [];
    for (const name of namen) {
      if (!NAME.test(name)) continue;
      const ordner = this.dokOrdner(name);
      for (const f of await eintraege(ordner)) {
        if (!f.endsWith('.yjs') || f === `${this.ich.id}.yjs`) continue;
        const p = join(ordner, f);
        const s = await stat(p).catch(() => null);
        if (!s || s.size === 0 || this.gesehen.get(p) === s.mtimeMs) continue;
        const b = await lesenOderNull(p);
        if (!b) continue;
        this.gesehen.set(p, s.mtimeMs);
        const id = f.slice(0, -4);
        neu.push({ name, von: { id, name: await this.personName(id) }, daten: new Uint8Array(b) });
      }
    }
    return neu;
  }

  private async personName(id: string): Promise<string> {
    const da = this.namenCache.get(id);
    if (da) return da;
    const p = await this.personLesen(id);
    const n = p?.name || id;
    this.namenCache.set(id, n);
    return n;
  }

  private async personLesen(id: string): Promise<PersonStand | null> {
    const b = await lesenOderNull(join(this.wurzel, 'personen', `${id}.json`));
    if (!b) return null;
    try {
      const j = JSON.parse(b.toString('utf8')) as PersonStand;
      return typeof j.name === 'string' && typeof j.zeit === 'string' ? { ...j, id } : null;
    } catch {
      return null;
    }
  }

  /** Eigene Anwesenheit schreiben (Herzschlag). */
  async anwesenheitSchreiben(stand: Omit<PersonStand, 'id' | 'name' | 'zeit'>, zeit = new Date()): Promise<void> {
    if (!this.gemeinsam) return;
    const j: PersonStand = { id: this.ich.id, name: this.ich.name, zeit: zeit.toISOString(), ...stand };
    await sicherSchreiben(join(this.wurzel, 'personen', `${this.ich.id}.json`), JSON.stringify(j));
  }

  /** Alle Personen, die den Ordner nutzen (inkl. mir). */
  async personen(): Promise<PersonStand[]> {
    if (!this.gemeinsam) return [];
    const l: PersonStand[] = [];
    for (const f of await eintraege(join(this.wurzel, 'personen'))) {
      if (!f.endsWith('.json')) continue;
      const p = await this.personLesen(f.slice(0, -5));
      if (p) {
        l.push(p);
        this.namenCache.set(p.id, p.name);
      }
    }
    return l;
  }

  async agenturLesen(): Promise<unknown> {
    if (!this.gemeinsam) return null;
    const b = await lesenOderNull(join(this.wurzel, 'agentur.json'));
    try {
      return b ? JSON.parse(b.toString('utf8')) : null;
    } catch {
      return null;
    }
  }
  async agenturSchreiben(daten: unknown): Promise<void> {
    if (!this.gemeinsam) return;
    await sicherSchreiben(join(this.wurzel, 'agentur.json'), JSON.stringify(daten, null, 2));
  }

  /** Namen aller vorhandenen Dokumente (für Umzug und Statistik). */
  async namen(): Promise<string[]> {
    if (!this.gemeinsam)
      return (await eintraege(this.lokal)).filter((f) => f.endsWith('.yjs')).map((f) => f.slice(0, -4)).filter((n) => NAME.test(n));
    const tot = new Set(await eintraege(join(this.wurzel, 'geloescht')));
    return (await eintraege(join(this.wurzel, 'daten'))).filter((n) => NAME.test(n) && !tot.has(n));
  }

  /** Größe aller Daten in Byte. */
  async groesse(): Promise<number> {
    let summe = 0;
    const zaehle = async (o: string): Promise<void> => {
      for (const f of await eintraege(o)) {
        const p = join(o, f);
        const s = await stat(p).catch(() => null);
        if (!s) continue;
        if (s.isDirectory()) await zaehle(p);
        else summe += s.size;
      }
    };
    if (this.gemeinsam) await zaehle(this.wurzel);
    else for (const n of await this.namen()) summe += (await stat(join(this.lokal, `${n}.yjs`)).catch(() => null))?.size ?? 0;
    return summe;
  }
}

/** Yjs-Stände zusammenführen; ein kaputter Stand (z. B. halb synchronisiert) wird übersprungen. */
export function mergeSicher(teile: Uint8Array[]): Uint8Array {
  const doc = new Y.Doc();
  for (const t of teile) {
    try {
      Y.applyUpdate(doc, t);
    } catch {
      /* unvollständige Datei – kommt beim nächsten Abgleich vollständig */
    }
  }
  const r = Y.encodeStateAsUpdate(doc);
  doc.destroy();
  return r;
}

/**
 * Umzug: alle Dokumente von `von` nach `nach` übernehmen. Vorhandenes am Ziel bleibt erhalten
 * (Stände werden zusammengeführt), die alte Ablage wird nie gelöscht.
 */
export async function umziehen(von: Ablage, nach: Ablage): Promise<number> {
  let n = 0;
  for (const name of await von.namen()) {
    const a = await von.laden(name);
    if (!a) continue;
    if (await nach.istGeloescht(name)) continue;
    const b = await nach.laden(name);
    await nach.speichern(name, b ? mergeSicher([b, a]) : a);
    n++;
  }
  return n;
}

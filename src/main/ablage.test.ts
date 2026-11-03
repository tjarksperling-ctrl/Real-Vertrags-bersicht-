import { mkdtemp, readdir, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { Ablage, mergeSicher, personId, umziehen } from './ablage';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'ablage-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const tjark = { id: 'tjark-s-aaaa', name: 'Tjark S.' };
const sabine = { id: 'sabine-k-bbbb', name: 'Sabine K.' };
const gemeinsam = (ich = tjark) => new Ablage(join(dir, 'lokal-' + ich.id), { art: 'sharepoint', ordner: join(dir, 'team') }, ich);

function doc(text: string, basis?: Uint8Array): { d: Y.Doc; u: () => Uint8Array } {
  const d = new Y.Doc();
  if (basis) Y.applyUpdate(d, basis);
  d.getArray<string>('l').push([text]);
  return { d, u: () => Y.encodeStateAsUpdate(d) };
}
const inhalt = (u: Uint8Array | null) => {
  const d = new Y.Doc();
  if (u) Y.applyUpdate(d, u);
  return d.getArray<string>('l').toArray().sort();
};

describe('Ablage', () => {
  it('lokal: speichern und laden wie bisher', async () => {
    const a = new Ablage(join(dir, 'lokal'), { art: 'lokal', ordner: null }, tjark);
    expect(await a.laden('bestand')).toBeNull();
    await a.speichern('bestand', doc('x').u());
    expect(inhalt(await a.laden('bestand'))).toEqual(['x']);
    expect(await a.namen()).toEqual(['bestand']);
    await a.loeschen('bestand');
    expect(await a.laden('bestand')).toBeNull();
  });

  it('gemeinsam: jede Person schreibt eigene Datei, Lesen führt zusammen', async () => {
    const t = gemeinsam(tjark);
    const s = gemeinsam(sabine);
    await t.speichern('u-1', doc('von Tjark').u());
    await s.speichern('u-1', doc('von Sabine').u());
    expect((await readdir(join(dir, 'team', 'Vertragsuebersicht', 'daten', 'u-1'))).sort()).toEqual(['sabine-k-bbbb.yjs', 'tjark-s-aaaa.yjs']);
    expect(inhalt(await t.laden('u-1'))).toEqual(['von Sabine', 'von Tjark']);
  });

  it('meldet neue fremde Änderungen genau einmal, mit Namen', async () => {
    const t = gemeinsam(tjark);
    const s = gemeinsam(sabine);
    await s.anwesenheitSchreiben({ uebersichtId: 'u-1' });
    expect(await t.fremdePruefen(['u-1'])).toEqual([]);
    await s.speichern('u-1', doc('a').u());
    await t.speichern('u-1', doc('b').u());
    const neu = await t.fremdePruefen(['u-1']);
    expect(neu).toHaveLength(1);
    expect(neu[0]!.von).toEqual({ id: sabine.id, name: 'Sabine K.' });
    expect(inhalt(neu[0]!.daten)).toEqual(['a']);
    expect(await t.fremdePruefen(['u-1'])).toEqual([]);
  });

  it('gelöscht bleibt gelöscht (Grabstein), auch wenn jemand noch speichert', async () => {
    const t = gemeinsam(tjark);
    const s = gemeinsam(sabine);
    await t.speichern('u-2', doc('x').u());
    await s.speichern('u-2', doc('y').u());
    await t.loeschen('u-2');
    expect(await s.speichern('u-2', doc('z').u())).toBe(false);
    expect(await s.laden('u-2')).toBeNull();
    expect(await t.namen()).toEqual([]);
  });

  it('Anwesenheit und Personenliste', async () => {
    const t = gemeinsam(tjark);
    await t.anwesenheitSchreiben({ uebersichtId: 'u-1', ort: { vertragId: 'v1', spalte: 'betrag' } }, new Date('2026-11-03T10:00:00Z'));
    await gemeinsam(sabine).anwesenheitSchreiben({});
    const p = await t.personen();
    expect(p.map((x) => x.name).sort()).toEqual(['Sabine K.', 'Tjark S.']);
    expect(p.find((x) => x.id === tjark.id)).toMatchObject({ zeit: '2026-11-03T10:00:00.000Z', ort: { vertragId: 'v1' } });
  });

  it('Umzug lokal → gemeinsam behält Vorhandenes', async () => {
    const lokal = new Ablage(join(dir, 'lokal'), { art: 'lokal', ordner: null }, tjark);
    await lokal.speichern('bestand', doc('lokal').u());
    const s = gemeinsam(sabine);
    await s.speichern('bestand', doc('team').u());
    const t = gemeinsam(tjark);
    expect(await umziehen(lokal, t)).toBe(1);
    expect(inhalt(await t.laden('bestand'))).toEqual(['lokal', 'team']);
    expect(inhalt(await lokal.laden('bestand'))).toEqual(['lokal']);
  });

  it('halb synchronisierte Datei bricht das Laden nicht', async () => {
    const t = gemeinsam(tjark);
    await t.speichern('u-3', doc('gut').u());
    const o = join(dir, 'team', 'Vertragsuebersicht', 'daten', 'u-3');
    await mkdir(o, { recursive: true });
    await writeFile(join(o, 'kaputt-cccc.yjs'), Buffer.from([1, 2, 3, 250, 251]));
    expect(inhalt(await t.laden('u-3'))).toEqual(['gut']);
    expect(inhalt(mergeSicher([doc('a').u(), new Uint8Array([9, 9, 9])]))).toEqual(['a']);
  });

  it('Person-ID aus dem Namen', () => {
    expect(personId('Tjark S.', '3F9A-xyz')).toBe('tjark-s-3f9a');
    expect(personId('Jürgen Weiß', 'ab12')).toBe('jurgen-weiss-ab12');
    expect(personId('', 'ab12')).toBe('person-ab12');
  });
});

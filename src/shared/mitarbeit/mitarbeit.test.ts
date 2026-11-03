import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { leereFassung, neueUebersicht, neuerKunde } from '../modell/fabrik';
import { Editor } from '../editor/befehle';
import { leseUebersicht, neuesDokument } from '../editor/dokument';
import { anwesendIn, anwesendUeberall, FERN, fremdeMarken, geaenderteFelder, vorWann } from './mitarbeit';
import type { VertragVERS } from '../modell/typen';

const v = (x: Partial<VertragVERS>): VertragVERS => ({ id: 'v1', name: 'Hausrat', bemerkung: '', beitrag: 1000, zahlweise: 'monatlich', ...x });

describe('Mitarbeit', () => {
  it('erkennt geänderte Felder', () => {
    expect(geaenderteFelder(v({}), v({ bemerkung: 'neu' }))).toEqual(['bemerkung']);
    expect(geaenderteFelder(v({}), v({}))).toEqual([]);
    expect(geaenderteFelder(undefined, v({ bemerkung: '' }))).toEqual(['name', 'beitrag', 'zahlweise']);
  });

  it('Marken aus einer fremden Yjs-Änderung', () => {
    const k = neuerKunde('Familie Berger');
    const u = neueUebersicht(k.id, leereFassung());
    const a = neuesDokument(u);
    const b = new Y.Doc();
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a));
    // Sabine (Dokument b) legt einen Vertrag an
    const e = new Editor(b);
    const ug = e.untergruppeAnlegen('aktuell', 'VERS', 'Wohnen', 'home');
    const vid = e.vertragAnlegen('aktuell', ug, undefined, { name: 'Hausrat' })!;
    const vorher = leseUebersicht(a);
    let ursprung: unknown = null;
    a.on('update', (_u: Uint8Array, o: unknown) => (ursprung = o));
    Y.applyUpdate(a, Y.encodeStateAsUpdate(b), FERN);
    expect(ursprung).toBe(FERN);
    const m = fremdeMarken(vorher, leseUebersicht(a), 'Sabine K.', 1000);
    expect(m.get(vid)).toMatchObject({ von: 'Sabine K.', fassung: 'aktuell' });
    expect(m.get(vid)!.felder).toContain('name');
    e.undo.destroy();
  });

  it('vorWann', () => {
    expect(vorWann(0, 30_000)).toBe('gerade eben');
    expect(vorWann(0, 3 * 60_000 + 5000)).toBe('vor 3 Min.');
    expect(vorWann(0, 2 * 3600_000)).toBe('vor 2 Std.');
  });

  it('anwesend nur andere, nur frische, nur gleiche Übersicht', () => {
    const jetzt = Date.parse('2026-11-03T10:05:00Z');
    const l = [
      { id: 'ich', name: 'Ich', zeit: '2026-11-03T10:04:50Z', uebersichtId: 'u1' },
      { id: 'sk', name: 'Sabine K.', zeit: '2026-11-03T10:04:30Z', uebersichtId: 'u1' },
      { id: 'mb', name: 'Max B.', zeit: '2026-11-03T09:00:00Z', uebersichtId: 'u1' },
      { id: 'lw', name: 'Lea W.', zeit: '2026-11-03T10:04:30Z', uebersichtId: 'u2' },
    ];
    expect(anwesendIn(l, 'ich', 'u1', jetzt).map((p) => p.id)).toEqual(['sk']);
    expect(anwesendUeberall(l, 'ich', jetzt).map((p) => p.id)).toEqual(['sk', 'lw']);
  });
});

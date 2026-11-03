import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { istVerschluesselt, vtueInhalt, vtueLesen, vtueSchreiben, VtueFehler } from './vtue';
import { leseUebersicht, neuesDokument } from '../shared/editor/dokument';
import { neueUebersicht } from '../shared/modell/fabrik';
import { beispielAktuell } from '../shared/testdaten/beispiel';

const meta = { kunde: 'Familie Berger', kundeId: 'k1', uebersichtId: 'u1', titel: 'Jahresgespräch 2026', gespeichert: '2026-11-02T13:32:00.000Z', von: 'Tjark S.' };

function stand() {
  const u = neueUebersicht('k1', beispielAktuell());
  return { u, daten: Y.encodeStateAsUpdate(neuesDokument(u)) };
}

describe('.vtue-Datei (Bild 10)', () => {
  it('ohne Passwort: Stand bleibt gleich', () => {
    const { u, daten } = stand();
    const d = vtueLesen(vtueSchreiben(meta, daten));
    expect(istVerschluesselt(d)).toBe(false);
    const doc = new Y.Doc();
    Y.applyUpdate(doc, vtueInhalt(d)!);
    expect(leseUebersicht(doc).aktuell).toEqual(u.aktuell);
  });

  it('mit Passwort: Inhalt verschlüsselt, nur mit richtigem Passwort lesbar', () => {
    const { daten } = stand();
    const roh = vtueSchreiben(meta, daten, 'geheim123');
    expect(roh.toString('utf8')).not.toContain('Privathaftpflicht');
    expect(roh.toString('utf8')).toContain('Familie Berger'); // Kopf bleibt lesbar
    const d = vtueLesen(roh);
    expect(istVerschluesselt(d)).toBe(true);
    expect(vtueInhalt(d)).toBeNull();
    expect(vtueInhalt(d, 'falsch')).toBeNull();
    expect(vtueInhalt(d, 'geheim123')).toEqual(daten);
  });

  it('veränderter Kopf fällt auf (Prüfsumme)', () => {
    const { daten } = stand();
    const d = vtueLesen(vtueSchreiben(meta, daten, 'geheim123'));
    d.meta.kunde = 'Jemand anderes';
    expect(vtueInhalt(d, 'geheim123')).toBeNull();
  });

  it('erkennt fremde, beschädigte und zu neue Dateien', () => {
    expect(() => vtueLesen(Buffer.from('%PDF-1.7'))).toThrow(VtueFehler);
    expect(() => vtueLesen(Buffer.from(JSON.stringify({ format: 'vtue', version: 1, meta: {}, inhalt: '' })))).toThrow('beschädigt');
    expect(() => vtueLesen(Buffer.from(JSON.stringify({ format: 'vtue', version: 99, meta, inhalt: '' })))).toThrow('neueren Version');
  });
});

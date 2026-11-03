import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { aufgabenJeVertrag, aufgabenKurz, faelligKlasse, faelligText, gruppeVon, gruppiere, plusTage, schnellDatum, tageZwischen, wochenEnde, zaehleFaellige } from './aufgaben';
import { Editor } from '../editor/befehle';
import { neuesDokument } from '../editor/dokument';
import { neueAufgabe, neueUebersicht } from '../modell/fabrik';
import { beispielAktuell } from '../testdaten/beispiel';
import * as B from '../editor/bestand';

// Montag, 02.11.2026 wie in den Mockups
const HEUTE = '2026-11-02';

describe('Datum', () => {
  it('rechnet Tage und Wochenende', () => {
    expect(plusTage(HEUTE, 7)).toBe('2026-11-09');
    expect(plusTage('2026-12-31', 1)).toBe('2027-01-01');
    expect(tageZwischen(HEUTE, '2026-10-31')).toBe(-2);
    expect(wochenEnde(HEUTE)).toBe('2026-11-08');
    expect(wochenEnde('2026-11-08')).toBe('2026-11-08');
    expect(schnellDatum('morgen', HEUTE)).toBe('2026-11-03');
    expect(schnellDatum('woche', HEUTE)).toBe('2026-11-09');
  });
});

describe('Gruppen und Texte (Bild 1 v4, Bild 9)', () => {
  it('ordnet nach Fälligkeit', () => {
    expect(gruppeVon('2026-10-31', HEUTE)).toBe('ueberfaellig');
    expect(gruppeVon(HEUTE, HEUTE)).toBe('heute');
    expect(gruppeVon('2026-11-05', HEUTE)).toBe('woche');
    expect(gruppeVon('2026-11-13', HEUTE)).toBe('spaeter');
    expect(gruppeVon(null, HEUTE)).toBe('spaeter');
  });
  it('Texte wie im Mockup', () => {
    expect(faelligText('2026-10-31', HEUTE)).toBe('seit 2 Tagen');
    expect(faelligText('2026-11-01', HEUTE)).toBe('seit gestern');
    expect(faelligText(HEUTE, HEUTE)).toBe('heute');
    expect(faelligText('2026-11-05', HEUTE)).toBe('Do, 05.11.');
    expect(faelligText('2027-03-01', HEUTE)).toBe('01.03.2027');
    expect(faelligKlasse('2026-10-31', HEUTE)).toBe('over');
    expect(faelligKlasse(HEUTE, HEUTE)).toBe('today');
  });
  it('gruppiert sortiert, „Hoch“ zuerst, ohne Datum zuletzt', () => {
    const l = [
      { text: 'b', faellig: '2026-11-05' },
      { text: 'ohne', faellig: null },
      { text: 'a', faellig: HEUTE },
      { text: 'z', faellig: HEUTE, prioritaet: 'hoch' as const },
      { text: 'alt', faellig: '2026-10-01' },
      { text: 'spät', faellig: '2026-12-01' },
    ];
    const g = gruppiere(l, HEUTE);
    expect(g.map((x) => x.gruppe)).toEqual(['ueberfaellig', 'heute', 'woche', 'spaeter']);
    expect(g[1]!.aufgaben.map((a) => a.text)).toEqual(['z', 'a']);
    expect(g[3]!.aufgaben.map((a) => a.text)).toEqual(['spät', 'ohne']);
    expect(
      zaehleFaellige(
        [
          { erledigt: false, faellig: HEUTE },
          { erledigt: true, faellig: HEUTE },
          { erledigt: false, faellig: '2026-11-03' },
        ],
        HEUTE,
      ),
    ).toBe(1);
  });
});

describe('Aufgaben im Dokument', () => {
  const zeit = () => '2026-11-02T10:00:00.000Z';
  it('anlegen, ändern, erledigen, löschen mit Rückgängig', () => {
    const doc = neuesDokument(neueUebersicht('k1', beispielAktuell()));
    const ed = new Editor(doc, { zeit });
    const vw = ed.lesen().aktuell.bereiche.VERS.untergruppen[2]!.vertraege[0]!;
    const a = { ...neueAufgabe('Kfz-Angebot senden', '2026-10-31', 'Tjark S.'), prioritaet: 'hoch' as const, bezug: vw.id, zustaendig: 'Tjark S.' };
    ed.aufgabeAnlegen(a);
    expect(ed.lesen().aufgaben).toHaveLength(1);
    const kurz = aufgabenKurz(ed.lesen());
    expect(kurz[0]).toMatchObject({ text: 'Kfz-Angebot senden', bezugName: vw.name, prioritaet: 'hoch', zustaendig: 'Tjark S.' });
    expect(aufgabenJeVertrag(ed.lesen().aufgaben, HEUTE).get(vw.id)).toEqual({ n: 1, ueberfaellig: true, texte: ['Kfz-Angebot senden'] });

    ed.aufgabeAendern(a.id, { erledigt: true });
    expect(ed.lesen().aufgaben[0]).toMatchObject({ erledigt: true, erledigtAm: zeit() });
    expect(aufgabenJeVertrag(ed.lesen().aufgaben, HEUTE).size).toBe(0);
    ed.aufgabeAendern(a.id, { erledigt: false, prioritaet: undefined });
    expect(ed.lesen().aufgaben[0]!.erledigtAm).toBeUndefined();
    expect(ed.lesen().aufgaben[0]!.prioritaet).toBeUndefined();

    expect(ed.aufgabeLoeschen(a.id)?.text).toBe('Kfz-Angebot senden');
    expect(ed.lesen().aufgaben).toHaveLength(0);
    ed.rueckgaengig();
    expect(ed.lesen().aufgaben).toHaveLength(1);
  });
});

describe('Verzeichnis', () => {
  it('Kunde entfernen nimmt alle Übersichten mit', () => {
    const doc = new Y.Doc();
    const k = { id: 'k1', name: 'Familie Berger', erstellt: '2014-01-01T00:00:00Z', geaendert: '2014-01-01T00:00:00Z' };
    B.kundeEintragen(doc, k);
    const info = (id: string, geaendert: string) => ({ id, kundeId: 'k1', titel: id, erstellt: geaendert, geaendert, gesamtAktuell: 0, gesamtNeu: 0 });
    B.uebersichtEintragen(doc, info('u1', '2020-01-01T00:00:00Z'));
    B.uebersichtEintragen(doc, info('u2', '2026-10-14T00:00:00Z'));
    expect(B.letzteAenderung(B.leseBestand(doc), 'k1')).toBe('2026-10-14T00:00:00Z');
    B.uebersichtAktualisieren(doc, 'u1', { umgesetzt: '2020-02-01', aufgaben: [{ id: 'a', text: 'x', faellig: null, erledigt: false }] });
    expect(B.leseBestand(doc).uebersichten.find((u) => u.id === 'u1')).toMatchObject({ umgesetzt: '2020-02-01' });
    B.uebersichtAktualisieren(doc, 'u1', { umgesetzt: null });
    expect(B.leseBestand(doc).uebersichten.find((u) => u.id === 'u1')!.umgesetzt).toBeUndefined();
    expect(B.kundeEntfernen(doc, 'k1').sort()).toEqual(['u1', 'u2']);
    expect(B.leseBestand(doc)).toEqual({ kunden: [], uebersichten: [] });
  });
});

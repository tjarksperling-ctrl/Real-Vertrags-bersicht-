import { describe, expect, it } from 'vitest';
import { leereFassung, neueUebersicht, neuerKunde } from '../modell/fabrik';
import { neuesDokument } from '../editor/dokument';
import { Editor } from '../editor/befehle';
import { euroZuCent, jsonAusText, kiAntwortLesen, kiAuftrag, kiFelder, kiUebernehmen, schonVorhanden, untergruppeFinden, zahlweiseLesen } from './import';

const ANTWORT = `Hier ist das Ergebnis:
\`\`\`json
{"vertraege":[
 {"bereich":"VERS","untergruppe":"Wohnen","name":"Wohngebäude","bemerkung":"Einfamilienhaus Bj. 1998, inkl. Elementar","betrag":612.00,"zahlweise":"jährlich","unsicher":[],"hinweis":null},
 {"bereich":"VERS","untergruppe":"Kfz","name":"VW Golf","bemerkung":"VK 300 € / TK 150 €","betrag":"486,00 €","zahlweise":"1. Rate","unsicher":[],"hinweis":"Zahlweise unklar"},
 {"bereich":"VERS","untergruppe":"Wohnen","name":"Glasversicherung","bemerkung":"","betrag":24,"zahlweise":"jaehrlich","gekuendigt":true},
 {"bereich":"AV","untergruppe":"Familienabsicherung","name":"Berufsunfähigkeit","bemerkung":"BU-Rente 1.500 € mtl. bis 67","betrag":86.4,"zahlweise":"monatlich","leistung":{"betrag":1500,"art":"RENTE_MTL"},"laufzeitBis":"2058-06-30","unsicher":["betrag"]},
 {"bereich":"XYZ","name":"Unsinn"},
 {"bereich":"DARL","name":""}
]}
\`\`\``;

describe('KI-Import', () => {
  it('Auftrag ohne Kundendaten, mit festem Format', () => {
    const a = kiAuftrag();
    expect(a).toContain('"vertraege"');
    expect(a).toContain('KEINE Namen');
    expect(a).not.toMatch(/Berger|Familie /);
  });

  it('liest JSON auch mit Zaun und Text drumherum', () => {
    expect(jsonAusText('bla {"a":1} blub')).toEqual({ a: 1 });
    expect(() => jsonAusText('keine Daten')).toThrow(/keine auswertbare/);
    expect(() => jsonAusText('{"a":')).toThrow();
  });

  it('Beträge und Zahlweisen', () => {
    expect(euroZuCent(612)).toBe(61200);
    expect(euroZuCent(86.4)).toBe(8640);
    expect(euroZuCent('1.234,56 €')).toBe(123456);
    expect(euroZuCent('612.00')).toBe(61200);
    expect(euroZuCent(null)).toBeNull();
    expect(euroZuCent('abc')).toBeNull();
    expect(zahlweiseLesen('jährlich')).toBe('jaehrlich');
    expect(zahlweiseLesen('mtl.')).toBe('monatlich');
    expect(zahlweiseLesen('vierteljährlich')).toBe('vierteljaehrlich');
    expect(zahlweiseLesen('1. Rate')).toBeNull();
  });

  it('prüft die Antwort und lässt Unbrauchbares weg', () => {
    const l = kiAntwortLesen(ANTWORT, 'Police.pdf');
    expect(l.map((v) => v.name)).toEqual(['Wohngebäude', 'VW Golf', 'Glasversicherung', 'Berufsunfähigkeit']);
    expect(l[0]).toMatchObject({ nr: 1, betrag: 61200, zahlweise: 'jaehrlich', auswahl: true, quelle: 'Police.pdf' });
    expect(l[1]).toMatchObject({ betrag: 48600, zahlweise: 'jaehrlich', unsicher: ['zahlweise'], hinweis: 'Zahlweise unklar' });
    expect(l[2]).toMatchObject({ auswahl: false, hinweis: 'Vermutlich bereits gekündigt – daher nicht ausgewählt.' });
    expect(l[3]).toMatchObject({ bereich: 'AV', betrag: 8640, leistung: { betrag: 150000, art: 'RENTE_MTL' }, laufzeitBis: '2058-06-30', unsicher: ['betrag'] });
  });

  it('ordnet Untergruppen zu und übernimmt nur Ausgewähltes nach „Aktuell“', () => {
    const u = neueUebersicht(neuerKunde('X').id, leereFassung());
    const doc = neuesDokument(u);
    const e = new Editor(doc);
    const wohnen = e.untergruppeAnlegen('aktuell', 'VERS', 'Wohnen', 'home');
    const l = kiAntwortLesen(ANTWORT);
    const f = e.lesen().aktuell;
    expect(untergruppeFinden(f, l[0]!)).toEqual({ id: wohnen, name: 'Wohnen' });
    expect(untergruppeFinden(f, l[1]!)).toBeNull();
    const n = kiUebernehmen(e, l, (v) => {
      const z = untergruppeFinden(e.lesen().aktuell, v);
      return z ? { id: z.id } : { neu: v.untergruppe };
    });
    expect(n).toBe(3);
    const a = e.lesen().aktuell;
    expect(a.bereiche.VERS.untergruppen.map((x) => x.name)).toEqual(['Wohnen', 'Kfz']);
    expect(a.bereiche.VERS.untergruppen[0]!.vertraege.map((x) => x.name)).toEqual(['Wohngebäude']);
    expect(a.bereiche.AV.untergruppen[0]!.vertraege[0]).toMatchObject({ name: 'Berufsunfähigkeit', beitrag: 8640, leistung: { betrag: 150000 } });
    // „Neu“ bekommt sie über die Übernahme-Regel mit
    expect(e.lesen().neu.bereiche.VERS.untergruppen.some((x) => x.vertraege.some((v) => v.name === 'Wohngebäude'))).toBe(true);
    e.undo.destroy();
  });

  it('schon vorhandene Verträge werden nicht vorausgewählt', () => {
    const u = neueUebersicht(neuerKunde('X').id, leereFassung());
    const e = new Editor(neuesDokument(u));
    const ug = e.untergruppeAnlegen('aktuell', 'VERS', 'Wohnen', 'home');
    e.vertragAnlegen('aktuell', ug, undefined, { name: 'Wohngebäude' });
    const [a, b] = kiAntwortLesen(ANTWORT);
    expect(schonVorhanden(e.lesen().aktuell, a!)).toMatchObject({ auswahl: false, hinweis: 'Gibt es schon in „Aktuell“ (Wohnen) – daher nicht ausgewählt.' });
    expect(schonVorhanden(e.lesen().aktuell, b!)).toBe(b);
    e.undo.destroy();
  });

  it('Felder je Bereich', () => {
    const [v] = kiAntwortLesen('{"vertraege":[{"bereich":"DARL","name":"Baufinanzierung","betrag":950,"restschuld":"180.000,00","zinsbindungBis":"2031-04-01","zahlweise":"monatlich"}]}');
    expect(kiFelder(v!)).toEqual({ name: 'Baufinanzierung', bemerkung: '', zahlweise: 'monatlich', rate: 95000, restschuld: 18000000, zinsbindungBis: '2031-04' });
  });
});

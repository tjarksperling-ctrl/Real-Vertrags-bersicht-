import * as Y from 'yjs';
import { Editor } from './befehle';
import { leseUebersicht, neuesDokument } from './dokument';
import { neueUebersicht } from '../modell/fabrik';
import { AGENTUR_STANDARD, JUNGE_FAMILIE } from '../modell/vorlagen';
import { beispielAktuell } from '../testdaten/beispiel';
import { fassungSumme } from '../rechnen/summen';
import type { Uebersicht } from '../modell/typen';

function editor(u: Uebersicht = neueUebersicht('k1', beispielAktuell())) {
  return new Editor(neuesDokument(u), { zeit: () => '2026-11-02T10:00:00.000Z' });
}

const vers = (e: Editor, f: 'aktuell' | 'neu' = 'aktuell') => e.lesen()[f].bereiche.VERS.untergruppen;

describe('Dokument', () => {
  it('liest eine geschriebene Übersicht unverändert zurück', () => {
    const u = neueUebersicht('k1', beispielAktuell());
    u.titel = 'Jahresgespräch 2026';
    u.vorteile = { aktiv: true, stichpunkte: ['Günstiger'] };
    expect(leseUebersicht(neuesDokument(u))).toEqual(u);
  });

  it('Beispielkunde ergibt die Mockup-Summe 2.033,25 €', () => {
    expect(fassungSumme(editor().lesen().aktuell).gesamtMonat).toBe(203325);
  });

  it('überlebt Speichern und Laden als Yjs-Update', () => {
    const e = editor();
    e.vertragAendern('aktuell', vers(e)[0]!.vertraege[0]!.id, 'beitrag', 9000);
    const kopie = new Y.Doc();
    Y.applyUpdate(kopie, Y.encodeStateAsUpdate(e.doc));
    expect(leseUebersicht(kopie)).toEqual(e.lesen());
  });
});

describe('Untergruppen', () => {
  it('anlegen, umbenennen, Symbol ändern, löschen', () => {
    const e = editor();
    const id = e.untergruppeAnlegen('aktuell', 'VERS', 'Gesundheit', 'activity');
    expect(vers(e).map((u) => u.name)).toEqual(['Haftpflicht & Recht', 'Wohnen', 'Kfz', 'Gesundheit']);
    e.untergruppeAendern('aktuell', id, { name: 'Gesundheit & Pflege', symbol: 'heart' });
    expect(vers(e)[3]).toMatchObject({ name: 'Gesundheit & Pflege', symbol: 'heart' });
    expect(e.untergruppeLoeschen('aktuell', id)).toEqual({ name: 'Gesundheit & Pflege', vertraege: 0 });
    expect(vers(e)).toHaveLength(3);
  });

  it('verschieben innerhalb des Bereichs (Kfz nach oben)', () => {
    const e = editor();
    e.untergruppeVerschieben('aktuell', vers(e)[2]!.id, 1);
    expect(vers(e).map((u) => u.name)).toEqual(['Haftpflicht & Recht', 'Kfz', 'Wohnen']);
    expect(vers(e)[1]!.vertraege[0]!.name).toBe('VW Golf');
  });
});

describe('Verträge', () => {
  it('anlegen mit Werten, ändern, löschen', () => {
    const e = editor();
    const kfz = vers(e)[2]!;
    const id = e.vertragAnlegen('aktuell', kfz.id, undefined, { name: 'Motorrad', beitrag: 12000, zahlweise: 'jaehrlich' })!;
    expect(vers(e)[2]!.vertraege[1]).toMatchObject({ id, name: 'Motorrad', beitrag: 12000, zahlweise: 'jaehrlich' });
    e.vertragAendern('aktuell', id, 'bemerkung', 'Saison 03–10\nTeilkasko');
    expect(vers(e)[2]!.vertraege[1]!.bemerkung).toBe('Saison 03–10\nTeilkasko');
    expect(e.vertragLoeschen('aktuell', id)).toEqual({ name: 'Motorrad' });
    expect(vers(e)[2]!.vertraege).toHaveLength(1);
  });

  it('AV-Leistung: Betrag und Art einzeln änderbar', () => {
    const e = editor();
    const v = e.lesen().aktuell.bereiche.AV.untergruppen[0]!.vertraege[0]!;
    e.vertragAendern('aktuell', v.id, 'leistung.art', 'KAPITAL');
    e.vertragAendern('aktuell', v.id, 'leistung.betrag', 5000000);
    expect(e.lesen().aktuell.bereiche.AV.untergruppen[0]!.vertraege[0]!.leistung).toEqual({ betrag: 5000000, art: 'KAPITAL' });
  });

  it('verschieben in eine andere Untergruppe desselben Bereichs', () => {
    const e = editor();
    const golf = vers(e)[2]!.vertraege[0]!;
    e.vertragVerschieben('aktuell', golf.id, vers(e)[0]!.id, 1);
    expect(vers(e)[0]!.vertraege.map((v) => v.name)).toEqual(['Privathaftpflicht', 'VW Golf', 'Rechtsschutz']);
    expect(vers(e)[2]!.vertraege).toHaveLength(0);
  });

  it('verschieben in einen anderen Bereich ist nicht möglich', () => {
    const e = editor();
    const golf = vers(e)[2]!.vertraege[0]!;
    e.vertragVerschieben('aktuell', golf.id, e.lesen().aktuell.bereiche.SPAR.untergruppen[0]!.id, 0);
    expect(vers(e)[2]!.vertraege[0]!.id).toBe(golf.id);
  });

  it('sortieren innerhalb der Untergruppe', () => {
    const e = editor();
    const [a, b] = vers(e)[0]!.vertraege;
    e.vertragVerschieben('aktuell', a!.id, vers(e)[0]!.id, 1);
    expect(vers(e)[0]!.vertraege.map((v) => v.id)).toEqual([b!.id, a!.id]);
  });
});

describe('Bereiche', () => {
  it('abwählen nimmt den Bereich aus dem Gesamtbetrag (Bild 13: 594,25 €)', () => {
    const e = editor();
    e.bereichAktiv('aktuell', 'DARL', false);
    expect(fassungSumme(e.lesen().aktuell).gesamtMonat).toBe(59425);
    expect(e.lesen().aktuell.bereiche.DARL.untergruppen).toHaveLength(2); // Daten bleiben
  });
});

describe('Rückgängig / Wiederholen (Festlegung 3)', () => {
  it('jede Änderung ist ein Schritt', () => {
    const e = editor();
    const id = vers(e)[0]!.vertraege[0]!.id;
    e.vertragAendern('aktuell', id, 'beitrag', 1);
    e.vertragAendern('aktuell', id, 'beitrag', 2);
    e.rueckgaengig();
    expect(vers(e)[0]!.vertraege[0]!.beitrag).toBe(1);
    e.rueckgaengig();
    expect(vers(e)[0]!.vertraege[0]!.beitrag).toBe(8940);
    e.wiederholen();
    expect(vers(e)[0]!.vertraege[0]!.beitrag).toBe(1);
  });

  it('Löschen, Verschieben und Abwählen lassen sich zurücknehmen', () => {
    const e = editor();
    const vorher = e.lesen();
    e.untergruppeLoeschen('aktuell', vers(e)[1]!.id);
    e.untergruppeVerschieben('aktuell', vers(e)[1]!.id, 0);
    e.bereichAktiv('aktuell', 'SPAR', false);
    e.rueckgaengig();
    e.rueckgaengig();
    e.rueckgaengig();
    expect(e.lesen()).toEqual(vorher);
  });

  it('nimmt nur eigene Änderungen zurück, nie die anderer', () => {
    const e = editor();
    const fremd = new Y.Doc();
    Y.applyUpdate(fremd, Y.encodeStateAsUpdate(e.doc));
    const id = vers(e)[0]!.vertraege[0]!.id;
    e.vertragAendern('aktuell', id, 'beitrag', 1000);
    // Kollegin ändert einen anderen Vertrag
    const andere = new Editor(fremd);
    andere.vertragAendern('aktuell', vers(andere)[0]!.vertraege[1]!.id, 'beitrag', 7777);
    Y.applyUpdate(e.doc, Y.encodeStateAsUpdate(fremd), 'fremd');
    e.rueckgaengig();
    expect(vers(e)[0]!.vertraege[0]!.beitrag).toBe(8940);
    expect(vers(e)[0]!.vertraege[1]!.beitrag).toBe(7777);
  });
});

describe('Sync „In Neu übernehmen“ (Bild 14 v2)', () => {
  it('an: Änderung in Aktuell steht sofort auch in Neu', () => {
    const e = editor();
    const hausrat = vers(e)[1]!.vertraege[0]!;
    e.vertragAendern('aktuell', hausrat.id, 'beitrag', 15840);
    expect(vers(e, 'neu')[1]!.vertraege[0]!.beitrag).toBe(15840);
  });

  it('an: in Neu selbst geänderte Werte bleiben (Wohngebäude 540,00 €)', () => {
    const e = editor();
    const wg = vers(e)[1]!.vertraege[1]!;
    e.vertragAendern('neu', vers(e, 'neu')[1]!.vertraege[1]!.id, 'beitrag', 54000);
    e.vertragAendern('aktuell', wg.id, 'beitrag', 65000);
    expect(vers(e, 'neu')[1]!.vertraege[1]!.beitrag).toBe(54000);
    // andere Felder desselben Vertrags werden weiter übernommen
    e.vertragAendern('aktuell', wg.id, 'bemerkung', 'neu verhandelt');
    expect(vers(e, 'neu')[1]!.vertraege[1]!.bemerkung).toBe('neu verhandelt');
  });

  it('an: anlegen, verschieben, löschen und abwählen werden übernommen', () => {
    const e = editor();
    const ug = e.untergruppeAnlegen('aktuell', 'VERS', 'Gesundheit', 'activity', 1);
    expect(vers(e, 'neu').map((u) => u.name)).toEqual(['Haftpflicht & Recht', 'Gesundheit', 'Wohnen', 'Kfz']);
    expect(vers(e, 'neu')[1]!.quelleId).toBe(ug);
    const v = e.vertragAnlegen('aktuell', ug, 0, { name: 'Zahnzusatz', beitrag: 1990 })!;
    expect(vers(e, 'neu')[1]!.vertraege[0]).toMatchObject({ name: 'Zahnzusatz', beitrag: 1990, quelleId: v });
    e.untergruppeVerschieben('aktuell', ug, 3);
    expect(vers(e, 'neu').map((u) => u.name)).toEqual(['Haftpflicht & Recht', 'Wohnen', 'Kfz', 'Gesundheit']);
    e.vertragVerschieben('aktuell', v, vers(e)[0]!.id, 0);
    expect(vers(e, 'neu')[0]!.vertraege[0]!.name).toBe('Zahnzusatz');
    e.vertragLoeschen('aktuell', v);
    expect(vers(e, 'neu')[0]!.vertraege.map((x) => x.name)).toEqual(['Privathaftpflicht', 'Rechtsschutz']);
    e.bereichAktiv('aktuell', 'DARL', false);
    expect(e.lesen().neu.bereiche.DARL.aktiv).toBe(false);
  });

  it('in Neu gelöschte Elemente werden nicht wieder angelegt', () => {
    const e = editor();
    const golf = vers(e)[2]!.vertraege[0]!;
    e.vertragLoeschen('neu', vers(e, 'neu')[2]!.vertraege[0]!.id);
    e.vertragAendern('aktuell', golf.id, 'beitrag', 50000);
    expect(vers(e, 'neu')[2]!.vertraege).toHaveLength(0);
  });

  it('aus: nichts wird übertragen – auch nicht nach dem Wiedereinschalten', () => {
    const e = editor();
    e.syncSetzen(false, 'Tjark S.');
    expect(e.lesen()).toMatchObject({ syncAktiv: false, syncAusSeit: '2026-11-02T10:00:00.000Z', syncAusVon: 'Tjark S.' });
    const hausrat = vers(e)[1]!.vertraege[0]!;
    e.vertragAendern('aktuell', hausrat.id, 'beitrag', 15840);
    e.untergruppeAnlegen('aktuell', 'VERS', 'Gesundheit', 'activity');
    e.syncSetzen(true);
    expect(vers(e, 'neu')[1]!.vertraege[0]!.beitrag).toBe(14520);
    expect(vers(e, 'neu')).toHaveLength(3);
    // ab jetzt wird wieder übertragen (der Wert in Neu entspricht nicht mehr dem alten in Aktuell → bleibt)
    e.vertragAendern('aktuell', vers(e)[0]!.vertraege[0]!.id, 'beitrag', 9900);
    expect(vers(e, 'neu')[0]!.vertraege[0]!.beitrag).toBe(9900);
  });

  it('Rückgängig nimmt die Änderung in Aktuell und Neu gemeinsam zurück', () => {
    const e = editor();
    e.untergruppeLoeschen('aktuell', vers(e)[0]!.id);
    expect(vers(e, 'neu')).toHaveLength(2);
    e.rueckgaengig();
    expect(vers(e)).toHaveLength(3);
    expect(vers(e, 'neu')).toHaveLength(3);
  });

  it('Änderungen in Neu wirken nie auf Aktuell', () => {
    const e = editor();
    e.vertragAendern('neu', vers(e, 'neu')[0]!.vertraege[0]!.id, 'beitrag', 1);
    e.bereichAktiv('neu', 'SPAR', false);
    expect(vers(e)[0]!.vertraege[0]!.beitrag).toBe(8940);
    expect(e.lesen().aktuell.bereiche.SPAR.aktiv).toBe(true);
  });
});

describe('Neu wieder wie Aktuell, Vorlagen, Titel', () => {
  it('überschreibt Neu komplett, mit Rückgängig', () => {
    const e = editor();
    e.vertragAendern('neu', vers(e, 'neu')[0]!.vertraege[0]!.id, 'beitrag', 1);
    const vorher = e.lesen().neu;
    e.neuWieAktuell();
    expect(vers(e, 'neu')[0]!.vertraege[0]!.beitrag).toBe(8940);
    expect(vers(e, 'neu')[0]!.quelleId).toBe(vers(e)[0]!.id);
    e.rueckgaengig();
    expect(e.lesen().neu).toEqual(vorher);
  });

  it('Vorlage anwenden legt Bereiche und Untergruppen in Aktuell und Neu an', () => {
    const e = editor(neueUebersicht('k1'));
    e.vorlageAnwenden(JUNGE_FAMILIE);
    const u = e.lesen();
    expect(u.aktuell.bereiche.DARL.aktiv).toBe(false);
    expect(u.aktuell.bereiche.VERS.untergruppen.map((x) => x.name)).toContain('Gesundheit');
    expect(u.neu.bereiche.VERS.untergruppen[0]!.quelleId).toBe(u.aktuell.bereiche.VERS.untergruppen[0]!.id);
    e.vorlageAnwenden(AGENTUR_STANDARD);
    expect(e.lesen().aktuell.bereiche.DARL.aktiv).toBe(true);
  });

  it('Titel, Ersparnis-Schalter und Vorteile', () => {
    const e = editor();
    e.titelAendern('  Jahresgespräch 2026 ');
    e.ersparnisAnzeigen(false);
    e.vorteileAktiv(true);
    e.stichpunktAnlegen('Gleiche Leistung, günstiger');
    e.stichpunktAnlegen('Elementarschutz');
    e.stichpunktAendern(1, 'Elementarschutz neu');
    e.stichpunktLoeschen(0);
    const u = e.lesen();
    expect(u.titel).toBe('Jahresgespräch 2026');
    expect(u.ersparnisAnzeigen).toBe(false);
    expect(u.vorteile).toEqual({ aktiv: true, stichpunkte: ['Elementarschutz neu'] });
    expect(u.geaendert).toBe('2026-11-02T10:00:00.000Z');
  });
});

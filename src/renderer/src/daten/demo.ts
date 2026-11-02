/** Vorführdaten wie in den freigegebenen Mockups (nur mit VTUE_DEMO=1, z. B. für Screenshots). */
import {
  AGENTUR_STANDARD,
  JUNGE_FAMILIE,
  fassungAusVorlage,
  neuerKunde,
  neueUebersicht,
  type Fassung,
  type Kunde,
  type Uebersicht,
} from '../../../shared';
import { beispielAktuell } from '../../../shared/testdaten/beispiel';
import { kopiereFassung } from '../../../shared/fassung/kopieren';

const BEMERKUNGEN: Record<string, string> = {
  Privathaftpflicht: 'Familientarif, Deckung 10 Mio. €\nSelbstbeteiligung 150 €',
  Rechtsschutz: 'Privat, Beruf, Verkehr',
  Hausrat: '110 m², inkl. Fahrraddiebstahl',
  Wohngebäude: 'Einfamilienhaus Bj. 1998, inkl. Elementar',
  'VW Golf': 'VK 300 € / TK 150 €, SF 12',
  'ETF-Sparplan': 'MSCI World, thesaurierend',
  Mischfonds: 'Einmalanlage aus Erbschaft',
  Bausparvertrag: 'Bausparsumme 50.000 €',
  Annuitätendarlehen: 'Sparkasse, Sollzins 3,1 % fest',
  Autokredit: 'Restlaufzeit 28 Monate',
  'Private Rente': 'Garantierente, Beitragsdynamik 3 %',
  Basisrente: 'Einmalbeitrag 2025, steuerlich gefördert',
  Risikolebensversicherung: 'Verbunden, fallende Summe\n(Absicherung Immobiliendarlehen)',
  Berufsunfähigkeit: 'Max, BU-Rente bis 67',
};

/** Änderungen in „Neu“ wie Bild 3 (Beitrag in Cent, Bemerkung). */
const NEU_AENDERUNGEN: Record<string, [number, string]> = {
  Rechtsschutz: [2890, 'Privat, Beruf, Verkehr\nohne Selbstbeteiligung'],
  Wohngebäude: [54000, 'Neuer Tarif, gleiche Leistung inkl. Elementar'],
  'VW Golf': [43200, 'VK 300 € / TK 150 €, SF 12, Werkstattbindung'],
  Berufsunfähigkeit: [7960, 'Max, BU-Rente bis 67\nVerzicht auf abstrakte Verweisung'],
};

export const VORTEILE_BERGER = [
  'Wohngebäude: gleiche Leistung inkl. Elementarschutz, 72 € günstiger im Jahr',
  'Kfz: Werkstattbindung bei gleicher Deckung, 108 € Ersparnis im Jahr',
  'Rechtsschutz: Selbstbeteiligung entfällt',
  'Berufsunfähigkeit: bessere Bedingungen bei niedrigerem Beitrag',
];

function jedenVertrag(f: Fassung, fn: (v: { name: string; bemerkung: string } & Record<string, unknown>) => void): void {
  for (const b of Object.values(f.bereiche)) for (const ug of b.untergruppen) for (const v of ug.vertraege) fn(v as never);
}

export function bergerAktuell(): Fassung {
  const f = beispielAktuell();
  jedenVertrag(f, (v) => (v.bemerkung = BEMERKUNGEN[v.name] ?? ''));
  return f;
}

export interface DemoKunde {
  kunde: Kunde;
  uebersicht: Uebersicht;
}

function tageZurueck(n: number, stunde = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(stunde, 12, 0, 0);
  return d.toISOString();
}

export function demoKunden(): DemoKunde[] {
  const liste: DemoKunde[] = [];
  const add = (name: string, titel: string, aktuell: Fassung, alter: number, neuAnpassen?: (f: Fassung) => void) => {
    const kunde = neuerKunde(name);
    const u = neueUebersicht(kunde.id, aktuell);
    u.titel = titel;
    if (neuAnpassen) neuAnpassen(u.neu);
    u.geaendert = kunde.geaendert = tageZurueck(alter);
    liste.push({ kunde, uebersicht: u });
    return u;
  };
  const berger = add('Familie Berger', 'Jahresgespräch 2026', bergerAktuell(), 0, (neu) =>
    jedenVertrag(neu, (v) => {
      const a = NEU_AENDERUNGEN[v.name];
      if (a) [v['beitrag'], v.bemerkung] = a;
    }),
  );
  berger.vorteile = { aktiv: true, stichpunkte: [...VORTEILE_BERGER] };
  const einfach = (vorlage = AGENTUR_STANDARD) => {
    const f = fassungAusVorlage(vorlage);
    const ug = f.bereiche.VERS.untergruppen[0]!;
    const v = { ...kopiereFassung(beispielAktuell()).bereiche.VERS.untergruppen[0]!.vertraege[0]! };
    delete v.quelleId;
    ug.vertraege.push(v as never);
    return f;
  };
  add('Jonas & Mira Albers', 'Baufinanzierung 2026', einfach(JUNGE_FAMILIE), 7);
  add('Elif Yılmaz', 'Jahresgespräch 2026', einfach(), 11);
  add('Thomas Brandt', 'Jahresgespräch 2026', einfach(), 4);
  add('Andreas Köhler', 'Erstberatung 2026', einfach(), 1);
  add('Lea Nowak', 'Jahresgespräch 2026', einfach(), 0.2);
  add('Katharina Vogt', 'Jahresgespräch 2026', einfach(), 6);
  add('Familie Schreiber', 'Erstberatung 2026', einfach(JUNGE_FAMILIE), 20);
  return liste;
}

/** Vorführdaten wie in den freigegebenen Mockups (nur mit VTUE_DEMO=1, z. B. für Screenshots). */
import {
  AGENTUR_STANDARD,
  JUNGE_FAMILIE,
  fassungAusVorlage,
  heuteDatum,
  neueAufgabe,
  neuerKunde,
  plusTage,
  type Aufgabe,
  type Einstellungen,
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
  /** Wer zuletzt geändert hat. */
  von?: string;
  /** „Umgesetzt“ am (Kundenakte). */
  umgesetzt?: string;
}

export const DEMO_TEAM = ['Sabine K.', 'Markus B.'];

/** Aufgabe relativ zu heute (Tage), wie in Bild 1 v4 / Bild 9. */
function aufgabe(text: string, tage: number | null, wer: string, extra: Partial<Aufgabe> = {}): Aufgabe {
  const heute = heuteDatum();
  return { ...neueAufgabe(text, tage === null ? null : plusTage(heute, tage), wer), zustaendig: wer, ...extra };
}

/** Wochentag-unabhängig: Tage bis „diese Woche“ (mind. morgen, höchstens Sonntag). */
function dieseWoche(n: number): number {
  const tag = new Date().getDay() || 7; // Mo=1 … So=7
  return Math.max(1, Math.min(n, 7 - tag)) || 1;
}

function vertragId(f: Fassung, name: string): string | undefined {
  for (const b of Object.values(f.bereiche)) for (const ug of b.untergruppen) for (const v of ug.vertraege) if (v.name === name) return v.id;
  return undefined;
}

function tageZurueck(n: number, stunde = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(stunde, 12, 0, 0);
  return d.toISOString();
}

export function demoKunden(): DemoKunde[] {
  const liste: DemoKunde[] = [];
  const add = (name: string | Kunde, titel: string, aktuell: Fassung, alter: number, neuAnpassen?: (f: Fassung) => void, von?: string) => {
    const kunde = typeof name === 'string' ? neuerKunde(name) : name;
    const u = neueUebersicht(kunde.id, aktuell);
    u.titel = titel;
    if (neuAnpassen) neuAnpassen(u.neu);
    u.geaendert = tageZurueck(alter);
    if (u.geaendert > kunde.geaendert || typeof name === 'string') kunde.geaendert = u.geaendert;
    u.erstellt = tageZurueck(alter + 19);
    const d: DemoKunde = { kunde, uebersicht: u };
    if (von) d.von = von;
    liste.push(d);
    return u;
  };
  const berger = add('Familie Berger', 'Jahresgespräch 2026', bergerAktuell(), 0, (neu) =>
    jedenVertrag(neu, (v) => {
      const a = NEU_AENDERUNGEN[v.name];
      if (a) [v['beitrag'], v.bemerkung] = a;
    }),
  );
  berger.vorteile = { aktiv: true, stichpunkte: [...VORTEILE_BERGER] };
  const bk = liste[0]!.kunde;
  bk.erstellt = '2014-03-12T09:00:00.000Z';
  const ich = 'Tjark S.';
  berger.aufgaben = [
    aufgabe('Kfz-Angebot senden', -2, ich, { prioritaet: 'hoch', bezug: vertragId(berger.aktuell, 'VW Golf')! }),
    aufgabe('BU-Unterlagen prüfen', dieseWoche(3), 'Sabine K.', { bezug: vertragId(berger.aktuell, 'Berufsunfähigkeit')! }),
    ...['Termin vereinbaren', 'Unterlagen anfordern', 'Angebot Wohngebäude einholen', 'Kfz-Schadenfreiheit prüfen', 'Vollmacht einholen'].map((t, i) => ({
      ...aufgabe(t, -10 - i, ich),
      erledigt: true,
      erledigtAm: tageZurueck(8 + i),
    })),
  ];
  // ältere Übersichten für die Kundenakte (Bild 1b)
  const alt = (titel: string, tage: number, umgesetzt: string) => {
    const u = add(bk, titel, bergerAktuell(), tage);
    liste[liste.length - 1]!.umgesetzt = umgesetzt;
    return u;
  };
  alt('Anschlussfinanzierung Haus', 158, '2026-05-28').aufgaben = [aufgabe('Zinsbindung Bausparvertrag prüfen', 118, ich)];
  alt('Jahresgespräch 2024', 694, '2024-12-09');
  alt('Kfz-Wechsel', 1356, '2023-02-15');
  alt('Jahresgespräch 2021', 1793, '2021-12-06');
  const einfach = (vorlage = AGENTUR_STANDARD) => {
    const f = fassungAusVorlage(vorlage);
    const ug = f.bereiche.VERS.untergruppen[0]!;
    const v = { ...kopiereFassung(beispielAktuell()).bereiche.VERS.untergruppen[0]!.vertraege[0]! };
    delete v.quelleId;
    ug.vertraege.push(v as never);
    return f;
  };
  add('Jonas & Mira Albers', 'Baufinanzierung 2026', einfach(JUNGE_FAMILIE), 7, undefined, 'Sabine K.').aufgaben = [aufgabe('Termin Baufinanzierung vorbereiten', dieseWoche(3), ich)];
  add('Elif Yılmaz', 'Jahresgespräch 2026', einfach(), 11).aufgaben = [aufgabe('Hausrat-Angebot nachfassen', dieseWoche(4), ich), aufgabe('Rentenlücke berechnen', 16, ich)];
  add('Thomas Brandt', 'Jahresgespräch 2026', einfach(), 4).aufgaben = [aufgabe('Unterlagen BU-Antrag anfordern', 0, ich, { prioritaet: 'hoch' })];
  add('Andreas Köhler', 'Erstberatung 2026', einfach(), 1, undefined, 'Sabine K.');
  add('Lea Nowak', 'Jahresgespräch 2026', einfach(), 0.2).aufgaben = [aufgabe('Rückruf wegen Bausparvertrag', 0, ich), aufgabe('Riester-Zulagenantrag', 24, 'Markus B.')];
  add('Katharina Vogt', 'Jahresgespräch 2026', einfach(), 6);
  add('Familie Schreiber', 'Erstberatung 2026', einfach(JUNGE_FAMILIE), 20);
  return liste;
}

/** Einstellungen der Vorführung: Team, Schnellstart und Angepinnt wie Bild 1 v4 / Bild 8. */
export function demoEinstellungen(e: Einstellungen, angepinnt: string[]): Einstellungen {
  const link = (name: string, symbol: string, farbe: string, ziel: string, beschreibung?: string) => ({
    id: globalThis.crypto.randomUUID(),
    name,
    symbol,
    farbe,
    ziel,
    ...(beschreibung ? { beschreibung } : {}),
  });
  return {
    ...e,
    team: DEMO_TEAM.map((name) => ({ id: globalThis.crypto.randomUUID(), name })),
    angepinnt,
    schnellstart: [
      link('Outlook', 'mail', '#0a64d0', 'https://outlook.office.com/mail/', 'Microsoft Outlook'),
      link('Teams', 'chat', '#4b53bc', 'https://teams.microsoft.com/', 'Microsoft Teams'),
      link('Kalender', 'calendar', '#d63a5a', 'https://outlook.office.com/calendar/', 'Outlook-Kalender'),
      link('Maklerportal', 'globe', '#5e5ce6', 'https://www.maklerportal.de/login'),
      link('Vergleichsrechner', 'calc', '#c77800', 'https://www.vergleich.de/makler'),
      link('Tarifrechner Kfz', 'car', '#1f8a4c', 'https://www.kfz-tarif.de'),
      link('Bank-Portal', 'bank', '#1f7f95', 'https://www.bank-partner.de/finanzierung'),
    ],
  };
}

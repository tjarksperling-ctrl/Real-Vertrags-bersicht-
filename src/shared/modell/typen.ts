/**
 * Datenmodell der Vertragsübersicht.
 *
 * Grundsätze:
 * - Beträge sind immer ganze Cent (`Cent`), nie Kommazahlen.
 * - Ein leeres Betragsfeld ist `null` und zählt in Summen als 0.
 * - Reihenfolge = Position im Array (passt zu Yjs, kein eigenes Feld).
 * - `quelleId` verbindet ein Element in „Neu“ mit seinem Ursprung in „Aktuell“ (Sync).
 */

/** Ganzzahliger Betrag in Cent. */
export type Cent = number;

/** Optionaler Betrag: `null` = Feld leer. */
export type Betrag = Cent | null;

/** Kalenderdatum im Format JJJJ-MM-TT. */
export type Datum = string;

/** Monat im Format JJJJ-MM (z. B. Zinsbindung, Anzeige MM/JJJJ). */
export type Monat = string;

/** Zeitstempel im ISO-Format (UTC). */
export type Zeitstempel = string;

export type Id = string;

export const ZAHLWEISEN = ['monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich', 'einmalig'] as const;
export type Zahlweise = (typeof ZAHLWEISEN)[number];

export const BEREICH_TYPEN = ['VERS', 'SPAR', 'DARL', 'AV'] as const;
export type BereichTyp = (typeof BEREICH_TYPEN)[number];

export const LEISTUNGSARTEN = ['RENTE_MTL', 'KAPITAL', 'GUTHABEN', 'TODESFALL'] as const;
export type Leistungsart = (typeof LEISTUNGSARTEN)[number];

/** Name eines Symbols (Lucide-Name, z. B. „shield“). */
export type Symbol = string;

// ---------------------------------------------------------------- Kunde

export interface Kunde {
  id: Id;
  /** Einzige gespeicherte Kundenangabe (Datensparsamkeit). */
  name: string;
  erstellt: Zeitstempel;
  geaendert: Zeitstempel;
}

// ---------------------------------------------------------------- Verträge

interface VertragBasis {
  id: Id;
  quelleId?: Id;
  name: string;
  /** Mehrzeilig, wird nie abgeschnitten. */
  bemerkung: string;
}

export interface VertragVERS extends VertragBasis {
  beitrag: Betrag;
  zahlweise: Zahlweise;
}

export interface VertragSPAR extends VertragBasis {
  sparrate: Betrag;
  zahlweise: Zahlweise;
  einmalbetrag: Betrag;
  guthaben: Betrag;
  /** Wertentwicklung in Cent, darf negativ sein. */
  wertentwicklung: Betrag;
}

export interface VertragDARL extends VertragBasis {
  /** Rate/Tilgung. */
  rate: Betrag;
  zahlweise: Zahlweise;
  restschuld: Betrag;
  zinsbindungBis: Monat | null;
}

export interface Leistung {
  betrag: Betrag;
  art: Leistungsart;
}

export interface VertragAV extends VertragBasis {
  beitrag: Betrag;
  einmalbeitrag: Betrag;
  zahlweise: Zahlweise;
  leistung: Leistung;
  laufzeitBis: Datum | null;
}

export interface VertragJeTyp {
  VERS: VertragVERS;
  SPAR: VertragSPAR;
  DARL: VertragDARL;
  AV: VertragAV;
}

export type Vertrag = VertragJeTyp[BereichTyp];

// ---------------------------------------------------------------- Struktur

export interface Untergruppe<T extends BereichTyp = BereichTyp> {
  id: Id;
  quelleId?: Id;
  name: string;
  symbol: Symbol;
  vertraege: VertragJeTyp[T][];
}

export interface Bereich<T extends BereichTyp = BereichTyp> {
  /** Abgewählte Bereiche zählen nicht zum Gesamtbetrag und erscheinen nicht im PDF. */
  aktiv: boolean;
  untergruppen: Untergruppe<T>[];
}

/** Eine Fassung („Aktuell“ oder „Neu“) – immer mit allen vier Bereichen. */
export interface Fassung {
  bereiche: { [T in BereichTyp]: Bereich<T> };
}

export interface Vorteile {
  aktiv: boolean;
  stichpunkte: string[];
}

export const PRIORITAETEN = ['niedrig', 'normal', 'hoch'] as const;
export type Prioritaet = (typeof PRIORITAETEN)[number];

export interface Aufgabe {
  id: Id;
  text: string;
  faellig: Datum | null;
  erledigt: boolean;
  prioritaet?: Prioritaet;
  /** Kürzel bzw. Konto der zuständigen Person. */
  zustaendig?: string;
  /** Bezug auf einen Vertrag oder eine Untergruppe (Id). */
  bezug?: Id;
  outlookErinnerung: boolean;
}

export interface Uebersicht {
  id: Id;
  kundeId: Id;
  /** Übersichtstitel, im PDF-Kopf nur optional. */
  titel?: string;
  erstellt: Zeitstempel;
  geaendert: Zeitstempel;
  aktuell: Fassung;
  neu: Fassung;
  /** Sync-Schalter „In ‚Neu‘ übernehmen“. */
  syncAktiv: boolean;
  /** Seit wann und von wem „In ‚Neu‘ übernehmen“ ausgeschaltet ist (Bild 14 v2). */
  syncAusSeit?: Zeitstempel;
  syncAusVon?: string;
  /** „Ersparnis anzeigen“ – wirkt auf App und PDF. */
  ersparnisAnzeigen: boolean;
  vorteile: Vorteile;
  aufgaben: Aufgabe[];
}

// ---------------------------------------------------------------- Vorlagen

export interface VorlageUntergruppe {
  name: string;
  symbol: Symbol;
  /** Vertragsnamen als Vorschlag beim Tippen. */
  vorschlaege: string[];
}

export interface VorlageBereich {
  aktiv: boolean;
  untergruppen: VorlageUntergruppe[];
}

export interface Vorlage {
  id: Id;
  name: string;
  symbol: Symbol;
  /** Standard für neue Kunden. */
  standard: boolean;
  /** true = „Meine Vorlagen“ (nur für den eigenen Nutzer). */
  eigene: boolean;
  bereiche: { [T in BereichTyp]: VorlageBereich };
}

// ---------------------------------------------------------------- Einstellungen (lokal je Nutzer)

export interface SchnellstartLink {
  id: Id;
  name: string;
  symbol: Symbol;
  /** Webadresse oder Programmpfad. */
  ziel: string;
}

export type Darstellung = 'auto' | 'hell' | 'dunkel';

export interface Einstellungen {
  darstellung: Darstellung;
  pdfPasswortStandard: boolean;
  /** 5–8 Kacheln. */
  schnellstart: SchnellstartLink[];
  kiAnbieter: string | null;
  mailKonto: string | null;
  /** Vorschlag „alte Kunden löschen“ nach so vielen Jahren ohne Änderung. */
  aufbewahrungJahre: number;
  /** Angepinnte Übersichten (max. 4). */
  angepinnt: Id[];
}

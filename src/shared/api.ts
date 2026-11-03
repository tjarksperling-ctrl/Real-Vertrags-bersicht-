/** Schnittstelle zwischen Oberfläche (Renderer) und Electron-Hauptprozess – nur Typen. */
import type { Darstellung } from './modell/typen';
import type { PdfOptionen } from './pdf/auftrag';

export interface AppInfo {
  plattform: string;
  version: string;
  /** Anzeigename der angemeldeten Person (bis zur Microsoft-Anmeldung in M5: Windows-/macOS-Benutzer). */
  benutzer: string;
  /** Beispieldaten anlegen (nur für Vorführung und Screenshots). */
  demo: boolean;
  /** Nur Tests/Screenshots: PDF ohne Speichern-Dialog hierhin schreiben. */
  pdfZiel?: string;
}

export interface PdfAuftrag {
  /** Vorgeschlagener Dateiname ohne Pfad, z. B. „Vertragsuebersicht_Berger_2026-11-02.pdf“. */
  dateiname: string;
  /** Stand der Übersicht (Yjs-Update) – die Druckansicht liest genau diesen Stand. */
  daten: Uint8Array;
  kunde: string;
  optionen: PdfOptionen;
  /** Datum in der Kopfzeile (TT.MM.JJJJ). */
  datum: string;
  /** PDF mit Passwort schützen (AES-256). */
  passwort?: string;
  /** Vorschau: in einer temporären Datei erzeugen und mit dem PDF-Programm öffnen. */
  vorschau?: boolean;
  /** Ohne Rückfrage in diesen Pfad schreiben (Tests/Screenshots). */
  ziel?: string;
  /** Auskunft nach Art. 15 DSGVO (Bild 16): Deckblatt + alle Übersichten des Kunden. */
  auskunft?: AuskunftDaten;
}

export interface AuskunftDaten {
  kunde: { name: string; erstellt: string; geaendert: string };
  /** Je Übersicht der Yjs-Stand (Aufgaben inklusive). */
  uebersichten: Uint8Array[];
  protokoll: ProtokollEintrag[];
  erstelltVon: string;
}

/** Was die Druckansicht vom Hauptprozess bekommt. */
export type DruckDaten = Pick<PdfAuftrag, 'daten' | 'kunde' | 'optionen' | 'datum' | 'auskunft'>;

export interface PdfErgebnis {
  pfad: string | null;
  seiten?: number;
  fehler?: string;
}

/** Eintrag im Protokoll (Bild 16): wer hat wann was getan – lokal, 12 Monate aufbewahrt. */
export interface ProtokollEintrag {
  zeit: string;
  wer: string;
  kunde?: string;
  uebersicht?: string;
  was: string;
}

/** „Auf Desktop speichern“ (Bild 10): eingefrorener Stand als `.vtue`. */
export interface DateiAuftrag {
  /** Dateiname ohne Endung, z. B. „Familie Berger – Jahresgespräch 2026 – 02.11.2026“. */
  name: string;
  /** Auf dem Desktop speichern oder Ort wählen. */
  ort: 'desktop' | 'waehlen';
  meta: VtueMeta;
  /** Yjs-Stand der Übersicht. */
  daten: Uint8Array;
  passwort?: string;
  imOrdnerZeigen?: boolean;
}

/** Unverschlüsselte Angaben einer `.vtue`-Datei (für die Passwortabfrage). */
export interface VtueMeta {
  kunde: string;
  kundeId: string;
  uebersichtId: string;
  titel: string;
  /** ISO-Zeitstempel des eingefrorenen Stands. */
  gespeichert: string;
  von: string;
}

export interface DateiInfo extends VtueMeta {
  dateiname: string;
  verschluesselt: boolean;
}

/** Befehle aus einem Datei-Fenster an das Hauptfenster. */
export type AppBefehl = { art: 'uebersichtOeffnen'; uebersichtId: string; kundeId: string } | { art: 'alsNeuUebernehmen'; meta: VtueMeta; daten: Uint8Array };

export interface Api {
  info(): Promise<AppInfo>;
  /** Liest ein gespeichertes Yjs-Dokument (Name nur a–z, 0–9, „-“). */
  laden(name: string): Promise<Uint8Array | null>;
  speichern(name: string, daten: Uint8Array): Promise<void>;
  einstellungenLaden(): Promise<unknown>;
  einstellungenSpeichern(daten: unknown): Promise<void>;
  darstellungSetzen(d: Darstellung): Promise<void>;
  pdfErstellen(auftrag: PdfAuftrag): Promise<PdfErgebnis>;
  /** Druckansicht: Auftrag abholen (Schlüssel aus der Adresse) und „fertig gezeichnet“ melden. */
  druckDaten(schluessel: string): Promise<DruckDaten | null>;
  druckBereit(): void;
  // ---- M5a
  /** Schnellstart: Webadresse im Browser bzw. Programm öffnen. */
  oeffnenExtern(ziel: string): Promise<boolean>;
  /** „App hinzufügen“: Programm auswählen. */
  programmWaehlen(): Promise<{ pfad: string; name: string } | null>;
  /** Löscht eine gespeicherte Datei (Name wie bei `speichern`). */
  loeschen(name: string): Promise<void>;
  protokollLaden(): Promise<ProtokollEintrag[]>;
  protokollSchreiben(e: ProtokollEintrag): Promise<void>;
  /** Text-Datei über den Speichern-Dialog ablegen (z. B. Verarbeitungsverzeichnis). */
  textSpeichern(dateiname: string, text: string): Promise<string | null>;
  dateiSpeichern(auftrag: DateiAuftrag): Promise<{ pfad: string | null; fehler?: string }>;
  /** Datei-Fenster: Angaben zur geöffneten Datei, Entsperren (null = falsches Passwort). */
  dateiInfo(schluessel: string): Promise<DateiInfo | null>;
  dateiEntsperren(schluessel: string, passwort?: string): Promise<Uint8Array | null>;
  /** „Datei öffnen …“ in der App (ohne Doppelklick). */
  dateiOeffnenDialog(): Promise<void>;
  /** Datei-Fenster → Hauptfenster. */
  anApp(b: AppBefehl): Promise<void>;
  /** Hauptfenster: Befehle aus Datei-Fenstern empfangen. */
  aufBefehl(fn: (b: AppBefehl) => void): () => void;
}

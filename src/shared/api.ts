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
}

/** Was die Druckansicht vom Hauptprozess bekommt. */
export type DruckDaten = Pick<PdfAuftrag, 'daten' | 'kunde' | 'optionen' | 'datum'>;

export interface PdfErgebnis {
  pfad: string | null;
  seiten?: number;
  fehler?: string;
}

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
}

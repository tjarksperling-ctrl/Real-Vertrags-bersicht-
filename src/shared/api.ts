/** Schnittstelle zwischen Oberfläche (Renderer) und Electron-Hauptprozess – nur Typen. */
import type { Darstellung } from './modell/typen';

export interface AppInfo {
  plattform: string;
  version: string;
  /** Anzeigename der angemeldeten Person (bis zur Microsoft-Anmeldung in M5: Windows-/macOS-Benutzer). */
  benutzer: string;
  /** Beispieldaten anlegen (nur für Vorführung und Screenshots). */
  demo: boolean;
}

export interface PdfAuftrag {
  /** Vorgeschlagener Dateiname ohne Pfad, z. B. „Familie Berger – Jahresgespräch 2026 – 02.11.2026.pdf“. */
  dateiname: string;
  /** Hash-Route der Druckansicht (#druck?…). */
  route: string;
  /** Ohne Rückfrage in diesen Pfad schreiben (Tests/Screenshots). */
  ziel?: string;
}

export interface PdfErgebnis {
  pfad: string | null;
  seiten?: number;
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
  /** Druckansicht meldet „fertig gezeichnet“. */
  druckBereit(): void;
}

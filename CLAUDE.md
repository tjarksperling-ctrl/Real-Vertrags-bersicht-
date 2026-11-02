# CLAUDE.md – Vertragsübersicht

Desktop-App (Windows, zusätzlich Mac) für eine Versicherungsagentur: Vertragsübersicht je Kunde in zwei Fassungen „Aktuell“ und „Neu“, hochwertiger PDF-Export. Neutral, Apple-Stil, extrem einfach. Details: `STAND.md` (Briefing + Entscheidungen), `PLAN.md` (freigegebener Plan), `HANDOFF.md` (letzter Stand).

## Arbeitsregeln
- Phasen: 1 Rückfragen ✅ · 2 Plan ✅ · 3 Mockups (statisches HTML in `/mockups`) ✅ · 4 Umsetzung in Meilensteinen (M1 freigegeben; M2 Editor, M3 Aktuell/Neu + Sync + Vorteile, M4 PDF umgesetzt, Freigabe ausstehend). Nach jeder Phase/jedem Meilenstein: STOPP, Freigabe abwarten.
- Kein App-Code vor Phase 4. Bei Mockup-Feedback nur die betroffene Seite ändern.
- Rückfragen immer zum Antippen (Auswahl-Dialog, max. 4 je Runde).
- Token-effizient: kurze Zusammenfassungen, keine kompletten Dateien im Chat, Abhängigkeiten nur mit echtem Mehrwert.
- Kommunikation und UI-Texte auf Deutsch. Am Ende einer Sitzung `HANDOFF.md` aktualisieren.

## Technik
Electron + React + TypeScript · dnd-kit · Yjs (CRDT) · MSAL + Microsoft Graph · Vitest · electron-builder/-updater.
Code: `src/shared/` reine Logik ohne Electron/React (`modell/`, `rechnen/`, `fassung/`, `editor/`, `pdf/`), Tests `*.test.ts` daneben; `npm test`, `npm run typecheck`. App: `src/main` (Electron), `src/preload`, `src/renderer` (React; Stil = Kopie von `mockups/style.css` + `app.css`); Build mit electron-vite (`npm run build`, `npm run start`), Screenshots `npm run screenshots`. Rechenlogik nur dort, nie in UI/PDF duplizieren.
Mehrbenutzer **M2**: Yjs-Änderungsdateien je Nutzer in SharePoint/OneDrive-Ordner, konfliktfrei zusammengeführt, offlinefähig, kein Server.

## Fachregeln (verbindlich)
- 4 Bereiche, einzeln an-/abwählbar: VERS, SPAR, DARL, AV. Untergruppen (Name + Symbol) und Verträge: anlegen, umbenennen, löschen, Drag & Drop.
- Beträge intern als ganze Cent, leeres Feld = `null` (zählt 0). Runden „sichtbar stimmig“: exakter Jahresbetrag, einmal je Untergruppe kaufmännisch gerundet (Jahr/12); Bereich = Σ UG-Summen, Gesamt = Σ aktive Bereiche, Vorteile/Jahr = Monat × 12.
- Zahlweise → Monat: ÷1/3/6/12. „Einmalig“ nie in Monatssummen; Einmalbeträge separat, nur anzeigen wenn > 0.
- Summen: VERS Beitrag/Monat (+Einmal) · SPAR Untergruppe Sparrate/Monat, Bereich Gesamtvermögen (Guthaben+Wertentw.), Sparrate/Monat, Einmal · DARL Rate/Monat (UG nur Rate), Bereich + Gesamtrestschuld · AV Beitrag/Monat (+Einmal).
- Gesamt/Monat über alle aktiven Bereiche. Danach optional „Vorteile“ (Stichpunkte + autom. Ersparnis/Mehrbeitrag Monat/Jahr; nur Neu/Beide).
- AV-Leistung = Betrag + Art (Rente mtl./Kapital/Guthaben/Todesfall), Laufzeit = Enddatum. SPAR ohne „Stand vom“, ohne %.
- Bemerkung mehrzeilig, nie abgeschnitten (auch PDF).
- Sync Aktuell → Neu über `quelleId`; aus = nichts rückwirkend; in Neu gelöschte Elemente nicht wieder anlegen.
- PDF: nur Kopfzeile (Vertragsübersicht · Kunde · Aktuell/Neu · Datum; Übersichtstitel nur optional). Ersparnis/Differenz nur, wenn „Ersparnis anzeigen“ an ist (App + PDF). „Beide“ = Aktuell, dann Neu, Vergleichsseite optional.
- Kundendaten: nur Name. Unterlagen nur auswerten, nicht speichern. Name vor KI-Versand entfernen.
- Datei „Stand einfrieren“: `.vtue`, optional verschlüsselt, Doppelklick öffnet eigenes Fenster.

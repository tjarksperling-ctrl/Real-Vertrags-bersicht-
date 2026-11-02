# Übergabe – Vertragsübersicht (Desktop-App)

**Stand:** 02.11.2026 · Branch `claude/laughing-johnson-xm4jsw`

## Ziel
Desktop-App (Windows, zusätzlich Mac) für eine Versicherungsagentur: Vertragsübersicht „Aktuell“/„Neu“ je Kunde, hochwertiger PDF-Export, Apple-Stil. 4 Phasen mit Freigabe: Rückfragen → Plan → Mockups → Umsetzung.

## Bisher erledigt
- Phase 1 ✅ (Entscheidungen in `STAND.md`).
- Phase 2 ✅ freigegeben: `PLAN.md`. Entscheidungen: Electron + React/TS, Mehrbenutzer **M2 (nur OneDrive, Yjs-Änderungsdateien, kein Server)**, Vergleichsseite optional (Frage 9 bestätigt).
- `CLAUDE.md` mit kompakter Spezifikation angelegt.
- Phase 3: Mockups in `/mockups` erstellt (Einstieg `mockups/index.html`):
  start, aktuell, neu, nebeneinander, export (PDF + Outlook), ki-import (Prüf-Dialog), pdf (A4-Vorschau) + `pdf-vorschau.pdf` (5 Seiten, mit Chromium erzeugt).
- Beispieldaten „Familie Berger“: Aktuell 2.033,25 €/Monat, Neu 2.007,85 €/Monat, Ersparnis 25,40 €/Monat bzw. 304,80 €/Jahr.

## Betroffene Dateien
- `mockups/style.css`: gemeinsames Design
- `mockups/werkzeug/generieren.py`: erzeugt alle HTML-Seiten aus einheitlichen Beispieldaten. **Seiten nicht von Hand ändern, sondern hier ändern und neu erzeugen.**
- `mockups/werkzeug/pdf-und-screenshots.js`: erzeugt `pdf-vorschau.pdf` + Screenshots (Playwright)

## Offene Aufgaben
1. Feedback des Nutzers zu den Mockups einholen und einarbeiten (nur betroffene Seite).
2. Nach Freigabe: Phase 4, Meilenstein 1 (Datenmodell & Berechnungen + Vitest-Tests).

## Nächster Schritt
Feedback zu den Mockups abwarten. STOPP: kein App-Code vor Freigabe. Rückfragen nur zum Antippen.

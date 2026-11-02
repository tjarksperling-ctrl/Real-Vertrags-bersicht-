# Übergabe – Vertragsübersicht (Desktop-App)

**Stand:** 02.11.2026 · Branch `claude/laughing-johnson-xm4jsw`

## Ziel
Desktop-App (Windows, zusätzlich Mac) für eine Versicherungsagentur: Vertragsübersicht „Aktuell“/„Neu“ je Kunde, hochwertiger PDF-Export, Apple-Stil. 4 Phasen mit Freigabe: Rückfragen → Plan → Mockups → Umsetzung.

## Bisher erledigt
- Phase 1 abgeschlossen (Entscheidungen in `STAND.md`).
- Phase 2: Plan erstellt in **`PLAN.md`** (Technologie, Mehrbenutzer, Datenmodell, DSGVO, Funktionsliste, Meilensteine).

## Kernvorschläge in PLAN.md
- Technologie: **Electron + React/TS** (Empfehlung, wegen identischem PDF auf Win/Mac) vs. Tauri 2.
- Mehrbenutzer: **M1 Sync-Server EU (Yjs/Hocuspocus)** (Empfehlung, echtes Live) vs. **M2 nur OneDrive** (Yjs-Änderungsdateien, nahezu live, ohne Server). OneDrive in M1 für Export/Backup.
- Outlook + OneDrive über Microsoft Graph (MSAL). KI anbieterunabhängig, Kundenname wird vor Versand entfernt.

## Offene Aufgaben
1. Freigabe von PLAN.md einholen.
2. Entscheidung M1 oder M2.
3. Frage 9 bestätigen („optimal“ = „optional“ → Vergleichsseite zuschaltbar).
4. Nach Freigabe: kompakte Spezifikation in `CLAUDE.md`, Entscheidungen in STAND.md nachtragen.

## Nächster Schritt
Antworten auf die offenen Punkte einarbeiten → CLAUDE.md anlegen → Phase 3: statische HTML-Mockups in `/mockups` (inkl. PDF-Vorschau). Danach STOPP. Kein App-Code vor Phase 4. Rückfragen nur zum Antippen.

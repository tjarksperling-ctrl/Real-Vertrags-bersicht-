# Übergabe – Vertragsübersicht (Desktop-App)

**Stand:** 02.11.2026 · Branch `claude/bold-curie-qxr2wd`

## Ziel
Desktop-App (primär Windows, zusätzlich Mac) für eine Versicherungsagentur. Sie erstellt je Kunde eine Vertragsübersicht „Aktuell" und „Neu" mit hochwertigem PDF-Export. Design im Apple-Stil, Bedienung extrem einfach. Vorgehen in 4 Phasen mit Freigabe nach jeder Phase: Rückfragen → Plan → Mockups → Umsetzung.

## Bisher erledigt
- Phase 1 (Rückfragen) abgeschlossen, alle 15 Fragen beantwortet.
- Phase 2 (Plan) **freigegeben**, aber noch **nicht begonnen**.
- Projektstand in `STAND.md` gesichert und gepusht.

## Getroffene Entscheidungen (Kurzfassung, Details in STAND.md)
- Speicherort: OneDrive/SharePoint. Bearbeitung: live gemeinsam, auch am selben Kunden.
- Kundendaten: nur Name. Unterlagen: nur auswerten, nicht archivieren.
- KI: anbieterunabhängiges, frei wechselbares KI-Konto (Copilot hat keine Schnittstelle für fremde Apps).
- E-Mail: Outlook, einfach verknüpfbar, Anhang optional.
- PDF: neutral, nur Kopfzeile (Vertragsübersicht, Kunde, Aktuell/Neu, Datum). „Beide" = nacheinander, Vergleichsseite optional.
- Darlehen: Untergruppe zeigt nur Rate/Monat.
- Altersvorsorge: streng strukturiert (Betrag + Art, Enddatum).
- Sparen: kein „Stand vom", keine %-Anzeige.
- Vorteile-Abschnitt: nach der Gesamtsumme, Stichpunkte plus automatische Ersparnis.
- Vorlagen: Standard-Untergruppen, Autovervollständigung, eigene Vorlagen.
- Betrieb: Exportdateien optional verschlüsselt, Auto-Updates, Mac-Version.

## Betroffene Dateien
- `STAND.md`: vollständiges Briefing, Entscheidungstabelle, Arbeitsregeln
- `HANDOFF.md`: diese Übergabe
- `CLAUDE.md`: wird erst nach Freigabe von Phase 2 angelegt

## Offene Aufgaben
1. Widerspruch zwischen OneDrive und Live-Co-Bearbeitung lösen (z. B. Sync-Backend mit EU-Hosting; OneDrive für Exportdateien und Backup).
2. Frage 9 bestätigen lassen: Antwort „optimal" wurde als „optional" interpretiert.
3. Phase 2 ausarbeiten: max. 2 Technologie-Optionen mit Empfehlung, Datenmodell, Mehrbenutzer-Lösung, DSGVO-Konzept, Funktionsliste Muss/Soll/Kann mit eigenen Vorschlägen.

## Nächster Schritt
Phase-2-Plan erstellen, danach **STOPP** und Freigabe abwarten. Rückfragen nur zum Antippen stellen (Auswahl-Dialog). Kein App-Code vor Phase 4.

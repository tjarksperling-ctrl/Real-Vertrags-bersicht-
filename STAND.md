# Projektstand – Vertragsübersicht (Desktop-App)

**Aktueller Stand:** Phase 1 ✅ · Phase 2 ✅ (`PLAN.md`) · Phase 3: Mockups erstellt (`/mockups`), **wartet auf Feedback/Freigabe**.
**Nächster Schritt:** Feedback einarbeiten (nur betroffene Seite) → nach Freigabe Phase 4, Meilenstein 1.

> Fortsetzen in neuer Sitzung: „Lies HANDOFF.md und mach beim nächsten Schritt weiter."

## Arbeitsweise (strikt)
1. Rückfragen ✅ · 2. Plan · 3. Design (statische HTML-Mockups in /mockups, inkl. PDF-Vorschau; bei Feedback nur betroffene Seite ändern) · 4. Umsetzung in Meilensteinen (Datenmodell & Berechnungen → Editor → Aktuell/Neu-Vergleich → PDF → Zusatzfunktionen), je Meilenstein Tests für Berechnungslogik + kurzer Status.
- Nach jeder Phase STOPP und Freigabe abwarten. Vor Phase 4 kein App-Code.
- Token-effizient: kurze Zusammenfassungen, keine kompletten Dateien im Chat, nur betroffene Dateien ändern, Abhängigkeiten nur mit echtem Mehrwert.
- Rückfragen an den Nutzer immer zum Antippen stellen (Auswahl-Dialog, max. 4 Fragen je Runde, Freitext möglich).

## Phase 2 – geforderter Inhalt
Technologie (max. 2 Optionen mit Vor-/Nachteilen + klare Empfehlung), Datenmodell, Mehrbenutzer-Lösung, Funktionsliste Muss/Soll/Kann inkl. eigener Vorschläge. Offen sagen, wenn etwas anders mehr Sinn ergibt.

## Fachliche Anforderungen (Original-Briefing, kompakt)
Versicherungsagentur (Versicherungen, Investment, Finanzierungen). App erstellt Kunden-Vertragsübersicht „Aktuell" und „Neu", beide als hochwertiges PDF. Design modern, ruhig, Apple-Stil; Bedienung extrem einfach. Primär Windows.

**Grundstruktur**
- Bis zu 4 Bereiche, klar getrennt, einzeln an-/abwählbar.
- Untergruppen je Bereich: umbenennbar, mit Symbol.
- Verträge & Untergruppen: hinzufügen, umbenennen, löschen, Drag & Drop verschieben/sortieren.
- Bemerkung immer mehrzeilig, nie abgeschnitten (auch im PDF).
- Zahlweise überall: monatlich, vierteljährlich, halbjährlich, jährlich, einmalig. Monat = ÷1/3/6/12. Einmalbeträge NIE in Monatssummen; separat summiert, nur angezeigt wenn vorhanden.

| Bereich | Spalten | Summe Untergruppe | Summe Bereich |
|---|---|---|---|
| 1 Versicherungen (Sach, Vermögen, Komposit) | Vertrag, Bemerkung, Beitrag, Zahlweise | Beitrag/Monat | Beitrag/Monat; Einmalbeträge (falls vorh.) |
| 2 Sparen & Investieren | Vertrag, Bemerkung, Sparrate, Zahlweise, Einmalbetrag, Guthaben, Wertentwicklung (€) | Sparrate/Monat | Gesamtvermögen (Guthaben + Wertentw.), Sparrate/Monat, Einmalbeträge (falls vorh.) |
| 3 Darlehen | Vertrag, Bemerkung, Rate/Tilgung, Restschuld, Zinsbindung | Rate/Monat | Rate/Monat, Gesamtrestschuld |
| 4 Altersvorsorge & Familienabsicherung | Vertrag, Bemerkung, Beitrag, Einmalbeitrag, Zahlweise, Leistung/Guthaben, Laufzeit | Beitrag/Monat | Beitrag/Monat; Einmalbeiträge (falls vorh.) |

- Ende: Gesamtbetrag/Monat über alle aktiven Bereiche (Beiträge + Sparraten + Kreditraten).
- Optional an-/abwählbar: „Vorteile der Änderungen".

**Aktuell & Neu**
- Pro Kunde zwei Fassungen, einzeln und nebeneinander ansehen/bearbeiten.
- Sync-Schalter: aktiv → Änderungen in Aktuell live nach Neu; deaktiviert → nicht mehr, nichts rückwirkend.
- PDF-Export: nur Aktuell, nur Neu oder beide.

**Weitere Funktionen**
1. PDF (wichtigste Anforderung): gleiches Design wie App, saubere Seitenumbrüche.
2. Mehrbenutzer: gleichzeitig, ohne gegenseitige Blockade.
3. Dateien: Stand einfrieren, als Datei auf Desktop speichern; Doppelklick öffnet App mit diesem Stand; mehrere Dateien gleichzeitig offen.
4. KI-Import: KI-Konto verknüpfen, Unterlagen (PDF/Scans) analysieren, „Aktuell" vorbefüllen, Ergebnis vor Übernahme prüfbar. (Bisher Copilot – hat keine API für Fremd-Apps.)
5. Schnellstart: 5–8 frei konfigurierbare Links zu Apps/Webseiten.
6. Aufgaben: To-dos je Vertragsübersicht mit Fälligkeitsdatum.
7. E-Mail: Outlook verknüpfen, Mails mit PDF-Anhang direkt aus App senden.
8. Datenschutz: DSGVO – Speicherung, Zugriff, KI-Nutzung im Plan berücksichtigen.

## Phase-1-Entscheidungen
| # | Thema | Entscheidung |
|---|---|---|
| 1 | Speicherort | OneDrive/SharePoint |
| 2 | Gleichzeitiges Arbeiten | Live gemeinsam bearbeiten (auch am selben Kunden) |
| 3 | Kundendaten | Nur Name |
| 4 | KI | Frei wählbares, jederzeit änderbares KI-Konto verknüpfbar (anbieterunabhängig), das Dateien importiert |
| 5 | Unterlagen | Nur auswerten, nicht archivieren |
| 6 | E-Mail | Outlook, ganz einfach mit bestehendem Konto verknüpfbar; Anhang optional |
| 7 | Branding | Neutral |
| 8 | PDF-Kopf | Nur Kopfzeile: „Vertragsübersicht", Kundenname, Aktuell/Neu, Datum. Kein Deckblatt, keine Fußzeile, keine Zusammenfassung, keine Unterschrift |
| 9 | PDF „Beide" | Nacheinander (Aktuell, dann Neu) + Vergleichsseite optional zuschaltbar (bestätigt) |
| 10 | Darlehen Untergruppe | Nur Rate/Monat |
| 11 | Altersvorsorge | Streng strukturiert: Leistung = Betrag + Art (Rente mtl./Kapital/Guthaben/Todesfall), Laufzeit = Enddatum |
| 12 | Sparen | Kein „Stand vom", keine %-Anzeige |
| 13 | Vorteile | Nach Gesamtsumme, Stichpunkte + automatisch berechnete Ersparnis/Mehrbeitrag (Monat/Jahr); nur in Neu/Beide |
| 14 | Vorlagen | Standard-Untergruppen mit Symbolen, Autovervollständigung, eigene Vorlagen speichern |
| 15 | Betrieb | Exportdateien optional verschlüsselt, automatische Updates, zusätzlich Mac-Version. (Kein Änderungsprotokoll gewählt) |

## Phase-2-Entscheidungen
| Thema | Entscheidung |
|---|---|
| Technologie | Electron + React/TypeScript |
| Mehrbenutzer | M2: nur OneDrive/SharePoint, Yjs-Änderungsdateien je Nutzer, nahezu live, kein Server |
| Plan | PLAN.md vollständig freigegeben (inkl. Kann-Vorschläge) |

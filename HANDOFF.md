# Übergabe – Vertragsübersicht (Desktop-App)

**Stand:** 02.11.2026 · Branch `claude/laughing-johnson-xm4jsw` · Phase 3 (Mockups) **in Überarbeitung**
Weitere Dateien: `STAND.md` (Briefing kompakt + alle Entscheidungen), `PLAN.md` (freigegebener Plan), `CLAUDE.md` (Spezifikation + Regeln).

## 1. Projektziel
Desktop-App (primär Windows, zusätzlich Mac) für eine **Versicherungsagentur** (Versicherungen, Investment, Finanzierungen). Je Kunde wird eine Vertragsübersicht in zwei Fassungen erstellt: **„Aktuell“** (Bestand) und **„Neu“** (Beratungsvorschlag). Beide lassen sich als hochwertiges PDF exportieren. Nutzer sind die Mitarbeitenden der Agentur, teils gleichzeitig. Design modern, ruhig, im Apple-Stil, Bedienung extrem einfach.

## 2. Gewünschte Funktionen und Umsetzung in den Layouts
Hinweis: Der Originalwortlaut des Briefings stammt aus einer früheren Sitzung. Erhalten ist nur die kompakte Fassung in `STAND.md`, die Liste folgt ihr möglichst wörtlich.
✅ = im Layout sichtbar · ◐ = nur angedeutet/teilweise · ❌ = fehlt

**Grundstruktur**
| Funktion | Status |
|---|---|
| Bis zu 4 Bereiche, klar getrennt, einzeln an-/abwählbar | ◐ Schalter je Bereich vorhanden, abgewählter Zustand nicht gezeigt |
| Untergruppen je Bereich: umbenennbar, mit Symbol | ◐ Symbole sichtbar, Umbenennen/Symbolwahl nicht gezeigt |
| Verträge & Untergruppen hinzufügen | ✅ |
| … umbenennen, löschen | ❌ (nur „…“-Menü ohne Inhalt) |
| … per Drag & Drop verschieben/sortieren | ◐ Griffe sichtbar, Vorgang nicht gezeigt |
| Bemerkung immer mehrzeilig, nie abgeschnitten (auch im PDF) | ✅ |
| Zahlweise überall: monatlich, vierteljährlich, halbjährlich, jährlich, einmalig (÷1/3/6/12) | ◐ Werte + Rechnung korrekt, Auswahlfeld nicht gezeigt |
| Einmalbeträge nie in Monatssummen, separat summiert, nur wenn vorhanden | ✅ |
| 1 Versicherungen: Vertrag, Bemerkung, Beitrag, Zahlweise · Summe Beitrag/Monat (+ Einmal) | ✅ |
| 2 Sparen & Investieren: Vertrag, Bemerkung, Sparrate, Zahlweise, Einmalbetrag, Guthaben, Wertentwicklung (€) · UG Sparrate/Monat · Bereich Gesamtvermögen, Sparrate/Monat, Einmal | ✅ |
| 3 Darlehen: Vertrag, Bemerkung, Rate/Tilgung, Restschuld, Zinsbindung · UG nur Rate/Monat · Bereich Rate/Monat + Gesamtrestschuld | ✅ |
| 4 Altersvorsorge & Familienabsicherung: Vertrag, Bemerkung, Beitrag, Einmalbeitrag, Zahlweise, Leistung/Guthaben, Laufzeit · Beitrag/Monat (+ Einmal) | ✅ |
| AV streng strukturiert: Leistung = Betrag + Art (Rente mtl./Kapital/Guthaben/Todesfall), Laufzeit = Enddatum | ◐ Anzeige ja, Eingabe der Art nicht gezeigt |
| Sparen: kein „Stand vom“, keine %-Anzeige | ✅ |
| Gesamtbetrag/Monat über alle aktiven Bereiche | ✅ |
| „Vorteile der Änderungen“ optional, nach Gesamtsumme, Stichpunkte + automatische Ersparnis/Mehrbeitrag (Monat/Jahr), nur Neu/Beide | ✅ |

**Aktuell & Neu**
| Funktion | Status |
|---|---|
| Zwei Fassungen je Kunde, einzeln und nebeneinander ansehen | ✅ |
| … nebeneinander bearbeiten | ◐ nur Kompaktansicht mit Hinweistext |
| Sync-Schalter (an: Aktuell → Neu live; aus: nichts rückwirkend) | ◐ Schalter da, Verhalten nicht erklärt |
| PDF-Export: nur Aktuell, nur Neu oder beide | ✅ |

**Weitere Funktionen**
| Funktion | Status |
|---|---|
| PDF (wichtigste Anforderung): gleiches Design wie App, saubere Seitenumbrüche | ✅ |
| PDF-Kopf nur Kopfzeile: Vertragsübersicht, Kunde, Aktuell/Neu, Datum. Neutral, kein Deckblatt | ✅ |
| PDF „Beide“ = Aktuell, dann Neu, Vergleichsseite optional | ✅ |
| Mehrbenutzer gleichzeitig, auch am selben Kunden, ohne Blockade | ◐ nur Avatar „SK“ + OneDrive-Status |
| Stand einfrieren → Datei auf Desktop, Doppelklick öffnet App mit diesem Stand, mehrere Dateien gleichzeitig offen | ❌ nur Knopf „Einfrieren“ |
| Exportdateien optional verschlüsselt | ❌ |
| KI-Konto (frei wählbar, jederzeit änderbar) verknüpfen | ❌ |
| KI analysiert Unterlagen (PDF/Scans), füllt „Aktuell“ vor, Ergebnis vor Übernahme prüfbar | ✅ |
| Unterlagen nur auswerten, nicht archivieren | ✅ (Hinweis im Dialog) |
| Schnellstart: 5–8 frei konfigurierbare Links zu Apps/Webseiten | ◐ Kacheln ja, Konfiguration fehlt |
| Aufgaben (To-dos) je Vertragsübersicht mit Fälligkeitsdatum | ◐ Liste auf Startseite, Aufgaben je Übersicht/Anlegen fehlt |
| Outlook einfach mit bestehendem Konto verknüpfen | ❌ |
| E-Mails mit PDF aus der App senden, Anhang optional | ✅ |
| Datenschutz/DSGVO (Speicherung, Zugriff, KI) | ◐ im Plan; im Layout nur KI-Hinweis |
| Kundendaten: nur Name | ◐ „Neuer Kunde“-Dialog fehlt |
| Vorlagen: Standard-Untergruppen mit Symbolen, Autovervollständigung, eigene Vorlagen | ❌ |
| Automatische Updates, Mac-Version | – (kein Layout nötig) |

**Eigene Vorschläge aus dem Plan (freigegeben)**
Kundensuche Strg+K ✅ · „Wer ist gerade hier“ ✅ · Rückgängig ❌ · „Neu aus Aktuell kopieren“ ❌ · Hell/Dunkel ❌ · Tastatursteuerung ❌

**Ganz fehlende Screens:** Einstellungen (KI-Konto, Outlook, OneDrive-Ordner, Schnellstart), Aufgaben je Übersicht, Stand einfrieren/Datei öffnen, Neuer Kunde + Vorlagen, Untergruppe/Vertrag bearbeiten (Symbol, Zahlweise, AV-Art).

## 3. Aktueller Stand der Layouts
Technik: statisches HTML + gemeinsames CSS, **erzeugt per Python-Skript** mit einheitlichen Beispieldaten („Familie Berger“: Aktuell 2.033,25 €/Monat, Neu 2.007,85 €, Ersparnis 25,40 €/Monat = 304,80 €/Jahr). Screenshots und PDF mit Playwright/Chromium. Kein App-Code.

| Nr | Bild | Datei |
|---|---|---|
| 1 | Startseite (Schnellstart, zuletzt bearbeitet, fällige Aufgaben) | `mockups/start.html` |
| 2 | Übersicht „Aktuell“ bearbeiten | `mockups/aktuell.html` |
| 3 | Übersicht „Neu“ (Änderungen markiert, Vorteile) | `mockups/neu.html` |
| 4 | Aktuell und Neu nebeneinander | `mockups/nebeneinander.html` |
| 5 | Dialog PDF erstellen + Outlook-Versand | `mockups/export.html` |
| 6 | Dialog KI-Import mit Prüfung | `mockups/ki-import.html` |
| 7 | PDF-Vorschau, 5 Seiten A4 | `mockups/pdf.html`, `mockups/pdf-vorschau.pdf` |

- Einstieg: `mockups/index.html` · Design: `mockups/style.css`
- Generator: `mockups/werkzeug/generieren.py` → **Seiten nur dort ändern**, dann `python3 mockups/werkzeug/generieren.py mockups`
- Bilder/PDF: `node mockups/werkzeug/pdf-und-screenshots.js <ordner>` (Fenster 1488×900; Pfad zum Repo ist im Skript fest eingetragen)

## 4. Bekannte Probleme
Feedback des Nutzers: **zu unübersichtlich, nicht alle gewünschten Funktionen enthalten** (fehlende Funktionen siehe Abschnitt 2, ◐/❌).
Konkret unübersichtlich:
- **Editor (Bild 2/3):** sehr lange Scrollseite, alle 4 Bereiche untereinander. Gesamtsumme nur ganz unten, beim Bearbeiten nicht sichtbar. Keine Navigation zwischen Bereichen.
- Spaltenköpfe wiederholen sich in jeder Untergruppe, dazu viele „+ Vertrag hinzufügen“-Links: viel visuelles Rauschen.
- **Toolbar überladen:** Ansichtswahl, Sync-Schalter, Anwesenheit, Aufgaben, KI-Import, Einfrieren und PDF in einer Zeile. Aufgaben nur als Symbol ohne Text.
- **Neu (Bild 3):** blauer Punkt + durchgestrichener Altwert + Differenztext je Bereich ergeben zu viele Markierungen.
- **Sparen-Tabelle:** 7 Spalten, sehr dicht.
- **Nebeneinander (Bild 4):** zwei komplette Spalten, langes Scrollen. Zeilen laufen auseinander, wenn Untergruppen unterschiedlich viele Verträge haben. Bearbeiten nur angedeutet.
- **KI-Dialog (Bild 6):** sehr viel Information in einem Fenster, kleine Schrift bei Hinweisen.
- **Startseite (Bild 1):** „Neuer Kunde“ doppelt (Seitenleiste und Toolbar). Zahlen-Badges ohne erkennbare Bedeutung.
- Der Sync-Schalter ist nicht selbsterklärend („Aktuell → Neu“).

## 5. Entscheidungen und was nicht funktioniert hat
**Entscheidungen:** Speicherort OneDrive/SharePoint · Mehrbenutzer M2: nur OneDrive (Yjs-Änderungsdateien je Nutzer, nahezu live mit einigen Sekunden Verzögerung, kein Server) · Technik Electron + React/TypeScript (identisches PDF auf Windows/Mac) · KI anbieterunabhängig über API-Schlüssel, Kundenname wird vor dem Versand entfernt · Outlook/OneDrive über Microsoft Graph · PDF neutral, nur Kopfzeile · Vergleichsseite optional (bestätigt) · Datei „Stand einfrieren“ = `.vtue` · alle Phase-1-Entscheidungen siehe `STAND.md` · `PLAN.md` vollständig freigegeben.
**Nicht funktioniert / Stolpersteine:**
- HANDOFF.md lag zunächst auf einem anderen Branch (`claude/bold-curie-qxr2wd`). Er wurde in den Arbeitsbranch übernommen.
- Erste Mockup-Fassung hatte Darstellungsfehler: Toolbar lief über, Änderungspunkt überdeckte Zahlen, Knopf im Export-Dialog abgeschnitten, Spalten im KI-Dialog schlecht verteilt, AV-Laufzeit ragte im PDF über den Rand, Betragsüberschriften falsch ausgerichtet. Alles behoben, aber Toolbar-Platz bleibt knapp.
- Die Auswahl-Rückfrage zur Mockup-Freigabe wurde vom Nutzer geschlossen. Feedback kam stattdessen als Text.

## 6. Arbeitsweise für die neue Sitzung (verbindlich)
- Gehe die Layouts Bild für Bild durch, immer nur EIN Bild pro Schritt (Reihenfolge: Tabelle Abschnitt 3, danach die fehlenden Screens aus Abschnitt 2).
- Zeige mir das Bild.
- Beschreibe, was auf diesem Bild zu sehen sein soll, welche Funktionen es hat und wie diese funktionieren.
- Frage mich dann nach meinen Verbesserungsvorschlägen und warte auf meine Antwort.
- Übernimm meine Vorschläge, ergänze eigene Verbesserungsvorschläge (Übersichtlichkeit, fehlende Funktionen aus Punkt 2) und zeige das überarbeitete Bild.
- Erst wenn ich das Bild freigebe, geh zum nächsten.
- Halte den Fortschritt (freigegebene Bilder, offene Punkte) laufend in HANDOFF.md fest.

## Fortschritt
| Bild | Status | Offene Punkte |
|---|---|---|
| 1 Startseite | offen | – |
| 2 Aktuell | offen | – |
| 3 Neu | offen | – |
| 4 Nebeneinander | offen | – |
| 5 PDF/E-Mail-Dialog | offen | – |
| 6 KI-Import | offen | – |
| 7 PDF | offen | – |
| neu: fehlende Screens | offen | siehe Abschnitt 2 |

**Nächster Schritt:** Bild 1 (Startseite) zeigen und beschreiben, dann nach Verbesserungsvorschlägen fragen. Kein App-Code vor Freigabe aller Mockups.

# Übergabe – Vertragsübersicht (Desktop-App)

**Stand:** 02.11.2026 (Sitzung 8) · Branch `claude/bild-2-uebersicht-freigabe-spohqz` (übernommen von `claude/bild-2-uebersicht-aktuell-9fc3nh`) · Phase 3 (Mockups) **in Überarbeitung** · Bild 1 (Startseite) v4, Bild 1b (Kundenakte) v1 und **Bild 2 (Aktuell) v2 freigegeben** · **Bild 3 (Neu) v2 umgesetzt (Wünsche zu v1 eingearbeitet), Freigabe steht aus**
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
| PDF-Kopf nur Kopfzeile: Vertragsübersicht, Kunde, Aktuell/Neu, Datum. Neutral, kein Deckblatt | ✅ · **Sitzung 8:** Übersichtstitel (z. B. „Jahresgespräch 2026“) nur **optional** im PDF-Kopf (Häkchen im PDF-Dialog, Standard aus) → in Bild 5 zeigen |
| PDF „Beide“ = Aktuell, dann Neu, Vergleichsseite optional | ✅ |
| Mehrbenutzer gleichzeitig, auch am selben Kunden, ohne Blockade | ◐ nur Avatar „SK“ + OneDrive-Status |
| Stand einfrieren → Datei auf Desktop, Doppelklick öffnet App mit diesem Stand, mehrere Dateien gleichzeitig offen | ❌ nur Knopf „Einfrieren“. **Klarstellung Sitzung 6:** Gemeint ist vor allem: Übersicht ganz einfach **als Datei auf dem Desktop speichern** und per Klick auf die Datei in der App öffnen. Knopf daher verständlich benennen (z. B. „Auf Desktop speichern“) statt „Einfrieren“ |
| Exportdateien optional verschlüsselt | ❌ |
| KI-Konto (frei wählbar, jederzeit änderbar) verknüpfen | ❌ |
| KI analysiert Unterlagen (PDF/Scans), füllt „Aktuell“ vor, Ergebnis vor Übernahme prüfbar | ✅ |
| Unterlagen nur auswerten, nicht archivieren | ✅ (Hinweis im Dialog) |
| Schnellstart: 5–8 frei konfigurierbare Links zu Apps/Webseiten | ◐ Bild 1 v3: Symbol-Kacheln mit App/Domain + „Anpassen“, Einstellungsdialog fehlt |
| Aufgaben (To-dos) je Vertragsübersicht mit Fälligkeitsdatum | ◐ Bild 1 v3: nach Dringlichkeit gruppiert, Priorität, Sprung in die Übersicht. Aufgaben je Übersicht/Anlegen-Dialog fehlt |
| Outlook einfach mit bestehendem Konto verknüpfen | ❌ |
| E-Mails mit PDF aus der App senden, Anhang optional | ✅ |
| Datenschutz/DSGVO (Speicherung, Zugriff, KI) | ◐ im Plan; im Layout nur KI-Hinweis |
| Kundendaten: nur Name | ◐ „Neuer Kunde“-Dialog fehlt |
| Vorlagen: Standard-Untergruppen mit Symbolen, Autovervollständigung, eigene Vorlagen | ❌ |
| Automatische Updates, Mac-Version | – (kein Layout nötig) |

**Eigene Vorschläge aus dem Plan (freigegeben)**
Kundensuche Strg+K ✅ · „Wer ist gerade hier“ ✅ · Übersichten anpinnen (max. 4, Wunsch Sitzung 4) ✅ Bild 1 v4 · **Kundenakte** je Kunde mit allen Vertragsübersichten über die Jahre + Kundenaufgaben (Wunsch Sitzung 5) ✅ Bild 1b · Rückgängig ❌ · „Neu aus Aktuell kopieren“ ❌ · Hell/Dunkel ❌ · Tastatursteuerung ❌

**Ganz fehlende Screens:** Einstellungen (KI-Konto, Outlook, OneDrive-Ordner, Schnellstart), Aufgaben je Übersicht, Stand einfrieren/Datei öffnen, Neuer Kunde + Vorlagen, Untergruppe/Vertrag bearbeiten (Symbol, Zahlweise, AV-Art).

## 3. Aktueller Stand der Layouts
Technik: statisches HTML + gemeinsames CSS, **erzeugt per Python-Skript** mit einheitlichen Beispieldaten („Familie Berger“: Aktuell 2.033,25 €/Monat, Neu 2.007,85 €, Ersparnis 25,40 €/Monat = 304,80 €/Jahr). Screenshots und PDF mit Playwright/Chromium. Kein App-Code.

| Nr | Bild | Datei |
|---|---|---|
| 1 | Startseite v4 **freigegeben** (Schnellstart, Aufgaben, Angepinnt max. 4, zuletzt bearbeitet) | `mockups/start.html` · Bilder `mockups/bilder/1-start-vorher.png`, `-v2.png`, `-v3.png`, `-v4.png` |
| 1b | **neu** Kundenakte v1 **freigegeben** (alle Vertragsübersichten des Kunden, aktueller Stand, Aufgaben mit Schnelleingabe) | `mockups/kunde.html` · Bild `mockups/bilder/1b-kunde-v1.png` |
| 2 | Übersicht „Aktuell“ bearbeiten **v2 freigegeben** | `mockups/aktuell.html` + `mockups/aktuell-bereich.html` (nur Darlehen gewählt) · Bilder `2-aktuell-v2.png` (Fenster), `2-aktuell-v2-ganz.png` (Fensterhöhe 2650), `2-aktuell-v2-bereich.png`; ältere `2-aktuell-v1*.png`, `2-aktuell-vorher*.png` |
| 3 | Übersicht „Neu“ **v2** (Freigabe offen) | `mockups/neu.html` + `mockups/neu-ohne-ersparnis.html` · Bilder `3-neu-v2.png` (Fenster), `3-neu-v2-ganz.png`, `3-neu-v2-ohne-ersparnis.png` (Fensterhöhe 3080); ältere `3-neu-v1*.png` |
| 4 | Aktuell und Neu nebeneinander | `mockups/nebeneinander.html` |
| 5 | Dialog PDF erstellen + Outlook-Versand | `mockups/export.html` |
| 6 | Dialog KI-Import mit Prüfung | `mockups/ki-import.html` |
| 7 | PDF-Vorschau, 5 Seiten A4 | `mockups/pdf.html`, `mockups/pdf-vorschau.pdf` |

- Einstieg: `mockups/index.html` · Design: `mockups/style.css`
- Generator: `mockups/werkzeug/generieren.py` → **Seiten nur dort ändern**, dann `python3 mockups/werkzeug/generieren.py mockups`
- Bilder zum Zeigen im Chat: `mockups/bilder/<nr>-<name>-v<n>.png`, nur die eine Seite fotografieren (Playwright, Fenster 1488×900, `file://…/mockups/start.html`) und per Datei-Versand zeigen
- Startseite: `start_body()` + Konstante `PINNED` im Generator; Seitenleiste neu über `sidebar(sel, v2=True)` (Abschnitte „Angepinnt“/„Alle Kunden“, keine Zahlen an Kunden). CSS-Blöcke „Startseite v2“ und „v3“ am Ende von `style.css`. Alte Seiten nutzen noch `sidebar()` ohne v2
- Kundenakte: `kunde_body()` + Konstante `UEBERSICHTEN` im Generator, CSS-Block „Kundenakte (Bild 1b, Sitzung 5)“ am Ende von `style.css`
- Editor v1 (Bild 2): `editor_v1(nur=None)`, `toolbar_v1()`, `bereichsleiste_v1()`, `bereich_v1()`, `table_v1()` + Konstanten `FARBE`, `ZW_OPT` im Generator; CSS-Block „Editor v1 (Bild 2, Sitzung 7)“ am Ende von `style.css` (Bereichsfarben über `--bc`/`--bs` an Klassen `.vers/.spar/.darl/.av`). Alte `editor_body()` bleibt für neu/export/ki-import unverändert. `META['VERS']` = „Versicherungen“ ohne Untertitel (gilt überall inkl. PDF). Kopfzeile `toolbar_v1()` ist auf 1488 px exakt ausgereizt (scrollWidth = clientWidth = 1192) → bei neuen Knöpfen vorher etwas anderes kürzen und mit Playwright `scrollWidth` prüfen
- Neu (Bild 3): `editor_v1(mode='Neu', ersparnis=True)` (nutzt `bereich_v1(..., other=AKTUELL[i])` → Markierungen über `cells(..., mark=True)` + Deltas über `summen_html(b, other)`), Bereichsleiste zeigt `GN`; CSS-Blöcke „Bild 3 v1/v2 (Sitzung 8)“ (Klasse `.neu2` am `.content`, Änderungsleiste `.aenderungen`) am Ende von `style.css`. `export.html` nutzt noch das alte `editor_body('Neu')` (wird mit Bild 5 umgestellt)
- Editor scrollt in `.content` (nicht die Seite): ganze Seite fotografieren mit Fensterhöhe 2600 statt `fullPage`
- Bilder/PDF: `node mockups/werkzeug/pdf-und-screenshots.js <ordner>` (Fenster 1488×900; Pfad zum Repo ist im Skript fest eingetragen)

## 4. Bekannte Probleme
**Startseite (Bild 1):** in Sitzung 4 als v4 freigegeben. Einzige Änderung gegenüber v3: Es lassen sich **höchstens 4** Übersichten anpinnen („4 von 4“), sonst gefiel das Anpinnen. Verhalten bei vollem Platz (für die App festgelegt, im Bild nicht gezeigt): Der Knopf „Anpinnen“ fragt, welche angepinnte Übersicht ersetzt werden soll. Für die App bleibt offen: Seitenleiste v2 auf alle anderen Seiten übertragen.

**Ursprüngliche Kritik an allen Layouts:**
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
- Sitzung 8: Arbeitsbranch `claude/bild-2-uebersicht-freigabe-spohqz`, Stand von `claude/bild-2-uebersicht-aktuell-9fc3nh` per Fast-Forward übernommen. Bild 2 v2 erneut gezeigt und **freigegeben** („Freigegeben“). Titel-im-PDF-Kopf-Frage blieb unbeantwortet → bei Bild 7 (PDF) erneut stellen. Bild 3 v1 erzeugt: alte Neu-Seite auf die freigegebenen v2-Bausteine umgestellt (inhaltlich unverändert, damit der Nutzer die Markierungen beurteilen kann). Stolperstein: `.gesamt.v1 b` (24 px) machte den Differenztext im Gesamtbalken riesig → eigene Regel `.gesamt.v1 .neben b`.
- Sitzung 7: Arbeitsbranch `claude/bild-2-uebersicht-aktuell-9fc3nh`, Stand von `claude/sleepy-hawking-ks7fp3` per Fast-Forward übernommen. Bild 2 v1 umgesetzt. Stolperstein: Klasse `.gesamt` ist schon für den dunklen Gesamtbalken vergeben (weiße Schrift) → in der Bereichsleiste `bl-gesamt` verwenden. Zahlweise-Menü am rechten Kartenrand abgeschnitten (`overflow:hidden` der Karte) → Menü rechtsbündig. Ganze Seite: Fensterhöhe 2650 (v2). Bei v2 lief die Kopfzeile zuerst über (PDF-Knopf abgeschnitten) → Anwesenheit „SK“ neben den Titel verschoben, Abstände/Polster verkleinert, Sync-Text „In „Neu“ übernehmen“.
- Sitzung 6: Arbeitsbranch `claude/sleepy-hawking-ks7fp3`, Stand von `claude/bild-2-ubersicht-aktuell-chgsyz` per Fast-Forward übernommen. Bild 2 gezeigt + beschrieben, Nutzer hat Vorschläge geschickt (Fortschritt Bild 2). Auf Wunsch des Nutzers zuerst nur das Übergabeprotokoll geschrieben, **Umsetzung im neuen Chat**.
- Sitzung 5: Arbeitsbranch `claude/bild-2-ubersicht-aktuell-chgsyz`, Stand von `claude/blissful-knuth-3kirjs` per Fast-Forward übernommen. Bild 2 wurde gezeigt, dann wollte der Nutzer zurück zu Bild 1 → daraus entstand die Kundenakte (Bild 1b). Bild 2 ist nur gezeigt und beschrieben, Verbesserungsvorschläge des Nutzers stehen noch aus.
- Sitzung 4: Arbeitsbranch `claude/blissful-knuth-3kirjs` aus `claude/adoring-sagan-i8w0t7` erzeugt. Jede neue Sitzung bekommt evtl. einen anderen Branch → zuerst den Stand dieses Branches übernehmen.
- Sitzung 3 startete auf einem leeren Branch (`claude/adoring-sagan-i8w0t7`). Stand per Fast-Forward von `claude/laughing-johnson-xm4jsw` übernommen.
- Die Auswahl-Rückfrage zur Mockup-Freigabe wurde vom Nutzer geschlossen. Feedback kam stattdessen als Text. Deshalb Verbesserungsvorschläge als offene Textfrage stellen.
- Generator-Änderungen per Python-Heredoc mit `f'''…'''` brechen (verschachtelte Anführungszeichen). Besser: neuen Funktionstext in eine Datei im Scratchpad schreiben und einsetzen, oder das Edit-Werkzeug nutzen.
- Startseite war in v3 zunächst zu hoch für 900 px (rechte Spalte lief über). Gelöst mit kompakten Pin-Karten (eine Zeile mit Betrag, Ersparnis und nächster Aufgabe) und `minmax(0,1fr)`-Spalten.
- Entscheidung Sitzung 3: KI-Import nicht auf der Startseite, weil der Kunde dort nicht eindeutig ist (die KI kennt den Namen nicht). Wege: KI-Import in der Kundenübersicht, Datei auf Kunden in der Seitenleiste ziehen oder „Neuer Kunde“ → „Mit Unterlagen starten“.

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
| 1 Startseite | ✅ **v4 freigegeben** (Sitzung 4) | v4: max. 4 angepinnte Übersichten („4 von 4“), bei vollem Platz fragt „Anpinnen“, welche ersetzt wird. v3: Anpinnen (Karten „Angepinnt“ rechts auf Start + Abschnitt „Angepinnt“ in der Seitenleiste; Anpinnen per Knopf beim Darüberfahren in „Zuletzt bearbeitet“, Rechtsklick, später Stecknadel in der Kunden-Toolbar; angepinnte nicht doppelt in „Zuletzt bearbeitet“), Aufgaben mit Pfeil › bzw. „Übersicht öffnen ›“. v2: Links als eckige Symbol-Kacheln mit ↗ und App/Domain (≠ runde Kunden-Initialen) · nur 1× „Neuer Kunde“ (Seitenleiste) · kein KI-Import auf Start · Aufgaben gruppiert Überfällig/Heute/Diese Woche/Später + Priorität „Hoch“, Kundenname groß · Begrüßung + Datum statt Toolbar · unklare Zahlen an Kunden entfernt. Seitenleiste v2 später auf die anderen Seiten übertragen. |
| 1b Kundenakte (neu) | ✅ **v1 freigegeben** (Sitzung 5, „Ist so mega“) | Wunsch des Nutzers: Kunden haben über Jahre viele Vertragsübersichten, Klick auf Kunde darf nicht immer die letzte öffnen; Überblick über offene Aufgaben + neue Aufgaben in der Kundenakte anlegen. Umsetzung: Klick auf Kunde (Seitenleiste, Suche, Aufgabe) öffnet die Kundenakte. Kopf: Name, „Kunde seit“, Anzahl Übersichten, „Mit Unterlagen starten“ (KI), „+ Neue Vertragsübersicht ▾“ (Aus letzter Übersicht übernehmen = Neu der letzten wird Aktuell der neuen / Leer / Mit Unterlagen). Kacheln „Aktueller Stand“ (Beitrag/Monat, Gesamtvermögen, Restschuld, Verträge; aus neuester Übersicht, Fassung Aktuell). Liste Vertragsübersichten (neueste oben; Titel, Status In Arbeit/Umgesetzt + Datum, offene Aufgaben, angepinnt, eingefroren, wer gerade drin ist, Aktuell/Neu/Differenz pro Monat, „Öffnen ›“ beim Darüberfahren, ältere eingeklappt). Aufgaben rechts: Schnelleingabe mit Chips (Fälligkeit, Priorität, Übersicht oder allgemein, zuständig), gruppiert Überfällig/Diese Woche/Später, Übersicht + Zuständige je Aufgabe, Erledigte eingeklappt. **Offen:** (a) Frage des Nutzers „Kann ich die Vertragsübersichten beschriften?“ wurde noch nicht beantwortet/umgesetzt – Vorschlag: Titel frei wählbar beim Anlegen (Vorschlag z. B. „Jahresgespräch 2026“), Umbenennen per Doppelklick auf den Titel oder „…“ → Umbenennen; ggf. im Bild zeigen. (b) Vorschlag noch nicht bestätigt: auf der Startseite bei Angepinnt/Zuletzt bearbeitet zusätzlich den Übersichtstitel zeigen („Familie Berger · Jahresgespräch 2026“). |
| 2 Aktuell | ✅ **v2 freigegeben** (Sitzung 8) | **v2 (Wünsche zu v1):** Bereich 1 heißt wieder **„Versicherungen“** (ohne Untertitel, gilt überall inkl. PDF) · Bereichsfarben **kräftiger** (Kopf, Spaltenkopf, Summenfuß, UG-Karten deutlicher getönt) · **Ränder** deutlicher (Karte mit farbigem Rand + 4 px Akzentlinie, UG-Karten 1,5 px farbiger Rand, „Untergruppe hinzufügen“ in Bereichsfarbe) · **Sync-Schalter „In „Neu“ übernehmen“ oben in der Kopfzeile** neben Aktuell/Neu/Nebeneinander (an/aus, Tooltip erklärt; Zeile über dem Inhalt entfällt) · Anwesenheit „SK“ klein neben dem Titel. **v1:** (1) Bereichsfarben Blau/Grün/Orange/Violett (Akzentlinie oben, getönter Kopf, Nummer, Symbole, Summenfuß). (2)+(3) Bereichsleiste unter der Kopfzeile: „Gesamt“ (alle aktiven Bereiche) · je Bereich farbiges Häkchen (an-/abwählen) + Name (Klick = nur dieser Bereich, Bild `2-aktuell-v1-bereich.png`) · rechts dauerhaft „Gesamtbetrag monatlich 2.033,25 €“. (4) Knopf „Auf Desktop speichern“ (Tooltip: Datei auf Desktop, Doppelklick öffnet in der App, `.vtue`). (5) Untergruppen als getönte Karten mit Rand und Abstand. (6) UG-Summe unten rechts im Kartenfuß. (7) Gesamtbalken nur „Gesamtbetrag monatlich“ + Betrag. (8) Name ohne Untertitel. Eigene: Brotkrumen „Familie Berger ›“ (Link Kundenakte) über Titel „Jahresgespräch 2026“ (Doppelklick = umbenennen), Seitenleiste v2, Spaltenköpfe einmal je Bereich, „+ Vertrag“ dezent im UG-Fuß, Untergruppe hinzufügen als gestrichelte Fläche, Toolbar: Aufgaben mit Text, KI-Import ins „…“-Menü, Zahlweise als Auswahlfeld (offen bei Hausrat, „einmalig – nicht in Monatssumme“), Schalter in den Karten entfernt (nur noch Leiste), Bereichsfuß „Summe <Bereich>“. **Offen (für später):** Frage „Übersichtstitel auch in den PDF-Kopf?“ unbeantwortet → bei Bild 7 (PDF) klären. Nicht gezeigt: abgewählter Bereich, Speichern-Dialog (Dateiname, optional Passwort) → bei den fehlenden Screens. |
| 3 Neu | **v2 umgesetzt (Sitzung 8), Freigabe offen** | **v2 (Wünsche zu v1):** Ersparnis **optional**: Schalter „Ersparnis anzeigen“ (wirkt in App **und** PDF; aus = keine Differenzen in Bereichsfüßen, kein „Aktuell … / −25,40 € pro Monat“ im Gesamtbalken, keine Ersparnis-Kacheln in den Vorteilen; Bild `3-neu-v2-ohne-ersparnis.png`). Titel im PDF-Kopf nur optional (→ Bild 5). Eigene: Hinweiszeile ersetzt durch **Änderungsleiste** („4 Änderungen gegenüber „Aktuell““ + Legende + Schalter „Nur Änderungen zeigen“ + „Ersparnis anzeigen“); Markierungen ruhiger: geänderter Betrag blau hinterlegt, darunter „vorher 32,50 €“ (kein Punkt, nicht durchgestrichen). Weitere eigene Ideen noch nicht umgesetzt: neue/entfernte Verträge kennzeichnen, „Auf Aktuell zurücksetzen“ je Vertrag, geänderte Bemerkungen markieren. **v1** = Ausgangsstand im freigegebenen v2-Design: Kopfzeile mit „Neu“ aktiv + Sync-Schalter, Bereichsleiste mit Gesamtbetrag Neu 2.007,85 €, Bereichsfarben/UG-Karten. Neu-spezifisch unverändert übernommen: Hinweiszeile oben, geänderte Beträge mit blauem Punkt + durchgestrichenem Altwert, Bereichsfuß mit „−18,60 € ggü. Aktuell“, Gesamtbalken mit „Aktuell 2.033,25 € / −25,40 € pro Monat“, Vorteile (Stichpunkte, Schalter „im PDF“, automatische Ersparnis Monat/Jahr). Eigene Ideen für v2 (erst nach Nutzerfeedback einbringen): weniger Markierungen (nur getönte Zelle + Altwert als Tooltip), Schalter „Nur Änderungen zeigen“, neue/entfernte Verträge kennzeichnen, „Neu aus Aktuell zurücksetzen“ je Vertrag, Differenz in der Bereichsleiste, Bemerkungsänderungen markieren. |
| 4 Nebeneinander | offen | – |
| 5 PDF/E-Mail-Dialog | offen | – |
| 6 KI-Import | offen | – |
| 7 PDF | offen | – |
| neu: fehlende Screens | offen | siehe Abschnitt 2 |

**Nächster Schritt:** Bild 3 v2 (`3-neu-v2.png`, `-ganz.png`, `-ohne-ersparnis.png`, gezeigt): Freigabe oder weitere Wünsche abwarten. Nach Freigabe: Übergabeprotokoll, dann Bild 4 (Nebeneinander). Kein App-Code vor Freigabe aller Mockups.

## Übergabeprotokoll Sitzung 7 (02.11.2026)
- **Branch:** `claude/bild-2-uebersicht-aktuell-9fc3nh` (Stand von `claude/sleepy-hawking-ks7fp3` per Fast-Forward übernommen), alles committet und gepusht.
- **Erledigt:** Bild 2 v1 umgesetzt (alle 8 Wünsche aus Sitzung 6 + eigene Vorschläge) und gezeigt. Wünsche zu v1 als **v2** umgesetzt: Name „Versicherungen“, kräftigere Farben, deutlichere Ränder, Sync-Schalter oben in der Kopfzeile. PDF-Vorschau neu erzeugt (Bereich 1 ohne Untertitel).
- **Offen:** (a) Freigabe Bild 2 v2 durch den Nutzer – v2 wurde am Ende von Sitzung 7 gezeigt, Rückmeldung steht aus. (b) Frage: Soll der Übersichtstitel (z. B. „Jahresgespräch 2026“) zusätzlich in den PDF-Kopf? (c) Ggf. noch zeigen: abgewählter Bereich, Dialog „Auf Desktop speichern“ (Dateiname, optional Passwort). (d) Kundenakte-Punkt (b) aus Sitzung 5: Übersichtstitel auch auf der Startseite zeigen – noch nicht bestätigt.
- **Werkzeuge:** Generator `python3 mockups/werkzeug/generieren.py mockups`. Bilder Bild 2: Playwright, Viewport 1488×900 (Fenster) bzw. 1488×2650 (ganze Seite), Seiten `aktuell.html` und `aktuell-bereich.html`. PDF: `node mockups/werkzeug/pdf-und-screenshots.js <scratchpad>`.

**Prompt für den nächsten Chat:**
> Lies HANDOFF.md auf dem Branch claude/bild-2-uebersicht-aktuell-9fc3nh und arbeite genau nach dem Abschnitt „Arbeitsweise für die neue Sitzung“. Übernimm zuerst den Stand dieses Branches in deinen Arbeitsbranch. Bild 1 (Startseite, v4) und Bild 1b (Kundenakte, v1) sind freigegeben. Bild 2 (Übersicht „Aktuell“) liegt als v2 vor (siehe Fortschritt und Übergabeprotokoll Sitzung 7). Bild 2 v2 wurde mir bereits gezeigt. Frag mich nach meiner Freigabe oder weiteren Wünschen zu Bild 2 v2 (zeig die Bilder bei Bedarf noch einmal) und frag mich außerdem, ob der Übersichtstitel auch in den PDF-Kopf soll. Warte dann auf meine Freigabe oder weitere Wünsche. Nach der Freigabe geht es mit Bild 3 (Neu) weiter. Halte den Fortschritt laufend in HANDOFF.md fest und erstelle nach Abschluss eines Bildes ein Übergabeprotokoll mit dem Prompt für den nächsten Chat.

## Übergabeprotokoll Sitzung 8 (02.11.2026) – Bild 2 abgeschlossen
- **Branch:** `claude/bild-2-uebersicht-freigabe-spohqz` (Stand von `claude/bild-2-uebersicht-aktuell-9fc3nh` per Fast-Forward übernommen), alles committet und gepusht.
- **Erledigt:** Bild 2 (Aktuell) v2 **freigegeben**. Bild 3 (Neu) v1 im freigegebenen Design erzeugt (`3-neu-v1.png`, `3-neu-v1-ganz.png`), gezeigt und beschrieben.
- **Nachtrag:** Nutzer wünschte zu Bild 3 v1: Ersparnis nur optional anzeigen; Titel „Jahresgespräch“ nur optional ins PDF. → Bild 3 v2 umgesetzt und gezeigt. Titel-Frage damit beantwortet (Option im PDF-Dialog, Bild 5).
- **Offen:** (a) Freigabe Bild 3 v2. (b) PDF-Dialog (Bild 5): Häkchen „Titel im PDF-Kopf“ zeigen. (c) Abgewählter Bereich und Dialog „Auf Desktop speichern“ bei den fehlenden Screens zeigen. (d) Kundenakte (b): Übersichtstitel auf der Startseite – unbestätigt.
- **Werkzeuge:** Generator `python3 mockups/werkzeug/generieren.py mockups`. Screenshot: Playwright, Viewport 1488×900 bzw. 1488×3080 (Neu ganz), `file:///home/user/Real-Vertrags-bersicht-/mockups/neu.html`; Kopfzeile `scrollWidth` = `clientWidth` = 1192 prüfen.

**Prompt für den nächsten Chat:**
> Lies HANDOFF.md auf dem Branch claude/bild-2-uebersicht-freigabe-spohqz und arbeite genau nach dem Abschnitt „Arbeitsweise für die neue Sitzung“. Übernimm zuerst den Stand dieses Branches in deinen Arbeitsbranch. Bild 1 (Startseite, v4), Bild 1b (Kundenakte, v1) und Bild 2 (Übersicht „Aktuell“, v2) sind freigegeben. Bild 3 (Übersicht „Neu“) liegt als v2 vor und wurde mir gezeigt (siehe Fortschritt und Übergabeprotokoll Sitzung 8). Frag mich nach meiner Freigabe oder weiteren Wünschen zu Bild 3 v2 (zeig die Bilder bei Bedarf noch einmal) und warte auf meine Antwort. Nach der Freigabe geht es mit Bild 4 (Nebeneinander) weiter. Halte den Fortschritt laufend in HANDOFF.md fest und erstelle nach Abschluss eines Bildes ein Übergabeprotokoll mit dem Prompt für den nächsten Chat.

# Phase 2 – Plan: Vertragsübersicht (Desktop-App)

**Status:** Entwurf · wartet auf Freigabe · Stand 02.11.2026
Grundlage: `STAND.md` (Briefing + 15 Entscheidungen aus Phase 1).

---

## 1. Technologie (2 Optionen)

| | **A – Electron + React/TypeScript** ✅ Empfehlung | **B – Tauri 2 + React/TypeScript** |
|---|---|---|
| Prinzip | Web-Oberfläche + gebündeltes Chromium | Web-Oberfläche + System-WebView, Rust-Kern |
| PDF | `printToPDF` von Chromium: **identisches Layout auf Windows und Mac**, exakt wie in der App, saubere Seitenumbrüche per CSS | Kein eingebauter PDF-Export. Windows nutzt WebView2 (Chromium), Mac nutzt WebKit, daher abweichende Darstellung → separate PDF-Engine nötig (doppeltes Design) |
| Größe/RAM | ~100 MB Installer, höherer RAM | ~10 MB, sparsam |
| Dateizuordnung, mehrere Fenster, Auto-Update | ausgereift (electron-builder, electron-updater) | vorhanden, weniger erprobt |
| Ökosystem (Drag & Drop, Live-Sync, Microsoft-Login) | sehr groß, alles in JS | gut, Teile in Rust |
| Aufwand/Risiko | gering | mittel (PDF + Mac-Abweichungen) |

**Empfehlung A (Electron).** Das PDF ist die wichtigste Anforderung. Nur mit Electron sind App und PDF garantiert pixelgleich, auf Windows und Mac. Die größere Installationsdatei spielt für Büro-PCs keine Rolle.

Bausteine (nur mit echtem Mehrwert):
- UI: React + TypeScript, eigenes schlankes CSS im Apple-Stil (SF-Pro-ähnlich: „Inter“), Symbole: Lucide
- Drag & Drop: dnd-kit
- Live-Zusammenarbeit: **Yjs** (CRDT, konfliktfrei)
- Microsoft (Outlook/OneDrive): MSAL + Microsoft Graph
- Tests: Vitest für die gesamte Berechnungslogik
- Paketierung/Updates: electron-builder + electron-updater (Windows-Installer, Mac-DMG)

## 2. Mehrbenutzer-Lösung (löst Konflikt OneDrive ↔ Live-Bearbeitung)

Wenn mehrere Personen gleichzeitig dieselbe Datei auf OneDrive speichern, entstehen Konflikt-Kopien. Echtes Live-Arbeiten am selben Kunden geht damit nicht. Lösung in zwei Varianten:

| | **M1 – Kleiner Sync-Server (EU)** ✅ Empfehlung | **M2 – Nur OneDrive (ohne Server)** |
|---|---|---|
| Live? | Ja, echtes Live (< 1 s), Cursor/„wer bearbeitet gerade“ sichtbar | Nahezu live: Verzögerung je nach OneDrive-Sync wenige Sekunden bis ~1 Min. |
| Technik | Yjs-Server (Hocuspocus) in Deutschland (z. B. Hetzner), TLS, Login über Microsoft-Konto der Agentur | Jeder Nutzer schreibt eigene Änderungsdateien (Yjs-Updates) in einen SharePoint-Ordner, die App führt sie konfliktfrei zusammen |
| Kosten | ~5–10 €/Monat + Einrichtung | 0 € |
| DSGVO | Zusätzlicher Auftragsverarbeiter (AVV mit Hoster) | Daten bleiben vollständig in Microsoft 365 |
| Offline | Ja (lokaler Zwischenspeicher, gleicht später ab) | Ja |
| OneDrive-Rolle | Exportdateien + tägliches Backup | Hauptspeicher |

Beide Varianten nutzen dasselbe Datenmodell (Yjs), daher ist ein späterer Wechsel M2 → M1 ohne Datenverlust möglich.
**Empfehlung M1**, weil „live, auch am selben Kunden“ ausdrücklich gewünscht ist. **M2 ist eine gute Wahl**, wenn wenige Sekunden Verzögerung reichen und kein Server gewünscht ist.

## 3. Datenmodell (vereinfacht)

```
Kunde        { id, name, erstellt, geändert }
Übersicht    { id, kundeId, aktuell: Fassung, neu: Fassung, syncAktiv: bool,
               vorteile: { aktiv, stichpunkte[] }, aufgaben: Aufgabe[] }
Fassung      { bereiche: Bereich[4] }
Bereich      { typ: VERS|SPAR|DARL|AV, aktiv: bool, untergruppen: Untergruppe[] }
Untergruppe  { id, quelleId?, name, symbol, reihenfolge, vertraege: Vertrag[] }
Vertrag      { id, quelleId?, name, bemerkung (mehrzeilig), reihenfolge, + Felder je Typ }
Aufgabe      { id, text, faellig: Datum, erledigt: bool }
Vorlage      { id, name, bereichTyp, untergruppen[] }   // Standard + eigene
Einstellungen{ schnellstart: Link[5–8], kiAnbieter, mailKonto }   // lokal je Nutzer
```

Felder je Bereich (Beträge intern als **ganze Cent**, nie Kommazahlen):
- **VERS:** beitrag, zahlweise
- **SPAR:** sparrate, zahlweise, einmalbetrag, guthaben, wertentwicklung
- **DARL:** rate, zahlweise, restschuld, zinsbindungBis
- **AV:** beitrag, einmalbeitrag, zahlweise, leistung { betrag, art: RENTE_MTL|KAPITAL|GUTHABEN|TODESFALL }, laufzeitBis

**Rechenregeln** (vollständig getestet):
- Zahlweise → Monat: monatlich ÷1, vierteljährlich ÷3, halbjährlich ÷6, jährlich ÷12. „Einmalig“ fließt **nie** in Monatssummen ein.
- Einmalbeträge werden separat summiert und nur angezeigt, wenn > 0.
- Rundung: kaufmännisch auf Cent, erst bei der Summe (keine Rundungsfehler-Kette).
- SPAR Gesamtvermögen = Σ (guthaben + wertentwicklung).
- Gesamt/Monat = Σ aktive Bereiche (Beiträge + Sparraten + Raten).
- Vorteile: Differenz Neu − Aktuell je Monat und Jahr → „Ersparnis“ bzw. „Mehrbeitrag“.

**Sync Aktuell → Neu:** Jedes Element in „Neu“ merkt sich sein Ursprungselement (`quelleId`). Bei aktivem Schalter wird jede Änderung in „Aktuell“ auf das passende Element in „Neu“ übertragen (neu, ändern, löschen, verschieben). Wurde ein Element in „Neu“ bereits gelöscht, wird es nicht wieder angelegt. Beim Ausschalten wird nichts rückwirkend geändert.

**Datei „Stand einfrieren“:** Endung `.vtue`. Inhalt: JSON-Momentaufnahme + Versionsnummer, optional mit Passwort verschlüsselt (AES-256-GCM, Schlüssel per scrypt). Doppelklick öffnet ein eigenes Fenster, mehrere Dateien gleichzeitig möglich. Eine eingefrorene Datei ist unabhängig vom Live-Bestand und kann als neue Übersicht übernommen werden.

## 4. Weitere Funktionen – technische Lösung

- **PDF:** Eigene Druckansicht mit denselben Komponenten wie die App. Kopfzeile auf jeder Seite. Bereiche und Untergruppen werden nicht ungünstig getrennt (`break-inside: avoid`, Tabellenkopf wiederholt sich). Bemerkungen brechen vollständig um. Bei „Beide“: Aktuell, dann Neu, optional eine Vergleichsseite.
- **KI-Import:** Anbieterunabhängige Schnittstelle (z. B. OpenAI, Anthropic, Google, Mistral, Azure OpenAI EU). Ablauf: Unterlagen auswählen → KI liefert strukturierte Daten nach festem Schema → **Prüf-Dialog** (jede Zeile annehmen, ändern oder verwerfen) → Übernahme nach „Aktuell“. Der API-Schlüssel liegt im sicheren Speicher des Betriebssystems. Unterlagen werden nicht gespeichert.
- **E-Mail:** Anmeldung mit dem Microsoft-Konto (einmalig) → Senden über Microsoft Graph aus dem eigenen Postfach. PDF-Anhang optional, Mail liegt danach in „Gesendete Elemente“.
- **Schnellstart:** 5–8 Kacheln (Name, Symbol, Link oder Programmpfad), frei konfigurierbar.
- **Aufgaben:** Liste je Übersicht mit Fälligkeitsdatum. Fällige Aufgaben werden in der Kundenliste markiert.
- **Updates:** automatisch im Hintergrund, Installation beim nächsten Start.

## 5. DSGVO-Konzept

- **Datensparsamkeit:** Nur der Kundenname wird gespeichert. Unterlagen werden nur ausgewertet und danach verworfen.
- **Speicherorte:** Microsoft 365 der Agentur (Export, Backup), dazu bei M1 ein Sync-Server in Deutschland. Verschlüsselte Übertragung (TLS), verschlüsselte Exportdateien optional.
- **Zugriff:** Nur Konten der Agentur (Microsoft-Login). Lokaler Zwischenspeicher liegt im Benutzerprofil (Windows-Anmeldung schützt).
- **KI:** Vor dem Senden wird der **Kundenname automatisch entfernt** (Pseudonymisierung). Empfehlung: Anbieter mit EU-Verarbeitung und AVV, ohne Training mit Kundendaten. Vor dem ersten KI-Import erscheint ein Hinweis.
- **Löschen:** Kunde löschen entfernt alle Daten auf allen Geräten und dem Server. Backups rotieren nach 30 Tagen.
- **Dokumentation:** Vorlage für das Verzeichnis von Verarbeitungstätigkeiten (VVT) wird mitgeliefert.

## 6. Funktionsliste

**Muss**
- 4 Bereiche (einzeln an-/abwählbar), Untergruppen mit Name + Symbol, Verträge: anlegen, umbenennen, löschen, Drag & Drop
- Alle Spalten und Summen laut Briefing, Einmalbeträge getrennt, Gesamt/Monat
- Aktuell/Neu: einzeln und nebeneinander, Sync-Schalter
- PDF: Aktuell / Neu / Beide (+ optionale Vergleichsseite), mehrzeilige Bemerkungen
- Live-Mehrbenutzer (M1 oder M2), offlinefähig
- Stand einfrieren als Datei, Doppelklick öffnet, mehrere Fenster
- Vorteile-Abschnitt mit automatischer Ersparnis
- Standard-Untergruppen, Autovervollständigung, eigene Vorlagen
- Windows-Installer + Auto-Update
- DSGVO-Maßnahmen aus Abschnitt 5

**Soll**
- KI-Import mit Prüf-Dialog
- Outlook-Versand mit PDF-Anhang
- Aufgaben mit Fälligkeit
- Schnellstart-Kacheln
- Verschlüsselte Exportdateien
- Mac-Version

**Kann (eigene Vorschläge)**
- **Rückgängig/Wiederholen** (Strg+Z), auch bei gemeinsamer Bearbeitung nur für eigene Änderungen
- **Kundensuche** mit Schnellöffnen (Strg+K)
- **„Wer ist gerade hier“-Anzeige** bei gleichzeitiger Bearbeitung (nur M1 in Echtzeit)
- **Neu aus Aktuell kopieren**: ein Klick als Startpunkt für die Beratung
- **Hell-/Dunkelmodus** (PDF bleibt immer hell)
- **Tastatursteuerung** für schnelles Erfassen (Enter = nächste Zeile)

## 7. Umsetzung (Phase 4) – Meilensteine
1. Datenmodell & Berechnungen + Tests
2. Editor (Bereiche, Untergruppen, Verträge, Drag & Drop, Vorlagen)
3. Aktuell/Neu-Vergleich + Sync-Schalter + Vorteile
4. PDF-Export
5. Zusatzfunktionen: Mehrbenutzer, Dateien, KI, Outlook, Aufgaben, Schnellstart, Updates, Mac

## 8. Hinweise / Voraussetzungen
- **Code-Signatur:** Für Windows (ohne SmartScreen-Warnung) ist ein Signaturzertifikat nötig, ca. 200–400 €/Jahr. Für Mac braucht es ein Apple-Developer-Konto (99 $/Jahr) zur Beglaubigung. Ohne Signatur funktioniert die App, zeigt aber Warnungen.
- **Microsoft-Anmeldung:** Einmalig muss die App in Entra ID (Microsoft 365) der Agentur registriert werden. Das dauert etwa 10 Minuten, eine Anleitung wird mitgeliefert.
- **KI-Konto:** Ein API-Schlüssel des gewählten Anbieters ist nötig, ein normales Chat-Abo reicht nicht.

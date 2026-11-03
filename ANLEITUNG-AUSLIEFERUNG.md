# Auslieferung: Installer, Updates, Mac

Kurzanleitung für die Agentur. Technik: electron-builder + electron-updater, Bau auf GitHub Actions (`.github/workflows/auslieferung.yml`).

## Einmalig einrichten

1. **Öffentliches Repo für Updates anlegen:** auf GitHub unter dem Konto `tjarksperling-ctrl` ein neues, **öffentliches**, leeres Repo `vertragsuebersicht-updates` anlegen. Dort liegen nur die Installer (keine Quellen, keine Kundendaten). Anderer Name? Dann in `electron-builder.yml` unter `publish: repo:` ändern.
2. **Schlüssel zum Veröffentlichen:** GitHub → Settings → Developer settings → *Fine-grained tokens* → neuer Token, nur für `vertragsuebersicht-updates`, Recht *Contents: Read and write*.
3. **Schlüssel hinterlegen:** in *diesem* Repo → Settings → Secrets and variables → Actions → *New repository secret*, Name `UPDATES_TOKEN`, Wert = der Token.

## Neue Version veröffentlichen

1. In `package.json` die Version erhöhen (z. B. `0.1.0` → `0.2.0`), committen.
2. Tag setzen und pushen: `git tag v0.2.0 && git push origin v0.2.0`.
3. GitHub Actions baut Windows-Setup und Mac-DMG, prüft Tests und Typen und veröffentlicht alles als Release in `vertragsuebersicht-updates`.
4. Die installierten Apps finden das Update innerhalb von 4 Stunden (oder sofort über *Einstellungen → Allgemein → Nach Updates suchen*), laden es im Hintergrund und installieren es beim nächsten Start. Unten in der Seitenleiste erscheint „Update bereit“ mit „Jetzt neu starten“.

Nur bauen, ohne zu veröffentlichen: GitHub → Actions → *Auslieferung* → *Run workflow*. Die Dateien liegen danach unter *Artifacts*.

Lokal (Windows-Rechner oder Linux mit Wine): `npm run installer` baut nur, `GH_TOKEN=… npm run veroeffentlichen` baut und veröffentlicht das Windows-Setup.

## Installieren

- **Windows:** `Vertragsuebersicht-Setup-<Version>.exe`. Ohne Zertifikat warnt Windows „Unbekannter Herausgeber“ → *Weitere Informationen* → *Trotzdem ausführen*. Das gilt nur für die erste Installation; Updates laufen danach ohne Rückfrage.
- **Mac:** `Vertragsuebersicht-<Version>-arm64.dmg` (Apple-Chip, ab 2020) oder `-x64.dmg` (Intel). App in *Programme* ziehen, beim ersten Start **Rechtsklick → Öffnen**. Ab macOS 15: *Systemeinstellungen → Datenschutz & Sicherheit → Dennoch öffnen*. **Auf dem Mac gibt es ohne Apple-Konto keine automatischen Updates**, neue Versionen werden von Hand installiert.
- **Daten:** Kundendaten liegen im Benutzerprofil (Windows `%APPDATA%\vertragsuebersicht\daten`, Mac `~/Library/Application Support/vertragsuebersicht/daten`). Updates und Deinstallation lassen sie unberührt.

## Signatur (später)

Sobald ein Zertifikat vorhanden ist, nur Secrets eintragen. Am Code muss nichts geändert werden:

| Secret | Wofür |
|---|---|
| `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD` | Windows-Code-Signatur (.pfx als Base64 + Passwort), ca. 200–400 €/Jahr. Danach keine SmartScreen-Warnung mehr. |
| `CSC_LINK`, `CSC_KEY_PASSWORD` | Mac: „Developer ID Application“-Zertifikat (.p12 als Base64 + Passwort), Apple-Developer-Konto 99 $/Jahr. |
| `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` | Mac-Beglaubigung (Notarisierung). Danach sind auch auf dem Mac automatische Updates möglich. |

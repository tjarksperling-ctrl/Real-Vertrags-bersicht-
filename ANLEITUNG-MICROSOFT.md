# Microsoft 365 einrichten (Outlook-Versand und KI-Import über Copilot)

Einmalig für die ganze Agentur, ca. 10 Minuten. Nötig ist ein Konto mit der Rolle **Globaler Administrator** (oder „Anwendungsadministrator“ + „Administrator für privilegierte Rollen“ für die Zustimmung). Es entstehen **keine geheimen Schlüssel**: Die App meldet jede Person im Browser an, Passwörter sieht sie nie.

Der **gemeinsame Ordner** (Mehrbenutzer) braucht **keine** Einrichtung in Entra ID – er läuft über das OneDrive-Programm, siehe unten.

## 1. App registrieren

1. <https://entra.microsoft.com> öffnen und als Administrator anmelden.
2. Links **Identität → Anwendungen → App-Registrierungen** → **Neue Registrierung**.
3. Ausfüllen:
   - **Name:** `Vertragsübersicht`
   - **Unterstützte Kontotypen:** *Nur Konten in diesem Organisationsverzeichnis (nur Agentur … – einzelner Mandant)*
   - **Umleitungs-URI:** Plattform *Öffentlicher Client/nativ (mobil und Desktop)*, Wert `http://localhost`
4. **Registrieren**.
5. Auf der Seite **Übersicht** zwei Werte notieren:
   - **Anwendungs-ID (Client)**
   - **Verzeichnis-ID (Mandant)**

## 2. Öffentliche Clientflows erlauben

**Authentifizierung** (links) → ganz unten **Öffentliche Clientflows zulassen: Ja** → **Speichern**.
Prüfen, dass unter *Mobile Anwendungen und Desktopanwendungen* `http://localhost` steht.

## 3. Rechte (API-Berechtigungen)

**API-Berechtigungen → Berechtigung hinzufügen → Microsoft Graph → Delegierte Berechtigungen** und diese Rechte anhaken:

| Wofür | Rechte |
|---|---|
| Anmeldung | `User.Read`, `offline_access` |
| Outlook-Versand | `Mail.Send`, `Mail.ReadWrite` (Entwurf in Outlook öffnen), `People.Read` (Kontaktvorschläge) |
| KI-Import: Unterlage kurz im eigenen OneDrive ablegen | `Files.ReadWrite` |
| KI-Import: Copilot-Chat-API (laut Microsoft alle Pflicht) | `Sites.Read.All`, `Mail.Read`, `People.Read.All`, `OnlineMeetingTranscript.Read.All`, `Chat.Read`, `ChannelMessage.Read.All`, `ExternalItem.Read.All` |

Danach **Administratorzustimmung für „Agentur …“ erteilen** → **Ja**. In der Liste muss bei jedem Recht ein grünes Häkchen „Gewährt“ stehen.

> Hinweis: Die Copilot-Rechte erlauben der App *im Namen der angemeldeten Person* zu lesen – die App nutzt davon nur, was Copilot für die Auswertung der hochgeladenen Unterlage braucht (Microsoft verlangt die vollständige Liste). Wer keinen KI-Import möchte, lässt die letzte Zeile weg; Outlook funktioniert trotzdem.

## 4. Lizenzen

- **Outlook-Versand:** jedes Microsoft-365-Konto mit Postfach (Exchange Online).
- **KI-Import über Copilot:** jede Person, die den KI-Import nutzt, braucht die Zusatzlizenz **„Microsoft 365 Copilot“**. Das kostenlose „Copilot Chat“ reicht laut Microsoft nicht.
- Die Copilot-Chat-API ist bei Microsoft noch eine **Vorschau** (beta). Microsoft kann sie ändern; dann passt der nächste Update die App an.

## 5. In der App eintragen

1. App öffnen → **Einstellungen → Outlook**.
2. Unter „Microsoft-Zugang der Agentur einrichten“ **Anwendungs-ID** und **Verzeichnis-ID** eintragen → **Übernehmen**.
   Ist ein gemeinsamer Ordner eingerichtet, gilt das automatisch für alle im Team.
3. **Bei Microsoft anmelden** → Browser öffnet sich → mit dem eigenen Agentur-Konto anmelden → „Angemeldet“.
4. **Einstellungen → KI-Konto → Verbindung testen.** Beim ersten KI-Import fragt Microsoft ggf. noch einmal im Browser nach.

## Gemeinsamer Ordner (Mehrbenutzer, ohne Entra ID)

1. In SharePoint (Team-Website der Agentur) einen Ordner anlegen, z. B. `Vertragsübersicht`, und für alle Mitarbeitenden freigeben (Bearbeiten).
2. Auf **jedem PC**: im Browser den Ordner öffnen → **Synchronisieren** (oder „Verknüpfung zu ‚Meine Dateien‘ hinzufügen“). Das OneDrive-Programm zeigt ihn danach im Explorer.
3. Empfehlung: Rechtsklick auf den Ordner → **Immer auf diesem Gerät beibehalten** (dann geht alles auch offline sofort).
4. App → **Einstellungen → Speicherort → SharePoint → Ordner wählen …** → den synchronisierten Ordner wählen → **Speichern**. Die eigenen Kunden werden übernommen, nichts geht verloren.
5. Die anderen machen Schritt 2–4 mit demselben Ordner. Änderungen erscheinen bei den anderen nach wenigen Sekunden (je nach OneDrive).

Im Ordner legt die App einen Unterordner `Vertragsuebersicht` an. Bitte darin **nichts von Hand ändern**: Jede Person schreibt nur ihre eigene Datei je Übersicht; die App führt alles zusammen.

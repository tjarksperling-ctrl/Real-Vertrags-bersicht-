/**
 * E-Mail über Outlook (M5b, Bild 8 „Outlook“ + Bild 5 „Per E-Mail senden“): reine Logik ohne Electron.
 * Vorlage mit Platzhaltern, Text → HTML, Graph-Nachricht.
 */

export interface OutlookEinstellungen {
  /** An: Outlook öffnet die fertige Mail (Entwurf), Sie senden selbst. Aus: „Erstellen & senden“ schickt sofort. */
  vorOeffnen: boolean;
  /** Empfänger aus Outlook-Kontakten vorschlagen. */
  kontakte: boolean;
  /** Signatur anhängen (Graph liefert die Outlook-Signatur nicht – daher hier einmal eintragen). */
  signaturAn: boolean;
  signatur: string;
  betreff: string;
  text: string;
}

export const PLATZHALTER = ['Kunde', 'Titel', 'Datum', 'Mein Name'] as const;
export type Platzhalter = (typeof PLATZHALTER)[number];

export const STANDARD_OUTLOOK: OutlookEinstellungen = {
  vorOeffnen: false,
  kontakte: true,
  signaturAn: false,
  signatur: '',
  betreff: 'Ihre Vertragsübersicht – {Titel}',
  text: 'Guten Tag {Kunde},\n\nanbei erhalten Sie Ihre Vertragsübersicht „{Titel}“ vom {Datum}. Bei Fragen melden Sie sich gern.\n\nViele Grüße\n{Mein Name}',
};

/** Platzhalter {Kunde}, {Titel}, {Datum}, {Mein Name} ersetzen (unbekannte bleiben stehen). */
export function vorlageFuellen(vorlage: string, werte: Record<Platzhalter, string>): string {
  return vorlage.replace(/\{(Kunde|Titel|Datum|Mein Name)\}/g, (_m, k: Platzhalter) => werte[k] ?? '');
}

const escape = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Text (mit Absätzen) + optionale Signatur → schlichtes HTML im Stil von Outlook. */
export function mailHtml(text: string, signatur?: string): string {
  const absatz = (t: string) =>
    t
      .trim()
      .split(/\n{2,}/)
      .map((p) => `<p>${escape(p).replace(/\n/g, '<br>')}</p>`)
      .join('');
  const sig = signatur?.trim() ? `<p style="color:#555">${escape(signatur.trim()).replace(/\n/g, '<br>')}</p>` : '';
  return `<div style="font-family:Calibri,Arial,sans-serif;font-size:11pt">${absatz(text)}${sig}</div>`;
}

const MAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/;

/** „a@b.de; c@d.de“ → Liste; ungültige Teile kommen in `fehler`. */
export function empfaengerLesen(feld: string): { gueltig: string[]; fehler: string[] } {
  const teile = feld
    .split(/[;,\s]+/)
    .map((t) => t.trim().replace(/^<|>$/g, ''))
    .filter(Boolean);
  return { gueltig: teile.filter((t) => MAIL.test(t)), fehler: teile.filter((t) => !MAIL.test(t)) };
}

/** Graph: Anhänge über 3 MB bräuchten eine Upload-Sitzung – eine Vertragsübersicht ist weit kleiner. */
export const MAX_ANHANG = 3 * 1024 * 1024;

export interface MailAuftrag {
  an: string[];
  betreff: string;
  html: string;
  anhang?: { name: string; daten: Uint8Array };
  /** Nur Entwurf anlegen und in Outlook öffnen. */
  entwurf: boolean;
}

function base64(d: Uint8Array): string {
  let s = '';
  for (let i = 0; i < d.length; i += 0x8000) s += String.fromCharCode(...d.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Nachricht im Format von Microsoft Graph (`message`). */
export function graphNachricht(m: MailAuftrag): Record<string, unknown> {
  return {
    subject: m.betreff,
    body: { contentType: 'HTML', content: m.html },
    toRecipients: m.an.map((address) => ({ emailAddress: { address } })),
    ...(m.anhang
      ? {
          attachments: [
            {
              '@odata.type': '#microsoft.graph.fileAttachment',
              name: m.anhang.name,
              contentType: 'application/pdf',
              contentBytes: base64(m.anhang.daten),
            },
          ],
        }
      : {}),
  };
}

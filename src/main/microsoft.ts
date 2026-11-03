/**
 * Microsoft-Anmeldung und Graph (M5b): Outlook-Versand, später Copilot (KI-Import).
 * - Anmeldung über den Browser (MSAL, öffentlicher Client, Rückleitung auf http://localhost) – die App sieht kein Passwort.
 * - Anmeldedaten (Token) verschlüsselt mit dem Schlüsselbund des Betriebssystems (safeStorage) im Benutzerprofil.
 * - Zugang der Agentur (Anwendungs-ID + Verzeichnis-ID aus Entra ID): Umgebung → gemeinsamer Ordner → Benutzerprofil.
 * - VTUE_MS_DEMO=1: Vorführmodus ohne Netz (Screenshots/Tests).
 */
import { app, safeStorage, shell } from 'electron';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PublicClientApplication, type AccountInfo, type ICachePlugin, type TokenCacheContext } from '@azure/msal-node';
import type { MsKonto, MsZugang } from '../shared/api';
import { graphNachricht, MAX_ANHANG, type MailAuftrag } from '../shared/microsoft/mail';
import { aktuelleAblage } from './ablage-ipc';
import { sicherSchreiben } from './ablage';

export const GRAPH = 'https://graph.microsoft.com';
export const SCOPES_OUTLOOK = ['User.Read', 'Mail.Send', 'Mail.ReadWrite', 'People.Read'];
/** Laut Microsoft braucht die Copilot-Chat-API alle diese Rechte; dazu OneDrive für die kurzzeitige Ablage der Unterlage. */
export const SCOPES_COPILOT = [
  'Files.ReadWrite',
  'Sites.Read.All',
  'Mail.Read',
  'People.Read.All',
  'OnlineMeetingTranscript.Read.All',
  'Chat.Read',
  'ChannelMessage.Read.All',
  'ExternalItem.Read.All',
];

const demo = () => process.env['VTUE_MS_DEMO'] === '1';
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class MsFehler extends Error {}

// ---------------------------------------------------------------- Zugang der Agentur

const zugangPfad = () => join(app.getPath('userData'), 'microsoft.json');

export async function zugangLesen(): Promise<MsZugang | null> {
  const env = { clientId: process.env['VTUE_MS_CLIENT'] ?? '', tenantId: process.env['VTUE_MS_TENANT'] ?? '' };
  if (GUID.test(env.clientId) && GUID.test(env.tenantId)) return env;
  if (demo()) return { clientId: '00000000-0000-0000-0000-000000000000', tenantId: '00000000-0000-0000-0000-000000000000' };
  const ag = (await aktuelleAblage().agenturLesen()) as { microsoft?: MsZugang } | null;
  if (ag?.microsoft && GUID.test(ag.microsoft.clientId) && GUID.test(ag.microsoft.tenantId)) return ag.microsoft;
  try {
    const j = JSON.parse(await readFile(zugangPfad(), 'utf8')) as MsZugang;
    if (GUID.test(j.clientId) && GUID.test(j.tenantId)) return j;
  } catch {
    /* noch nicht eingerichtet */
  }
  return null;
}

/** Anwendungs-ID + Verzeichnis-ID speichern (bei gemeinsamem Ordner für die ganze Agentur). */
export async function zugangSetzen(z: MsZugang): Promise<void> {
  const clientId = z.clientId.trim();
  const tenantId = z.tenantId.trim();
  if (!GUID.test(clientId) || !GUID.test(tenantId)) throw new MsFehler('Bitte beide IDs vollständig eintragen (Format 8-4-4-4-12 Zeichen).');
  await sicherSchreiben(zugangPfad(), JSON.stringify({ clientId, tenantId }, null, 2));
  const a = aktuelleAblage();
  if (a.gemeinsam) {
    const alt = ((await a.agenturLesen()) as Record<string, unknown> | null) ?? {};
    await a.agenturSchreiben({ ...alt, microsoft: { clientId, tenantId } });
  }
  pca = null;
}

// ---------------------------------------------------------------- Anmeldung

const cachePfad = () => join(app.getPath('userData'), 'ms-anmeldung.bin');

const cachePlugin: ICachePlugin = {
  async beforeCacheAccess(c: TokenCacheContext) {
    try {
      const b = await readFile(cachePfad());
      c.tokenCache.deserialize(safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(b) : '');
    } catch {
      /* noch keine Anmeldung */
    }
  },
  async afterCacheAccess(c: TokenCacheContext) {
    if (!c.cacheHasChanged || !safeStorage.isEncryptionAvailable()) return;
    await sicherSchreiben(cachePfad(), safeStorage.encryptString(c.tokenCache.serialize()));
  },
};

let pca: PublicClientApplication | null = null;
let pcaFuer = '';

async function client(): Promise<PublicClientApplication> {
  const z = await zugangLesen();
  if (!z) throw new MsFehler('Der Microsoft-Zugang der Agentur ist noch nicht eingerichtet (Einstellungen → Outlook).');
  const schluessel = `${z.clientId}/${z.tenantId}`;
  if (!pca || pcaFuer !== schluessel) {
    pca = new PublicClientApplication({
      auth: { clientId: z.clientId, authority: `https://login.microsoftonline.com/${z.tenantId}` },
      cache: { cachePlugin },
    });
    pcaFuer = schluessel;
  }
  return pca;
}

async function konto(): Promise<AccountInfo | null> {
  const l = await (await client()).getTokenCache().getAllAccounts();
  return l[0] ?? null;
}

const SEITE = (titel: string, text: string) =>
  `<!doctype html><meta charset="utf-8"><title>${titel}</title><body style="font-family:-apple-system,Segoe UI,sans-serif;display:grid;place-items:center;height:100vh;margin:0;background:#fbfbfd;color:#1d1d1f"><div style="text-align:center"><h2 style="font-weight:600">${titel}</h2><p style="color:#6e6e73">${text}</p></div>`;

/** Token für diese Rechte – still aus dem Speicher, sonst Anmeldung im Browser. */
export async function token(scopes: string[], interaktiv = true): Promise<string> {
  const c = await client();
  const k = await konto();
  if (k) {
    try {
      return (await c.acquireTokenSilent({ account: k, scopes })).accessToken;
    } catch {
      if (!interaktiv) throw new MsFehler('Bitte erneut bei Microsoft anmelden (Einstellungen → Outlook).');
    }
  } else if (!interaktiv) throw new MsFehler('Nicht bei Microsoft angemeldet (Einstellungen → Outlook).');
  const r = await c.acquireTokenInteractive({
    scopes,
    openBrowser: async (url) => void (await shell.openExternal(url)),
    successTemplate: SEITE('Angemeldet', 'Sie können dieses Fenster schließen und zur Vertragsübersicht zurückkehren.'),
    errorTemplate: SEITE('Anmeldung fehlgeschlagen', 'Bitte in der Vertragsübersicht erneut versuchen.'),
    ...(k ? { loginHint: k.username } : { prompt: 'select_account' }),
  });
  return r.accessToken;
}

let demoAngemeldet = process.env['VTUE_MS_DEMO_ANGEMELDET'] === '1';
const demoSeit = new Date('2026-10-14T09:12:00').toISOString();

export async function kontoInfo(): Promise<MsKonto> {
  const z = await zugangLesen();
  if (demo())
    return demoAngemeldet
      ? { eingerichtet: true, angemeldet: true, name: 'Tjark Sperling', mail: 't.sperling@agentur-muster.de', seit: demoSeit }
      : { eingerichtet: true, angemeldet: false };
  if (!z) return { eingerichtet: false, angemeldet: false };
  const k = await konto().catch(() => null);
  if (!k) return { eingerichtet: true, angemeldet: false };
  const seit = (k.idTokenClaims?.['iat'] as number | undefined) ? new Date((k.idTokenClaims!['iat'] as number) * 1000).toISOString() : undefined;
  return { eingerichtet: true, angemeldet: true, name: k.name ?? k.username, mail: k.username, ...(seit ? { seit } : {}) };
}

export async function anmelden(): Promise<MsKonto> {
  if (demo()) {
    demoAngemeldet = true;
    return kontoInfo();
  }
  // erst abmelden, damit „Anderes Konto“ wirklich die Auswahl zeigt
  await token(SCOPES_OUTLOOK);
  return kontoInfo();
}

export async function abmelden(): Promise<void> {
  if (demo()) {
    demoAngemeldet = false;
    return;
  }
  const c = await client();
  for (const k of await c.getTokenCache().getAllAccounts()) await c.getTokenCache().removeAccount(k);
}

// ---------------------------------------------------------------- Graph

export async function graph<T>(methode: string, pfad: string, scopes: string[], body?: unknown, extra: RequestInit = {}): Promise<T> {
  const t = await token(scopes, false);
  const r = await fetch(pfad.startsWith('http') ? pfad : `${GRAPH}${pfad}`, {
    method: methode,
    ...extra,
    headers: {
      Authorization: `Bearer ${t}`,
      ...(body !== undefined && !(body instanceof Uint8Array) ? { 'Content-Type': 'application/json' } : {}),
      ...(extra.headers as Record<string, string> | undefined),
    },
    ...(body !== undefined ? { body: body instanceof Uint8Array ? Buffer.from(body) : JSON.stringify(body) } : {}),
  });
  if (!r.ok) {
    let text = '';
    try {
      const j = (await r.json()) as { error?: { message?: string; code?: string } };
      text = j.error?.message ?? j.error?.code ?? '';
    } catch {
      /* kein JSON */
    }
    if (r.status === 401 || r.status === 403) throw new MsFehler(`Microsoft verweigert den Zugriff (${r.status}). ${text} – Rechte in Entra ID und Administratorzustimmung prüfen.`);
    throw new MsFehler(`Microsoft meldet einen Fehler (${r.status}). ${text}`.trim());
  }
  if (r.status === 202 || r.status === 204) return undefined as T;
  return (await r.json()) as T;
}

// ---------------------------------------------------------------- Outlook

export interface MailErgebnis {
  ok: boolean;
  fehler?: string;
  /** Entwurf: in Outlook geöffnet. */
  geoeffnet?: boolean;
}

export async function mailSenden(m: MailAuftrag): Promise<MailErgebnis> {
  if (!m.an.length) return { ok: false, fehler: 'Bitte einen Empfänger eintragen.' };
  if (m.anhang && m.anhang.daten.length > MAX_ANHANG) return { ok: false, fehler: 'Das PDF ist größer als 3 MB und kann so nicht angehängt werden.' };
  if (demo()) return { ok: true, ...(m.entwurf ? { geoeffnet: true } : {}) };
  try {
    const nachricht = graphNachricht(m);
    if (m.entwurf) {
      const e = await graph<{ webLink?: string }>('POST', '/v1.0/me/messages', SCOPES_OUTLOOK, nachricht);
      if (e.webLink) await shell.openExternal(e.webLink);
      return { ok: true, geoeffnet: !!e.webLink };
    }
    await graph('POST', '/v1.0/me/sendMail', SCOPES_OUTLOOK, { message: nachricht, saveToSentItems: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, fehler: e instanceof Error ? e.message : String(e) };
  }
}

/** Vorschläge für „An“ aus den Outlook-Kontakten (People-API). */
export async function kontakteSuchen(q: string): Promise<{ name: string; mail: string }[]> {
  const s = q.trim();
  if (s.length < 2) return [];
  if (demo())
    return [
      { name: 'Familie Berger', mail: 'berger.familie@example.de' },
      { name: 'Bernd Bergmann', mail: 'b.bergmann@example.de' },
    ].filter((k) => `${k.name} ${k.mail}`.toLowerCase().includes(s.toLowerCase()));
  try {
    const r = await graph<{ value: { displayName?: string; scoredEmailAddresses?: { address?: string }[] }[] }>(
      'GET',
      `/v1.0/me/people?$search=${encodeURIComponent(`"${s.replace(/"/g, '')}"`)}&$top=6&$select=displayName,scoredEmailAddresses`,
      SCOPES_OUTLOOK,
    );
    return r.value
      .map((p) => ({ name: p.displayName ?? '', mail: p.scoredEmailAddresses?.[0]?.address ?? '' }))
      .filter((p) => p.mail);
  } catch {
    return [];
  }
}

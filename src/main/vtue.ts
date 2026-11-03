/**
 * Dateiformat „.vtue“ (Bild 10): eingefrorener Stand einer Übersicht.
 *
 * Aufbau: UTF-8-JSON
 *   { format: "vtue", version: 1, meta: { kunde, kundeId, uebersichtId, titel, gespeichert, von },
 *     inhalt: "<Base64 Yjs-Stand>" }                                   – ohne Passwort
 *   { …, verschluesselung: { verfahren: "AES-256-GCM", kdf: "scrypt", N, r, p, salz, iv, tag },
 *     inhalt: "<Base64 verschlüsselter Yjs-Stand>" }                   – mit Passwort
 * Die Angaben in `meta` bleiben lesbar (Passwortabfrage zeigt Kunde, Titel, Datum, wer), der Inhalt
 * (alle Verträge und Beträge) ist verschlüsselt. Ohne Passwort lässt sich die Datei nicht öffnen.
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import type { VtueMeta } from '../shared/api';

export const VTUE_VERSION = 1;
const KDF = { N: 2 ** 15, r: 8, p: 1 };

interface Verschluesselung {
  verfahren: 'AES-256-GCM';
  kdf: 'scrypt';
  N: number;
  r: number;
  p: number;
  salz: string;
  iv: string;
  tag: string;
}

interface VtueDatei {
  format: 'vtue';
  version: number;
  meta: VtueMeta;
  verschluesselung?: Verschluesselung;
  inhalt: string;
}

function schluessel(passwort: string, salz: Buffer, k: { N: number; r: number; p: number }): Buffer {
  return scryptSync(passwort.normalize('NFC'), salz, 32, { N: k.N, r: k.r, p: k.p, maxmem: 128 * k.N * k.r * 2 });
}

export function vtueSchreiben(meta: VtueMeta, daten: Uint8Array, passwort?: string): Buffer {
  const d: VtueDatei = { format: 'vtue', version: VTUE_VERSION, meta, inhalt: '' };
  if (passwort) {
    const salz = randomBytes(16);
    const iv = randomBytes(12);
    const c = createCipheriv('aes-256-gcm', schluessel(passwort, salz, KDF), iv);
    c.setAAD(Buffer.from(JSON.stringify(meta), 'utf8'));
    const chiffre = Buffer.concat([c.update(daten), c.final()]);
    d.verschluesselung = { verfahren: 'AES-256-GCM', kdf: 'scrypt', ...KDF, salz: salz.toString('base64'), iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64') };
    d.inhalt = chiffre.toString('base64');
  } else {
    d.inhalt = Buffer.from(daten).toString('base64');
  }
  return Buffer.from(JSON.stringify(d, null, 1), 'utf8');
}

export class VtueFehler extends Error {}

/** Liest Kopf und prüft Format/Version. */
export function vtueLesen(roh: Buffer): VtueDatei {
  let d: VtueDatei;
  try {
    d = JSON.parse(roh.toString('utf8')) as VtueDatei;
  } catch {
    throw new VtueFehler('Keine Vertragsübersicht-Datei');
  }
  if (d?.format !== 'vtue' || typeof d.inhalt !== 'string' || typeof d.meta !== 'object' || !d.meta) throw new VtueFehler('Keine Vertragsübersicht-Datei');
  if (typeof d.version !== 'number' || d.version > VTUE_VERSION) throw new VtueFehler('Die Datei stammt aus einer neueren Version der App – bitte die App aktualisieren');
  for (const k of ['kunde', 'kundeId', 'uebersichtId', 'titel', 'gespeichert', 'von'] as const) if (typeof d.meta[k] !== 'string') throw new VtueFehler('Datei ist beschädigt');
  return d;
}

export function istVerschluesselt(d: VtueDatei): boolean {
  return !!d.verschluesselung;
}

/** Inhalt (Yjs-Stand); bei falschem Passwort `null`. */
export function vtueInhalt(d: VtueDatei, passwort?: string): Uint8Array | null {
  const roh = Buffer.from(d.inhalt, 'base64');
  const v = d.verschluesselung;
  if (!v) return new Uint8Array(roh);
  if (!passwort) return null;
  if (v.verfahren !== 'AES-256-GCM' || v.kdf !== 'scrypt') throw new VtueFehler('Unbekannte Verschlüsselung');
  try {
    const dc = createDecipheriv('aes-256-gcm', schluessel(passwort, Buffer.from(v.salz, 'base64'), v), Buffer.from(v.iv, 'base64'));
    dc.setAAD(Buffer.from(JSON.stringify(d.meta), 'utf8'));
    dc.setAuthTag(Buffer.from(v.tag, 'base64'));
    return new Uint8Array(Buffer.concat([dc.update(roh), dc.final()]));
  } catch {
    return null;
  }
}

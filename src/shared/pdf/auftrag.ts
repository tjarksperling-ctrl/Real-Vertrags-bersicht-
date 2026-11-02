/**
 * PDF-Inhalt (Meilenstein 4, Bild 5 v2 + Bild 7 v1) – reine Logik, getestet.
 * Was ins PDF kommt: abgewählte Bereiche und Untergruppen ohne Verträge nicht; „Beide“ = Aktuell, dann Neu,
 * Vergleichsseite optional; Vorteile nur bei Neu/Beide (auf der Vergleichsseite, sonst nach dem Gesamtbetrag „Neu“);
 * Ersparnis/Differenzen nur, wenn „Ersparnis anzeigen“ an ist.
 */
import type { Bereich, BereichTyp, Fassung, Uebersicht } from '../modell/typen';
import { BEREICH_TYPEN } from '../modell/typen';
import { fassungSumme } from '../rechnen/summen';

export type PdfInhalt = 'aktuell' | 'neu' | 'beide';

export interface PdfOptionen {
  inhalt: PdfInhalt;
  vergleich: boolean;
  vorteile: boolean;
  ersparnis: boolean;
  titel: boolean;
}

export type PdfAbschnitt =
  | { art: 'fassung'; fassung: 'aktuell' | 'neu'; mitDifferenz: boolean; vorteile: boolean }
  | { art: 'vergleich'; mitDifferenz: boolean; vorteile: boolean };

export function pdfAbschnitte(u: Uebersicht, o: PdfOptionen): PdfAbschnitt[] {
  const vorteile = o.vorteile && o.inhalt !== 'aktuell' && (u.vorteile.stichpunkte.some((s) => s.trim()) || o.ersparnis);
  const vergleich = o.inhalt === 'beide' && o.vergleich;
  const r: PdfAbschnitt[] = [];
  if (o.inhalt !== 'neu') r.push({ art: 'fassung', fassung: 'aktuell', mitDifferenz: false, vorteile: false });
  if (o.inhalt !== 'aktuell') r.push({ art: 'fassung', fassung: 'neu', mitDifferenz: o.ersparnis, vorteile: vorteile && !vergleich });
  if (vergleich) r.push({ art: 'vergleich', mitDifferenz: o.ersparnis, vorteile });
  return r;
}

/** Bereiche fürs PDF: nur aktive, darin nur Untergruppen mit mindestens einem Vertrag. */
export function pdfBereiche(f: Fassung): { typ: BereichTyp; b: Bereich }[] {
  return BEREICH_TYPEN.filter((t) => f.bereiche[t].aktiv)
    .map((t) => ({ typ: t, b: { ...f.bereiche[t], untergruppen: f.bereiche[t].untergruppen.filter((u) => u.vertraege.length > 0) } as Bereich }))
    .filter((x) => x.b.untergruppen.length > 0);
}

const ERSETZE: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss' };

/** „Familie Berger“, 2026-11-02 → „Vertragsuebersicht_Berger_2026-11-02.pdf“ (wie Bild 5). */
export function pdfDateiname(kunde: string, datum: Date = new Date()): string {
  const w = kunde.trim().split(/\s+/);
  const name = (w[w.length - 1] ?? 'Kunde')
    .replace(/[äöüÄÖÜß]/g, (c) => ERSETZE[c]!)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9-]/g, '');
  const d = `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}-${String(datum.getDate()).padStart(2, '0')}`;
  return `Vertragsuebersicht_${name || 'Kunde'}_${d}.pdf`;
}

export interface VergleichZeile {
  label: string;
  zusatz?: string;
  typ?: BereichTyp;
  aktuell: number;
  neu: number;
  art?: 'summe' | 'jahr';
}

/** Zeilen der Vergleichsseite (Bild 7 v1, Seite 5). Abgewählte Bereiche zählen nicht. */
export function vergleichZeilen(u: Uebersicht): { monat: VergleichZeile[]; weitere: VergleichZeile[] } {
  const a = fassungSumme(u.aktuell);
  const n = fassungSumme(u.neu);
  const label: Record<BereichTyp, [string, string]> = {
    VERS: ['Versicherungen', 'Beitrag / Monat'],
    SPAR: ['Sparen & Investieren', 'Sparrate / Monat'],
    DARL: ['Darlehen', 'Rate / Monat'],
    AV: ['Altersvorsorge & Familienabsicherung', 'Beitrag / Monat'],
  };
  const aktiv = (s: typeof a, t: BereichTyp) => (s.bereiche[t].aktiv ? s.bereiche[t] : null);
  const monat: VergleichZeile[] = BEREICH_TYPEN.filter((t) => a.bereiche[t].aktiv || n.bereiche[t].aktiv).map((t) => ({
    label: label[t][0],
    zusatz: label[t][1],
    typ: t,
    aktuell: aktiv(a, t)?.monat ?? 0,
    neu: aktiv(n, t)?.monat ?? 0,
  }));
  monat.push({ label: 'Gesamtbetrag monatlich', aktuell: a.gesamtMonat, neu: n.gesamtMonat, art: 'summe' });
  monat.push({ label: 'Gesamtbetrag jährlich', aktuell: a.gesamtMonat * 12, neu: n.gesamtMonat * 12, art: 'jahr' });
  const einmal = (s: typeof a) => BEREICH_TYPEN.filter((t) => s.bereiche[t].aktiv && t !== 'DARL').reduce((x, t) => x + s.bereiche[t].einmal, 0);
  const weitere: VergleichZeile[] = [{ label: 'Einmalbeträge', aktuell: einmal(a), neu: einmal(n) }];
  if (a.bereiche.SPAR.aktiv || n.bereiche.SPAR.aktiv)
    weitere.push({ label: 'Gesamtvermögen', zusatz: 'Sparen & Investieren', aktuell: aktiv(a, 'SPAR')?.gesamtvermoegen ?? 0, neu: aktiv(n, 'SPAR')?.gesamtvermoegen ?? 0 });
  if (a.bereiche.DARL.aktiv || n.bereiche.DARL.aktiv)
    weitere.push({ label: 'Gesamtrestschuld', zusatz: 'Darlehen', aktuell: aktiv(a, 'DARL')?.restschuld ?? 0, neu: aktiv(n, 'DARL')?.restschuld ?? 0 });
  return { monat, weitere };
}

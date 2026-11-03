/** Erzeugt neue, leere Elemente mit sinnvollen Standardwerten. */
import { STANDARD_OUTLOOK } from '../microsoft/mail';
import { neueId, jetzt } from './ids';
import type { Aufgabe, Bereich, BereichTyp, Einstellungen, Fassung, Kunde, Untergruppe, Uebersicht, VertragJeTyp, Vorlage } from './typen';
import { BEREICH_TYPEN } from './typen';
import { kopiereFassung } from '../fassung/kopieren';

export function neuerKunde(name: string): Kunde {
  const zeit = jetzt();
  return { id: neueId(), name: name.trim(), erstellt: zeit, geaendert: zeit };
}

export function neuerVertrag<T extends BereichTyp>(typ: T, name = ''): VertragJeTyp[T] {
  const basis = { id: neueId(), name, bemerkung: '' };
  const vertraege: { [K in BereichTyp]: () => VertragJeTyp[K] } = {
    VERS: () => ({ ...basis, beitrag: null, zahlweise: 'monatlich' }),
    SPAR: () => ({ ...basis, sparrate: null, zahlweise: 'monatlich', einmalbetrag: null, guthaben: null, wertentwicklung: null }),
    DARL: () => ({ ...basis, rate: null, zahlweise: 'monatlich', restschuld: null, zinsbindungBis: null }),
    AV: () => ({
      ...basis,
      beitrag: null,
      einmalbeitrag: null,
      zahlweise: 'monatlich',
      leistung: { betrag: null, art: 'RENTE_MTL' },
      laufzeitBis: null,
    }),
  };
  return vertraege[typ]();
}

export function neueUntergruppe<T extends BereichTyp>(name: string, symbol: string): Untergruppe<T> {
  return { id: neueId(), name, symbol, vertraege: [] };
}

/** „Leer starten“: 4 aktive Bereiche ohne Untergruppen. */
export function leereFassung(): Fassung {
  const bereich = <T extends BereichTyp>(): Bereich<T> => ({ aktiv: true, untergruppen: [] });
  return { bereiche: { VERS: bereich(), SPAR: bereich(), DARL: bereich(), AV: bereich() } };
}

/** Fassung aus Vorlage: Bereiche an/aus und Untergruppen mit Symbolen, noch ohne Verträge. */
export function fassungAusVorlage(vorlage: Vorlage): Fassung {
  const fassung = leereFassung();
  for (const typ of BEREICH_TYPEN) {
    const vb = vorlage.bereiche[typ];
    fassung.bereiche[typ] = {
      aktiv: vb.aktiv,
      untergruppen: vb.untergruppen.map((u) => neueUntergruppe(u.name, u.symbol)),
    } as never;
  }
  return fassung;
}

/** Neue Übersicht: „Neu“ startet automatisch als Kopie von „Aktuell“ (Festlegung Sitzung 23). */
export function neueUebersicht(kundeId: string, aktuell: Fassung = leereFassung()): Uebersicht {
  const zeit = jetzt();
  return {
    id: neueId(),
    kundeId,
    erstellt: zeit,
    geaendert: zeit,
    aktuell,
    neu: kopiereFassung(aktuell),
    syncAktiv: true,
    ersparnisAnzeigen: true,
    vorteile: { aktiv: false, stichpunkte: [] },
    aufgaben: [],
  };
}

export function neueAufgabe(text: string, faellig: string | null = null, von?: string): Aufgabe {
  const a: Aufgabe = { id: neueId(), text: text.trim(), faellig, erledigt: false, outlookErinnerung: false, erstellt: jetzt() };
  if (von) a.von = von;
  return a;
}

export const STANDARD_EINSTELLUNGEN: Readonly<Einstellungen> = Object.freeze({
  darstellung: 'auto',
  pdfPasswortStandard: false,
  schnellstart: [],
  kiAnbieter: null,
  mailKonto: null,
  aufbewahrungJahre: 10,
  angepinnt: [],
  team: [],
  alteKundenVorschlagen: true,
  kiHinweis: true,
  dateiPasswortStandard: true,
  outlook: STANDARD_OUTLOOK,
});

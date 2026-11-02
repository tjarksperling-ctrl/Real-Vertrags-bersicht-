/**
 * Summen nach der Regel „sichtbar stimmig“ (freigegeben Sitzung 24):
 * - Gerundet wird genau einmal: bei der Monatssumme jeder Untergruppe
 *   (exakter Jahresbetrag / 12, kaufmännisch).
 * - Bereich/Monat = Summe der angezeigten Untergruppen-Summen.
 * - Gesamt/Monat = Summe der angezeigten Bereichssummen (nur aktive Bereiche).
 * - „Einmalig“ fließt nie in Monatssummen ein; Einmalbeträge separat.
 */
import type {
  Bereich,
  BereichTyp,
  Cent,
  Fassung,
  Untergruppe,
  VertragJeTyp,
} from '../modell/typen';
import { BEREICH_TYPEN } from '../modell/typen';
import { rundeDivision, wert } from './geld';
import { einmalAnteil, jahresbetrag } from './zahlweise';

// ---------------------------------------------------------------- je Vertrag

/** Exakter regelmäßiger Jahresbetrag eines Vertrags (Beitrag, Sparrate bzw. Rate). */
export function vertragJahresbetrag<T extends BereichTyp>(typ: T, v: VertragJeTyp[T]): Cent {
  switch (typ) {
    case 'VERS': {
      const x = v as VertragJeTyp['VERS'];
      return jahresbetrag(x.beitrag, x.zahlweise);
    }
    case 'SPAR': {
      const x = v as VertragJeTyp['SPAR'];
      return jahresbetrag(x.sparrate, x.zahlweise);
    }
    case 'DARL': {
      const x = v as VertragJeTyp['DARL'];
      return jahresbetrag(x.rate, x.zahlweise);
    }
    case 'AV': {
      const x = v as VertragJeTyp['AV'];
      return jahresbetrag(x.beitrag, x.zahlweise);
    }
  }
  throw new Error(`Unbekannter Bereich: ${String(typ)}`);
}

/**
 * Einmalbeträge eines Vertrags: Einmalbetrag-/Einmalbeitrag-Feld plus der
 * Hauptbetrag, wenn dessen Zahlweise „einmalig“ ist.
 */
export function vertragEinmalbetrag<T extends BereichTyp>(typ: T, v: VertragJeTyp[T]): Cent {
  switch (typ) {
    case 'VERS': {
      const x = v as VertragJeTyp['VERS'];
      return einmalAnteil(x.beitrag, x.zahlweise);
    }
    case 'SPAR': {
      const x = v as VertragJeTyp['SPAR'];
      return wert(x.einmalbetrag) + einmalAnteil(x.sparrate, x.zahlweise);
    }
    case 'DARL': {
      const x = v as VertragJeTyp['DARL'];
      return einmalAnteil(x.rate, x.zahlweise);
    }
    case 'AV': {
      const x = v as VertragJeTyp['AV'];
      return wert(x.einmalbeitrag) + einmalAnteil(x.beitrag, x.zahlweise);
    }
  }
  throw new Error(`Unbekannter Bereich: ${String(typ)}`);
}

// ---------------------------------------------------------------- je Untergruppe

export interface UntergruppenSumme {
  /** Beitrag/Sparrate/Rate je Monat, kaufmännisch gerundet. */
  monat: Cent;
  /** Summe der Einmalbeträge (ungerundet, bereits ganze Cent). */
  einmal: Cent;
}

export function untergruppenSumme<T extends BereichTyp>(typ: T, ug: Untergruppe<T>): UntergruppenSumme {
  let jahr = 0;
  let einmal = 0;
  for (const v of ug.vertraege) {
    jahr += vertragJahresbetrag(typ, v);
    einmal += vertragEinmalbetrag(typ, v);
  }
  return { monat: rundeDivision(jahr, 12), einmal };
}

// ---------------------------------------------------------------- je Bereich

export interface BereichSumme {
  typ: BereichTyp;
  aktiv: boolean;
  /** Summe der angezeigten Untergruppen-Monatssummen. */
  monat: Cent;
  /** Einmalbeträge; anzeigen nur, wenn > 0 (bei DARL laut Briefing nicht angezeigt). */
  einmal: Cent;
  /** SPAR: Gesamtvermögen = Σ (Guthaben + Wertentwicklung). Sonst 0. */
  gesamtvermoegen: Cent;
  /** DARL: Gesamtrestschuld. Sonst 0. */
  restschuld: Cent;
  untergruppen: UntergruppenSumme[];
}

export function bereichSumme<T extends BereichTyp>(typ: T, bereich: Bereich<T>): BereichSumme {
  const untergruppen = bereich.untergruppen.map((ug) => untergruppenSumme(typ, ug));
  let gesamtvermoegen = 0;
  let restschuld = 0;
  for (const ug of bereich.untergruppen) {
    for (const v of ug.vertraege) {
      if (typ === 'SPAR') {
        const x = v as VertragJeTyp['SPAR'];
        gesamtvermoegen += wert(x.guthaben) + wert(x.wertentwicklung);
      } else if (typ === 'DARL') {
        restschuld += wert((v as VertragJeTyp['DARL']).restschuld);
      }
    }
  }
  return {
    typ,
    aktiv: bereich.aktiv,
    monat: untergruppen.reduce((s, u) => s + u.monat, 0),
    einmal: untergruppen.reduce((s, u) => s + u.einmal, 0),
    gesamtvermoegen,
    restschuld,
    untergruppen,
  };
}

// ---------------------------------------------------------------- je Fassung

export interface FassungSumme {
  bereiche: Record<BereichTyp, BereichSumme>;
  /** Gesamt/Monat = Σ Monatssummen der aktiven Bereiche. */
  gesamtMonat: Cent;
}

export function fassungSumme(fassung: Fassung): FassungSumme {
  const bereiche = {} as Record<BereichTyp, BereichSumme>;
  let gesamtMonat = 0;
  for (const typ of BEREICH_TYPEN) {
    const s = bereichSumme(typ, fassung.bereiche[typ] as Bereich<typeof typ>);
    bereiche[typ] = s;
    if (s.aktiv) gesamtMonat += s.monat;
  }
  return { bereiche, gesamtMonat };
}

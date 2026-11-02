/**
 * Vergleich „Neu“ ↔ „Aktuell“ für die Markierungen in der App (Bild 3 v3, nur App, nicht im PDF):
 * geändert gilt ein Vertrag, wenn sich sein Hauptbetrag (Beitrag/Sparrate/Rate) gegenüber dem
 * Ursprungsvertrag (`quelleId`) unterscheidet. Der vorherige Wert steht klein darunter.
 */
import type { Betrag, BereichTyp, Fassung, Vertrag } from '../modell/typen';
import { BEREICH_TYPEN } from '../modell/typen';

export const HAUPTFELD: Record<BereichTyp, 'beitrag' | 'sparrate' | 'rate'> = {
  VERS: 'beitrag',
  SPAR: 'sparrate',
  DARL: 'rate',
  AV: 'beitrag',
};

export interface Aenderung {
  typ: BereichTyp;
  feld: 'beitrag' | 'sparrate' | 'rate';
  vorher: Betrag;
  nachher: Betrag;
}

/** Alle Verträge einer Fassung nach Id. */
export function vertraegeNachId(f: Fassung): Map<string, { typ: BereichTyp; v: Vertrag }> {
  const m = new Map<string, { typ: BereichTyp; v: Vertrag }>();
  for (const typ of BEREICH_TYPEN) for (const ug of f.bereiche[typ].untergruppen) for (const v of ug.vertraege) m.set(v.id, { typ, v: v as Vertrag });
  return m;
}

/** Geänderte Hauptbeträge in „Neu“, Schlüssel = Id des Vertrags in „Neu“. */
export function aenderungen(aktuell: Fassung, neu: Fassung): Map<string, Aenderung> {
  const quelle = vertraegeNachId(aktuell);
  const r = new Map<string, Aenderung>();
  for (const typ of BEREICH_TYPEN) {
    const feld = HAUPTFELD[typ];
    for (const ug of neu.bereiche[typ].untergruppen) {
      for (const v of ug.vertraege) {
        if (!v.quelleId) continue;
        const q = quelle.get(v.quelleId);
        if (!q) continue;
        const vorher = ((q.v as unknown as Record<string, Betrag>)[feld] ?? null) || null;
        const nachher = ((v as unknown as Record<string, Betrag>)[feld] ?? null) || null;
        if (vorher !== nachher) r.set(v.id, { typ, feld, vorher, nachher });
      }
    }
  }
  return r;
}

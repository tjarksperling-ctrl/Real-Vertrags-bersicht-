/** Beispielkunde aus den freigegebenen Mockups (Bild 2/3) – nur für Tests. */
import type { Fassung, Untergruppe, VertragJeTyp, Zahlweise } from '../modell/typen';
import { kopiereFassung } from '../fassung/kopieren';

let n = 0;
const id = () => `t${++n}`;
const ug = <T extends keyof VertragJeTyp>(name: string, symbol: string, vertraege: VertragJeTyp[T][]): Untergruppe<T> => ({
  id: id(), name, symbol, vertraege,
});
const vers = (name: string, beitrag: number, zahlweise: Zahlweise): VertragJeTyp['VERS'] => ({
  id: id(), name, bemerkung: '', beitrag, zahlweise,
});
const spar = (name: string, sparrate: number, zahlweise: Zahlweise, einmalbetrag: number, guthaben: number, wertentwicklung: number): VertragJeTyp['SPAR'] => ({
  id: id(), name, bemerkung: '', sparrate, zahlweise, einmalbetrag, guthaben, wertentwicklung,
});
const darl = (name: string, rate: number, restschuld: number, zinsbindungBis: string): VertragJeTyp['DARL'] => ({
  id: id(), name, bemerkung: '', rate, zahlweise: 'monatlich', restschuld, zinsbindungBis,
});
const av = (name: string, beitrag: number, zahlweise: Zahlweise, einmalbeitrag: number, betrag: number, art: VertragJeTyp['AV']['leistung']['art'], laufzeitBis: string): VertragJeTyp['AV'] => ({
  id: id(), name, bemerkung: '', beitrag, einmalbeitrag, zahlweise, leistung: { betrag, art }, laufzeitBis,
});

export function beispielAktuell(): Fassung {
  return {
    bereiche: {
      VERS: { aktiv: true, untergruppen: [
        ug('Haftpflicht & Recht', 'shield', [vers('Privathaftpflicht', 8940, 'jaehrlich'), vers('Rechtsschutz', 3250, 'monatlich')]),
        ug('Wohnen', 'home', [vers('Hausrat', 14520, 'jaehrlich'), vers('Wohngebäude', 61200, 'jaehrlich')]),
        ug('Kfz', 'car', [vers('VW Golf', 48600, 'halbjaehrlich')]),
      ] },
      SPAR: { aktiv: true, untergruppen: [
        ug('Fonds & ETF', 'trend', [spar('ETF-Sparplan', 15000, 'monatlich', 0, 1248000, 231540), spar('Mischfonds', 0, 'einmalig', 500000, 500000, 41280)]),
        ug('Bausparen', 'key', [spar('Bausparvertrag', 5000, 'monatlich', 0, 620000, 18430)]),
      ] },
      DARL: { aktiv: true, untergruppen: [
        ug('Immobilie', 'bank', [darl('Annuitätendarlehen', 115000, 21480000, '2034-06')]),
        ug('Konsum', 'cart', [darl('Autokredit', 28900, 793000, '2029-03')]),
      ] },
      AV: { aktiv: true, untergruppen: [
        ug('Altersvorsorge', 'hourglass', [av('Private Rente', 10000, 'monatlich', 0, 41200, 'RENTE_MTL', '2052-07-01'), av('Basisrente', 0, 'einmalig', 300000, 9850, 'RENTE_MTL', '2051-12-31')]),
        ug('Familienabsicherung', 'heart', [av('Risikolebensversicherung', 2380, 'monatlich', 0, 25000000, 'TODESFALL', '2045-10-31'), av('Berufsunfähigkeit', 8640, 'monatlich', 0, 150000, 'RENTE_MTL', '2051-06-30')]),
      ] },
    },
  };
}

/** „Neu“ wie in Bild 3: Rechtsschutz, Wohngebäude, Kfz und BU günstiger. */
export function beispielNeu(): Fassung {
  const f = kopiereFassung(beispielAktuell());
  const v = f.bereiche.VERS.untergruppen;
  v[0]!.vertraege[1]!.beitrag = 2890;
  v[1]!.vertraege[1]!.beitrag = 54000;
  v[2]!.vertraege[0]!.beitrag = 43200;
  f.bereiche.AV.untergruppen[1]!.vertraege[1]!.beitrag = 7960;
  return f;
}

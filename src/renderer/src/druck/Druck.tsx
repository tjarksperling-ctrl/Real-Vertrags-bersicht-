/**
 * Druckansicht fürs PDF (Bild 7 v1): nur Kopfzeile (Vertragsübersicht · Kunde · Aktuell/Neu · Datum, Titel optional),
 * Kopfzeile auf jeder Seite (wiederholter Tabellenkopf), Bereiche/Untergruppen nicht ungünstig getrennt,
 * Bemerkungen vollständig. Gleiche Rechenlogik wie die App (src/shared). Immer hell.
 */
import { useEffect, useState, type ReactNode } from 'react';
import * as Y from 'yjs';
import {
  BEREICH_NAME,
  formatBetrag,
  formatDatum,
  formatMonat,
  fassungSumme,
  leseUebersicht,
  pdfAbschnitte,
  pdfBereiche,
  vergleicheBetraege,
  vergleichZeilen,
  untergruppenSumme,
  type Bereich,
  type BereichSumme,
  type BereichTyp,
  type Betrag,
  type PdfAbschnitt,
  type Uebersicht,
  type Vertrag,
  type VertragAV,
  type VertragDARL,
  type VertragSPAR,
  type VertragVERS,
} from '../../../shared';
import type { DruckDaten } from '../../../shared/api';
import { Sym } from '../komponenten/ui';
import { FARBE, NUMMER } from '../editor/Bereich';
import { LEISTUNG_TEXT, SPALTEN, UG_SUMME, ZAHLWEISE_OPTIONEN } from '../editor/spalten';

/** Spaltenbreiten im PDF (A4) wie im Mockup-Generator (P_COLS). */
const P_BREITEN: Record<BereichTyp, string[]> = {
  VERS: ['22%', '', '13%', '14%'],
  SPAR: ['15%', '', '10%', '10%', '11%', '12%', '11%'],
  DARL: ['22%', '', '14%', '14%', '12%'],
  AV: ['23.5%', '', '9%', '11%', '10%', '15.5%', '11%'],
};

const ZW_TEXT = Object.fromEntries(ZAHLWEISE_OPTIONEN.map((o) => [o.wert, o.text]));
const ZW_KURZ = Object.fromEntries(ZAHLWEISE_OPTIONEN.map((o) => [o.wert, o.kurz]));

const opt = (c: Betrag | undefined): ReactNode => (c ? formatBetrag(c) : <span className="strich">–</span>);

function zellen(typ: BereichTyp, v: Vertrag): { inhalt: ReactNode; num: boolean }[] {
  switch (typ) {
    case 'VERS': {
      const x = v as VertragVERS;
      return [
        { inhalt: opt(x.beitrag), num: true },
        { inhalt: ZW_TEXT[x.zahlweise], num: false },
      ];
    }
    case 'SPAR': {
      const x = v as VertragSPAR;
      return [
        { inhalt: opt(x.sparrate), num: true },
        { inhalt: ZW_TEXT[x.zahlweise], num: false },
        { inhalt: opt(x.einmalbetrag), num: true },
        { inhalt: opt(x.guthaben), num: true },
        { inhalt: opt(x.wertentwicklung), num: true },
      ];
    }
    case 'DARL': {
      const x = v as VertragDARL;
      return [
        {
          inhalt: (
            <>
              {opt(x.rate)}
              {x.zahlweise !== 'monatlich' && x.rate ? <small className="zwk"> {ZW_KURZ[x.zahlweise]}</small> : null}
            </>
          ),
          num: true,
        },
        { inhalt: formatBetrag(x.restschuld ?? 0), num: true },
        { inhalt: formatMonat(x.zinsbindungBis), num: false },
      ];
    }
    case 'AV': {
      const x = v as VertragAV;
      return [
        { inhalt: opt(x.beitrag), num: true },
        { inhalt: opt(x.einmalbeitrag), num: true },
        { inhalt: ZW_TEXT[x.zahlweise], num: false },
        {
          inhalt: (
            <>
              {opt(x.leistung.betrag)}
              <br />
              <small style={{ color: 'var(--muted)' }}>{LEISTUNG_TEXT[x.leistung.art]}</small>
            </>
          ),
          num: true,
        },
        { inhalt: formatDatum(x.laufzeitBis), num: true },
      ];
    }
  }
}

function Cg({ typ }: { typ: BereichTyp }) {
  return (
    <colgroup>
      {P_BREITEN[typ].map((b, i) => (
        <col key={i} style={b ? { width: b } : undefined} />
      ))}
    </colgroup>
  );
}

function Summen({ s, vergleich }: { s: BereichSumme; vergleich?: BereichSumme | undefined }) {
  const kv = (label: string, wert: number, alt?: number) => {
    const d = alt === undefined ? 0 : wert - alt;
    return (
      <div className="kv" key={label}>
        <span>{label}</span>
        <b>{formatBetrag(wert)}</b>
        {d !== 0 && <span className={`delta ${d < 0 ? 'minus' : 'plus'}`}>{formatBetrag(d, { mitVorzeichen: true })} ggü. Aktuell</span>}
      </div>
    );
  };
  const t = s.typ;
  return (
    <>
      {t === 'SPAR' && kv('Gesamtvermögen', s.gesamtvermoegen, vergleich?.gesamtvermoegen)}
      {t === 'DARL' && kv('Gesamtrestschuld', s.restschuld, vergleich?.restschuld)}
      {t !== 'DARL' && s.einmal > 0 && kv(t === 'AV' ? 'Einmalbeiträge' : 'Einmalbeträge', s.einmal, vergleich?.einmal)}
      {kv(`${UG_SUMME[t]} / Monat`, s.monat, vergleich?.monat)}
    </>
  );
}

function PBereich({ typ, b, s, vergleich }: { typ: BereichTyp; b: Bereich; s: BereichSumme; vergleich?: BereichSumme | undefined }) {
  return (
    <div className={`p-bereich v1 ${FARBE[typ]}`}>
      <div className="p-bk">
        <span className="nr">{NUMMER[typ]}</span>
        {BEREICH_NAME[typ]}
      </div>
      <table className="pt v1 p-sk">
        <Cg typ={typ} />
        <thead>
          <tr>
            {SPALTEN[typ].map((sp) => (
              <th key={sp.feld} className={sp.num ? 'num' : ''}>
                {sp.titel}
              </th>
            ))}
          </tr>
        </thead>
      </table>
      <div className="p-ugs">
        {b.untergruppen.map((ug) => (
          <div className="p-ug v1" key={ug.id}>
            <div className="p-ug-kopf">
              <span className="ico">
                <Sym n={ug.symbol} />
              </span>
              {ug.name}
            </div>
            <table className="pt v1">
              <Cg typ={typ} />
              <tbody>
                {ug.vertraege.map((v) => (
                  <tr key={v.id}>
                    <td className="vname">{v.name}</td>
                    <td className="bem">{v.bemerkung}</td>
                    {zellen(typ, v as Vertrag).map((z, i) => (
                      <td key={i} className={z.num ? 'num' : 'zw'}>
                        {z.inhalt}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-ug-fuss">
              <small>{UG_SUMME[typ]} / Monat</small>
              {formatBetrag(untergruppenSumme(typ, ug as never).monat)}
            </div>
          </div>
        ))}
      </div>
      <div className="p-summe v1">
        <span className="bs-label">Summe {BEREICH_NAME[typ]}</span>
        <span className="spacer" />
        <Summen s={s} vergleich={vergleich} />
      </div>
    </div>
  );
}

function Vorteile({ u, mitErsparnis }: { u: Uebersicht; mitErsparnis: boolean }) {
  const v = vergleicheBetraege(fassungSumme(u.aktuell).gesamtMonat, fassungSumme(u.neu).gesamtMonat);
  const wort = v.art === 'mehrbeitrag' ? 'Mehrbeitrag' : 'Ersparnis';
  const punkte = u.vorteile.stichpunkte.filter((s) => s.trim());
  return (
    <div className="p-vorteile v1">
      <h3>Vorteile der Änderungen</h3>
      {punkte.length > 0 && (
        <ul>
          {punkte.map((s, i) => (
            <li key={i}>
              <Sym n="check" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
      {mitErsparnis && v.art !== 'gleich' && (
        <div className={`ersparnis ${v.art}`}>
          <div>
            <span>{wort} pro Monat</span>
            <b>{formatBetrag(v.betragMonat)}</b>
          </div>
          <div>
            <span>{wort} pro Jahr</span>
            <b>{formatBetrag(v.betragJahr)}</b>
          </div>
        </div>
      )}
    </div>
  );
}

function Vergleich({ u, mitDifferenz }: { u: Uebersicht; mitDifferenz: boolean }) {
  const { monat, weitere } = vergleichZeilen(u);
  const tabelle = (titel: string, zeilen: typeof monat) => (
    <div className="p-vgl">
      <h2>{titel}</h2>
      <table className="vgl v1">
        <colgroup>
          <col />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
          {mitDifferenz && <col style={{ width: '14%' }} />}
        </colgroup>
        <thead>
          <tr>
            <th />
            <th>Aktuell</th>
            <th>Neu</th>
            {mitDifferenz && <th>Differenz</th>}
          </tr>
        </thead>
        <tbody>
          {zeilen.map((z) => {
            const d = z.neu - z.aktuell;
            return (
              <tr key={z.label} className={z.art === 'summe' ? 'sum' : z.art === 'jahr' ? 'sub' : ''}>
                <td>
                  {z.typ && <span className={`vnr ${FARBE[z.typ]}`}>{NUMMER[z.typ]}</span>}
                  {z.label} {z.zusatz && <small>{z.zusatz}</small>}
                </td>
                <td className="num">{formatBetrag(z.aktuell)}</td>
                <td className="num">{formatBetrag(z.neu)}</td>
                {mitDifferenz && <td className={`num ${d < 0 ? 'gruen' : ''}`}>{d ? formatBetrag(d, { mitVorzeichen: true }) : '±0,00 €'}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
  return (
    <>
      {tabelle('Monatliche Beträge', monat)}
      {tabelle('Weitere Werte', weitere)}
    </>
  );
}

function Kopf({ kunde, fassung, datum, titel }: { kunde: string; fassung: string; datum: string; titel?: string | undefined }) {
  return (
    <div className="p-head v1">
      <span className="t">
        Vertragsübersicht
        {titel && <span className="p-titel">{titel}</span>}
      </span>
      <span className="m">
        <b>{kunde}</b>
        <span className="p-fassung">{fassung}</span>
        {datum}
      </span>
    </div>
  );
}

function Abschnitt({ a, u, d }: { a: PdfAbschnitt; u: Uebersicht; d: DruckDaten }) {
  const sa = fassungSumme(u.aktuell);
  const titel = d.optionen.titel ? u.titel : undefined;
  let fassungText = 'Vergleich';
  let inhalt: ReactNode;
  if (a.art === 'fassung') {
    const f = u[a.fassung];
    const s = a.fassung === 'neu' ? fassungSumme(u.neu) : sa;
    fassungText = a.fassung === 'neu' ? 'Neu' : 'Aktuell';
    const vgl = vergleicheBetraege(sa.gesamtMonat, s.gesamtMonat);
    inhalt = (
      <>
        {pdfBereiche(f).map(({ typ, b }) => (
          <PBereich key={typ} typ={typ} b={b} s={s.bereiche[typ]} vergleich={a.mitDifferenz ? sa.bereiche[typ] : undefined} />
        ))}
        <div className="p-gesamt v1">
          <span className="l">Gesamtbetrag monatlich</span>
          <span className="spacer" />
          {a.mitDifferenz && (
            <div className="neben">
              Aktuell {formatBetrag(sa.gesamtMonat)}
              <br />
              <b className={vgl.art === 'mehrbeitrag' ? 'mehr' : ''}>{formatBetrag(vgl.differenzMonat, { mitVorzeichen: true })} pro Monat</b>
            </div>
          )}
          <b className="w">{formatBetrag(s.gesamtMonat)}</b>
        </div>
        {a.vorteile && <Vorteile u={u} mitErsparnis={d.optionen.ersparnis} />}
      </>
    );
  } else {
    inhalt = (
      <>
        <Vergleich u={u} mitDifferenz={a.mitDifferenz} />
        {a.vorteile && <Vorteile u={u} mitErsparnis={a.mitDifferenz} />}
      </>
    );
  }
  return (
    <div className="page v1 druck-seite">
      <table className="p-rahmen">
        <thead>
          <tr>
            <td>
              <Kopf kunde={d.kunde} fassung={fassungText} datum={d.datum} titel={titel} />
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{inhalt}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const ZEIT = (iso: string) => {
  const d = new Date(iso);
  return `${formatDatum(iso.slice(0, 10))}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Deckblatt der Auskunft (Art. 15 DSGVO): welche Daten, wozu, wo, wie lange – danach alle Übersichten. */
function AuskunftDeckblatt({ d, liste }: { d: DruckDaten; liste: Uebersicht[] }) {
  const a = d.auskunft!;
  const aufgaben = liste.flatMap((u) => u.aufgaben.map((x) => ({ ...x, titel: u.titel || 'Vertragsübersicht' })));
  const zeile = (k: string, w: ReactNode) => (
    <tr>
      <td className="ak-k">{k}</td>
      <td>{w}</td>
    </tr>
  );
  return (
    <div className="page v1 druck-seite">
      <table className="p-rahmen">
        <thead>
          <tr>
            <td>
              <Kopf kunde={d.kunde} fassung="Auskunft" datum={d.datum} />
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div className="ak">
                <h1>Auskunft über gespeicherte Daten</h1>
                <p className="ak-lead">
                  nach Art. 15 DSGVO · erstellt am {d.datum} von {a.erstelltVon}
                </p>
                <h2>Gespeicherte Angaben zur Person</h2>
                <table className="pt ak-t">
                  <tbody>
                    {zeile('Name', a.kunde.name)}
                    {zeile('Angelegt', ZEIT(a.kunde.erstellt))}
                    {zeile('Weitere Angaben', 'keine – gespeichert wird nur der Name')}
                  </tbody>
                </table>
                <h2>Zweck, Speicherort, Dauer</h2>
                <table className="pt ak-t">
                  <tbody>
                    {zeile('Zweck', 'Übersicht der Versicherungs-, Spar-, Darlehens- und Vorsorgeverträge für die Beratung')}
                    {zeile('Speicherort', 'Arbeitsplatz der Agentur (Benutzerprofil); später Microsoft 365 der Agentur in der EU')}
                    {zeile('Empfänger', 'keine; PDFs und Dateien nur, wenn sie der Agentur bzw. Ihnen ausgehändigt werden')}
                    {zeile('KI-Auswertung', 'Unterlagen werden nur ausgewertet, nicht gespeichert; der Name wird vorher entfernt')}
                    {zeile('Aufbewahrung', 'bis zur Löschung; Hinweis zur Prüfung nach Jahren ohne Änderung')}
                  </tbody>
                </table>
                <h2>Vertragsübersichten ({liste.length})</h2>
                <table className="pt ak-t">
                  <tbody>
                    <tr className="ak-kopf">
                      <th>Titel</th>
                      <th>Angelegt</th>
                      <th>Zuletzt geändert</th>
                      <th className="num">Aktuell / Monat</th>
                      <th className="num">Neu / Monat</th>
                    </tr>
                                      {liste.map((u) => (
                      <tr key={u.id}>
                        <td className="vname">{u.titel || 'Vertragsübersicht'}</td>
                        <td>{formatDatum(u.erstellt.slice(0, 10))}</td>
                        <td>{formatDatum(u.geaendert.slice(0, 10))}</td>
                        <td className="num">{formatBetrag(fassungSumme(u.aktuell).gesamtMonat)}</td>
                        <td className="num">{formatBetrag(fassungSumme(u.neu).gesamtMonat)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <h2>Aufgaben ({aufgaben.length})</h2>
                {aufgaben.length === 0 ? (
                  <p className="ak-leer">keine</p>
                ) : (
                  <table className="pt ak-t">
                    <tbody>
                      <tr className="ak-kopf">
                        <th>Aufgabe</th>
                        <th>Übersicht</th>
                        <th>Fällig</th>
                        <th>Stand</th>
                      </tr>
                                          {aufgaben.map((x) => (
                        <tr key={x.id}>
                          <td>{x.text}</td>
                          <td>{x.titel}</td>
                          <td>{x.faellig ? formatDatum(x.faellig) : '–'}</td>
                          <td>{x.erledigt ? 'erledigt' : 'offen'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <h2>Protokoll (letzte 12 Monate)</h2>
                {a.protokoll.length === 0 ? (
                  <p className="ak-leer">keine Einträge</p>
                ) : (
                  <table className="pt ak-t">
                    <tbody>
                      {a.protokoll.map((p, i) => (
                        <tr key={i}>
                          <td className="ak-k">{ZEIT(p.zeit)}</td>
                          <td>
                            {p.wer} · {p.uebersicht ? `${p.uebersicht} · ` : ''}
                            {p.was}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p className="ak-fuss">Auf den folgenden Seiten stehen alle Vertragsübersichten vollständig (Fassung „Aktuell“ und „Neu“).</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Seite für das unsichtbare Druckfenster (Route #druck?s=<Schlüssel>). */
export function DruckSeite({ schluessel }: { schluessel: string }) {
  const [daten, setDaten] = useState<{ u: Uebersicht; d: DruckDaten; weitere: Uebersicht[] } | null>(null);
  const [fehler, setFehler] = useState(false);
  useEffect(() => {
    document.documentElement.classList.add('druck');
    document.documentElement.classList.remove('dunkel');
    void window.api.druckDaten(schluessel).then((d) => {
      if (!d) return setFehler(true);
      const lies = (b: Uint8Array) => {
        const doc = new Y.Doc();
        Y.applyUpdate(doc, b);
        return leseUebersicht(doc);
      };
      const weitere = d.auskunft ? d.auskunft.uebersichten.map(lies) : [];
      setDaten({ u: weitere[0] ?? lies(d.daten), d, weitere });
    });
  }, [schluessel]);
  useEffect(() => {
    if (!daten && !fehler) return;
    void document.fonts.ready.then(() => requestAnimationFrame(() => window.api.druckBereit()));
  }, [daten, fehler]);
  if (!daten) return null;
  if (daten.d.auskunft)
    return (
      <div className="druck-wurzel">
        <AuskunftDeckblatt d={daten.d} liste={daten.weitere} />
        {daten.weitere.map((u) => {
          const d = { ...daten.d, optionen: { inhalt: 'beide' as const, vergleich: false, vorteile: true, ersparnis: u.ersparnisAnzeigen, titel: true } };
          return pdfAbschnitte(u, d.optionen).map((a, i) => <Abschnitt key={`${u.id}-${i}`} a={a} u={{ ...u, titel: u.titel || 'Vertragsübersicht' }} d={d} />);
        })}
      </div>
    );
  return (
    <div className="druck-wurzel">
      {pdfAbschnitte(daten.u, daten.d.optionen).map((a, i) => (
        <Abschnitt key={i} a={a} u={daten.u} d={daten.d} />
      ))}
    </div>
  );
}

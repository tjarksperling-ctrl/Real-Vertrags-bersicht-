/** Einstellungen (Stil Bild 8): „Allgemein“ (Darstellung + Tastenkürzel) und „Vorlagen“ (Bild 11 v1). Weitere Seiten folgen mit M5. */
import { useState } from 'react';
import {
  BEREICH_NAME,
  BEREICH_TYPEN,
  neueId,
  type BereichTyp,
  type Darstellung,
  type Fassung,
  type Vorlage,
  type VorlageUntergruppe,
} from '../../../shared';
import { Schalter, STRG, Sym } from '../komponenten/ui';
import { FARBE } from '../editor/Bereich';
import { SYMBOLE } from '../editor/spalten';
import { vorlageUntertitel } from './NeuerKunde';
import type { Gespeichert } from '../daten/speicher';

export type EinstSeite = 'Allgemein' | 'Vorlagen';

const NAV: [string, string, EinstSeite | null][] = [
  ['sliders', 'Allgemein', 'Allgemein'],
  ['sparkles', 'KI-Konto', null],
  ['mail', 'Outlook', null],
  ['cloud', 'Speicherort', null],
  ['ext', 'Schnellstart', null],
  ['tpl', 'Vorlagen', 'Vorlagen'],
  ['lock', 'Datenschutz', null],
];

export const KUERZEL: [string, string][] = [
  ['Enter', 'Speichern, gleiche Spalte in der nächsten Zeile – in der letzten Zeile neuer Vertrag'],
  ['Tab  /  ⇧ Tab', 'Nächstes / voriges Feld'],
  ['⇧ Enter', 'Neue Zeile in der Bemerkung'],
  ['Esc', 'Eingabe abbrechen'],
  ['Entf', 'Markierte Zeile löschen (mit Rückgängig)'],
  [`${STRG} Z`, 'Rückgängig – nur eigene Änderungen'],
  [STRG === '⌘' ? '⇧ ⌘ Z' : 'Strg Y', 'Wiederholen'],
  [`${STRG} K`, 'Kundensuche'],
  [`${STRG} P`, 'PDF-Dialog'],
  [`${STRG} 1 / 2 / 3`, 'Aktuell / Neu / Nebeneinander'],
  [`${STRG} /`, 'Diese Übersicht der Tastenkürzel'],
];

export function KuerzelListe() {
  return (
    <div className="kuerzel-liste">
      {KUERZEL.map(([k, t]) => (
        <div key={k} className="kz-zeile">
          <span className="kz-k">
            {k.split('  /  ').map((teil, i) => (
              <span key={i}>
                {i > 0 && ' / '}
                <kbd>{teil}</kbd>
              </span>
            ))}
          </span>
          <span>{t}</span>
        </div>
      ))}
    </div>
  );
}

function es_titel(sym: string, name: string, agentur: boolean, status?: string) {
  return (
    <div className="kk-titel">
      <h3>
        <Sym n={sym} /> {name}
      </h3>
      {status && <span className="es-anz">{status}</span>}
      <span className="spacer" />
      <span className={`es-scope ${agentur ? 'ag' : ''}`}>
        <Sym n="user" /> {agentur ? 'Ganze Agentur' : 'Nur für Sie'}
      </span>
    </div>
  );
}

/** Leere Vorlage bzw. Vorlage aus einer Fassung (Untergruppen + Vertragsnamen als Vorschläge). */
export function vorlageAus(name: string, f?: Fassung): Vorlage {
  const bereiche = {} as Vorlage['bereiche'];
  for (const t of BEREICH_TYPEN) {
    const b = f?.bereiche[t];
    bereiche[t] = {
      aktiv: b?.aktiv ?? true,
      untergruppen: (b?.untergruppen ?? []).map((u) => ({
        name: u.name,
        symbol: u.symbol,
        vorschlaege: u.vertraege.map((v) => v.name).filter(Boolean),
      })),
    };
  }
  return { id: neueId(), name, symbol: 'tpl', standard: false, eigene: true, bereiche };
}

export function EinstellungenDialog({
  start,
  gespeichert,
  aktuelleFassung,
  onSpeichern,
  onSchliessen,
}: {
  start: EinstSeite;
  gespeichert: Gespeichert;
  /** „Neue Vorlage aus dieser Übersicht“ – nur wenn eine Übersicht offen ist. */
  aktuelleFassung: Fassung | null;
  onSpeichern: (g: Gespeichert) => void;
  onSchliessen: () => void;
}) {
  const [seite, setSeite] = useState<EinstSeite>(start);
  const [entwurf, setEntwurf] = useState<Gespeichert>(() => structuredClone(gespeichert));
  const [auswahl, setAuswahl] = useState(entwurf.vorlagen.find((v) => v.standard)?.id ?? entwurf.vorlagen[0]?.id ?? '');
  const geaendert = JSON.stringify(entwurf) !== JSON.stringify(gespeichert);

  const darstellung = (d: Darstellung) => {
    const neu = { ...entwurf, einstellungen: { ...entwurf.einstellungen, darstellung: d } };
    setEntwurf(neu);
    onSpeichern({ ...gespeichert, einstellungen: neu.einstellungen }); // wirkt sofort
  };

  const vorlagen = entwurf.vorlagen;
  const v = vorlagen.find((x) => x.id === auswahl);
  const vorlageSetzen = (neu: Vorlage) =>
    setEntwurf((e) => ({
      ...e,
      vorlagen: e.vorlagen.map((x) => (x.id === neu.id ? neu : neu.standard ? { ...x, standard: false } : x)),
    }));
  const vorlageHinzu = (neu: Vorlage) => {
    setEntwurf((e) => ({ ...e, vorlagen: [...e.vorlagen, neu] }));
    setAuswahl(neu.id);
  };

  let titel, inhalt, fuss;
  if (seite === 'Allgemein') {
    titel = es_titel('sliders', 'Allgemein', false);
    inhalt = (
      <>
        <div className="ex-sec">Darstellung</div>
        <div className="seg darstellung" role="radiogroup">
          {(
            [
              ['auto', 'Automatisch'],
              ['hell', 'Hell'],
              ['dunkel', 'Dunkel'],
            ] as const
          ).map(([w, t]) => (
            <button key={w} type="button" role="radio" aria-checked={entwurf.einstellungen.darstellung === w} className={`knopf-rein ${entwurf.einstellungen.darstellung === w ? 'on' : ''}`} onClick={() => darstellung(w)}>
              {t}
            </button>
          ))}
        </div>
        <p className="kk-lead klein">Automatisch folgt Windows bzw. macOS. Gilt nur für Sie. Das PDF ist immer hell.</p>
        <div className="ex-sec">PDF</div>
        <div className="optrow">
          <div>
            PDF standardmäßig mit Passwort schützen<small>Im Dialog „PDF erstellen“ ist „Mit Passwort schützen“ dann schon an.</small>
          </div>
          <Schalter
            an={entwurf.einstellungen.pdfPasswortStandard}
            onChange={(an) => {
              const neu = { ...entwurf, einstellungen: { ...entwurf.einstellungen, pdfPasswortStandard: an } };
              setEntwurf(neu);
              onSpeichern({ ...gespeichert, einstellungen: neu.einstellungen });
            }}
          />
        </div>
        <div className="ex-sec">Tastenkürzel</div>
        <KuerzelListe />
      </>
    );
    fuss = (
      <>
        <span className="kk-fuss">
          <Sym n="info" /> Änderungen wirken sofort.
        </span>
        <span className="spacer" />
        <button type="button" className="btn primary" onClick={onSchliessen}>
          Fertig
        </button>
      </>
    );
  } else {
    titel = es_titel('tpl', 'Vorlagen', true, `${vorlagen.length} ${vorlagen.length === 1 ? 'Vorlage' : 'Vorlagen'}`);
    const karte = (x: Vorlage) => (
      <button type="button" key={x.id} className={`vl-k knopf-rein ${x.id === auswahl ? 'on' : ''}`} onClick={() => setAuswahl(x.id)}>
        <span className="nk-vsym">
          <Sym n={x.symbol} />
        </span>
        <div>
          <b>{x.name || 'Ohne Namen'}</b>
          <small>{vorlageUntertitel(x)}</small>
        </div>
        {x.standard && (
          <span className="nk-std">
            <Sym n="star" />
          </span>
        )}
      </button>
    );
    inhalt = (
      <>
        <p className="kk-lead">Vorlagen legen Bereiche und Untergruppen mit Symbolen an. Vertragsnamen erscheinen beim Tippen als Vorschlag.</p>
        <div className="vl-grid">
          <div className="vl-links">
            <div className="nk-gr">Agentur</div>
            {vorlagen.filter((x) => !x.eigene).map(karte)}
            <div className="nk-gr">
              Meine Vorlagen <span className="vl-nur">nur für Sie</span>
            </div>
            {vorlagen.filter((x) => x.eigene).map(karte)}
            <button type="button" className="vl-neu knopf-rein" onClick={() => vorlageHinzu(vorlageAus('Neue Vorlage'))}>
              <Sym n="plus" />
              <div>
                <b>Neue Vorlage</b>
                <small>leer starten</small>
              </div>
            </button>
            {aktuelleFassung && (
              <button type="button" className="vl-neu knopf-rein" onClick={() => vorlageHinzu(vorlageAus('Aus Übersicht', aktuelleFassung))}>
                <Sym n="copy" />
                <div>
                  <b>Aus dieser Übersicht</b>
                  <small>Untergruppen und Vertragsnamen übernehmen</small>
                </div>
              </button>
            )}
            <div className="vl-auto">
              <div className="vl-auto-k">
                <Sym n="wand" /> Autovervollständigung<span className="spacer" />
                <Schalter an={entwurf.autovervollstaendigung} onChange={(an) => setEntwurf((e) => ({ ...e, autovervollstaendigung: an }))} />
              </div>
              <div className="vl-auto-t">Schlägt beim Tippen Vertragsnamen mit üblicher Zahlweise vor – aus Vorlagen und allen Kunden der Agentur.</div>
            </div>
          </div>
          {v && <VorlageBearbeiten key={v.id} v={v} onChange={vorlageSetzen} />}
        </div>
      </>
    );
    fuss = (
      <>
        <span className="kk-fuss">
          <Sym n="info" /> Änderungen gelten nur für neue Kunden. Bestehende Übersichten bleiben unverändert.
        </span>
        <span className="spacer" />
        {v && (
          <button type="button" className="btn ghost" onClick={() => vorlageHinzu({ ...structuredClone(v), id: neueId(), name: `${v.name} (Kopie)`, standard: false, eigene: true })}>
            <Sym n="copy" /> Duplizieren
          </button>
        )}
        {v?.eigene && (
          <button
            type="button"
            className="btn ghost rot"
            onClick={() => {
              setEntwurf((e) => ({ ...e, vorlagen: e.vorlagen.filter((x) => x.id !== v.id) }));
              setAuswahl(vorlagen.find((x) => x.id !== v.id)?.id ?? '');
            }}
          >
            <Sym n="trash" /> Löschen
          </button>
        )}
        <button type="button" className="btn" onClick={onSchliessen}>
          Abbrechen
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!geaendert}
          onClick={() => {
            onSpeichern(entwurf);
            onSchliessen();
          }}
        >
          Speichern
        </button>
      </>
    );
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onSchliessen()}>
      <div className="sheet kk1 es1" role="dialog" aria-label="Einstellungen" onKeyDown={(e) => e.key === 'Escape' && onSchliessen()}>
        <header>
          <h2>Einstellungen</h2>
          <p>Was nur für Sie gilt und was für die ganze Agentur, steht neben jedem Titel.</p>
        </header>
        <div className="kk-grid">
          <nav className="kk-nav">
            {NAV.map(([sym, n, ziel]) => (
              <button
                type="button"
                key={n}
                className={`kk-nav-i knopf-rein ${seite === n ? 'on' : ''}`}
                disabled={!ziel}
                title={ziel ? undefined : 'folgt mit Meilenstein 5'}
                onClick={() => ziel && setSeite(ziel)}
              >
                <Sym n={sym} />
                {n}
              </button>
            ))}
          </nav>
          <div className="body">
            {titel}
            {inhalt}
          </div>
        </div>
        <footer>{fuss}</footer>
      </div>
    </div>
  );
}

function VorlageBearbeiten({ v, onChange }: { v: Vorlage; onChange: (v: Vorlage) => void }) {
  const [offen, setOffen] = useState<string | null>(null);
  const [neuerVorschlag, setNeuerVorschlag] = useState('');
  const bereich = (t: BereichTyp, fn: (b: Vorlage['bereiche'][BereichTyp]) => Vorlage['bereiche'][BereichTyp]) =>
    onChange({ ...v, bereiche: { ...v.bereiche, [t]: fn(v.bereiche[t]) } });
  const ug = (t: BereichTyp, i: number, teil: Partial<VorlageUntergruppe>) =>
    bereich(t, (b) => ({ ...b, untergruppen: b.untergruppen.map((u, j) => (j === i ? { ...u, ...teil } : u)) }));

  return (
    <div className="vl-ed-box">
      <div className="vl-kopf">
        <span className="nk-vsym gross">
          <Sym n={v.symbol} />
        </span>
        <span className="kk-input vl-name">
          <input className="eingabe-rein" aria-label="Name der Vorlage" value={v.name} onChange={(e) => onChange({ ...v, name: e.target.value })} />
        </span>
        <span className="vl-std">
          <Schalter an={v.standard} onChange={(an) => onChange({ ...v, standard: an })} /> Standard für neue Kunden
        </span>
      </div>
      {BEREICH_TYPEN.map((t) => {
        const b = v.bereiche[t];
        return (
          <div key={t} className={`vl-b ${FARBE[t]} ${b.aktiv ? '' : 'off'}`}>
            <div className="vl-bk">
              <button type="button" className="chk knopf-rein" aria-label={`${BEREICH_NAME[t]} an/aus`} onClick={() => bereich(t, (x) => ({ ...x, aktiv: !x.aktiv }))}>
                {b.aktiv && <Sym n="check" />}
              </button>
              <b>{BEREICH_NAME[t]}</b>
              {!b.aktiv && <span className="vl-aus">nicht in dieser Vorlage</span>}
              <span className="spacer" />
              {b.aktiv ? (
                <button
                  type="button"
                  className="vl-addk knopf-rein"
                  onClick={() => {
                    bereich(t, (x) => ({ ...x, untergruppen: [...x.untergruppen, { name: '', symbol: SYMBOLE[t][0]!, vorschlaege: [] }] }));
                    setOffen(`${t}:${b.untergruppen.length}`);
                  }}
                >
                  <Sym n="plus" /> Untergruppe
                </button>
              ) : (
                <button type="button" className="vl-addk knopf-rein" onClick={() => bereich(t, (x) => ({ ...x, aktiv: true }))}>
                  zuschalten
                </button>
              )}
            </div>
            {b.aktiv &&
              b.untergruppen.map((u, i) => {
                const key = `${t}:${i}`;
                if (offen !== key)
                  return (
                    <div key={key} className="vl-ug" onClick={() => setOffen(key)}>
                      <span className="es-grip">
                        <Sym n="grip" />
                      </span>
                      <span className="vl-sym">
                        <Sym n={u.symbol} />
                      </span>
                      <b>{u.name || 'Ohne Namen'}</b>
                      <span className="vl-vor">
                        {u.vorschlaege.map((s) => (
                          <span key={s} className="vl-vs">
                            {s}
                          </span>
                        ))}
                      </span>
                      <button
                        type="button"
                        className="es-akt knopf-rein"
                        title="Untergruppe entfernen"
                        onClick={(e) => {
                          e.stopPropagation();
                          bereich(t, (x) => ({ ...x, untergruppen: x.untergruppen.filter((_, j) => j !== i) }));
                        }}
                      >
                        <Sym n="trash2" />
                      </button>
                    </div>
                  );
                return (
                  <div key={key} className="vl-ug edit">
                    <span className="es-grip">
                      <Sym n="grip" />
                    </span>
                    <span className="vl-sym on">
                      <Sym n={u.symbol} />
                    </span>
                    <div className="vl-ed">
                      <div className="vl-ed-r">
                        <span className="kk-input vl-n">
                          <input className="eingabe-rein" autoFocus aria-label="Name der Untergruppe" value={u.name} onChange={(e) => ug(t, i, { name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && setOffen(null)} />
                        </span>
                        <span className="vl-vor">
                          {u.vorschlaege.map((s) => (
                            <span key={s} className="vl-vs">
                              {s}
                              <button type="button" className="knopf-rein vs-x" aria-label={`${s} entfernen`} onClick={() => ug(t, i, { vorschlaege: u.vorschlaege.filter((x) => x !== s) })}>
                                <Sym n="x" />
                              </button>
                            </span>
                          ))}
                          <input
                            className="vl-vs add eingabe-rein"
                            placeholder="+ Vertrag"
                            value={neuerVorschlag}
                            onChange={(e) => setNeuerVorschlag(e.target.value)}
                            onKeyDown={(e) => {
                              const w = neuerVorschlag.trim();
                              if (e.key === 'Enter' && w) {
                                if (!u.vorschlaege.includes(w)) ug(t, i, { vorschlaege: [...u.vorschlaege, w] });
                                setNeuerVorschlag('');
                              }
                            }}
                          />
                        </span>
                      </div>
                      <div className="vl-ed-r">
                        <span className="es-lab">Symbol</span>
                        <span className="es-syms">
                          {SYMBOLE[t].map((s) => (
                            <button type="button" key={s} className={`knopf-rein ${s === u.symbol ? 'on' : ''}`} onClick={() => ug(t, i, { symbol: s })}>
                              <Sym n={s} />
                            </button>
                          ))}
                        </span>
                        <span className="spacer" />
                        <button type="button" className="btn ghost" onClick={() => setOffen(null)}>
                          Fertig
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}

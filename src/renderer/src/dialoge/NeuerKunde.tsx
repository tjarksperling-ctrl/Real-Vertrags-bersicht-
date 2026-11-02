/** Dialog „Neuer Kunde“ (Bild 11 v1): nur der Name, Dublettenprüfung, Titel der ersten Übersicht, leer oder mit Vorlage. */
import { useState } from 'react';
import {
  BEREICH_NAME,
  BEREICH_TYPEN,
  findeDublette,
  initialen,
  titelVorschlag,
  type Kunde,
  type Vorlage,
} from '../../../shared';
import { Sym } from '../komponenten/ui';
import { FARBE, NUMMER } from '../editor/Bereich';

export type StartArt = 'leer' | 'vorlage';

export interface NeuerKundeErgebnis {
  name: string;
  titel: string;
  vorlage: Vorlage | null;
}

export function vorlageUntertitel(v: Vorlage): string {
  const an = BEREICH_TYPEN.filter((t) => v.bereiche[t].aktiv);
  const ugs = an.reduce((n, t) => n + v.bereiche[t].untergruppen.length, 0);
  return `${an.length} ${an.length === 1 ? 'Bereich' : 'Bereiche'} · ${ugs} Untergruppen`;
}

export function VorlagenVorschau({ v }: { v: Vorlage }) {
  return (
    <>
      {BEREICH_TYPEN.map((t) => {
        const b = v.bereiche[t];
        return (
          <div key={t} className={`nk-b ${FARBE[t]} ${b.aktiv ? '' : 'off'}`}>
            <span className="nk-nr">{NUMMER[t]}</span>
            <div className="nk-bm">
              <b>{BEREICH_NAME[t]}</b>
              <div className="nk-ugs">
                {b.aktiv ? (
                  b.untergruppen.length ? (
                    b.untergruppen.map((u) => (
                      <span key={u.name} className="nk-ug">
                        <Sym n={u.symbol} />
                        {u.name}
                      </span>
                    ))
                  ) : (
                    <span className="nk-aus">noch keine Untergruppen</span>
                  )
                ) : (
                  <span className="nk-aus">nicht in dieser Vorlage · später zuschaltbar</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export function NeuerKundeDialog({
  kunden,
  vorlagen,
  onAnlegen,
  onAbbrechen,
  onOeffnen,
  onVorlagenVerwalten,
}: {
  kunden: Kunde[];
  vorlagen: Vorlage[];
  onAnlegen: (e: NeuerKundeErgebnis) => void;
  onAbbrechen: () => void;
  onOeffnen: (kundeId: string) => void;
  onVorlagenVerwalten: () => void;
}) {
  const [name, setName] = useState('');
  const [titel, setTitel] = useState(titelVorschlag());
  const [art, setArt] = useState<StartArt>('vorlage');
  const std = vorlagen.find((v) => v.standard) ?? vorlagen[0];
  const [vorlageId, setVorlageId] = useState(std?.id ?? '');
  const vorlage = vorlagen.find((v) => v.id === vorlageId) ?? std;
  const dublette = findeDublette(kunden, name);
  const ok = name.trim().length > 0;

  const anlegen = () => {
    if (!ok) return;
    onAnlegen({ name: name.trim(), titel: titel.trim() || titelVorschlag(), vorlage: art === 'vorlage' ? (vorlage ?? null) : null });
  };

  const kachel = (a: StartArt | 'ki', sym: string, n: string, d: string) => (
    <button
      type="button"
      className={`kk-anb knopf-rein ${art === a ? 'on' : ''}`}
      disabled={a === 'ki'}
      title={a === 'ki' ? 'Folgt mit Meilenstein 5 (KI-Konto nötig)' : undefined}
      onClick={() => a !== 'ki' && setArt(a)}
    >
      <span className="es-sym">
        <Sym n={sym} />
      </span>
      <div>
        <b>{n}</b>
        <small>{d}</small>
      </div>
      {art === a && (
        <span className="kk-sel">
          <Sym n="check" />
        </span>
      )}
    </button>
  );

  const eintrag = (v: Vorlage) => (
    <button type="button" key={v.id} className={`nk-v knopf-rein ${v.id === vorlage?.id ? 'on' : ''}`} onClick={() => setVorlageId(v.id)}>
      <span className={`nk-radio ${v.id === vorlage?.id ? 'on' : ''}`} />
      <span className="nk-vsym">
        <Sym n={v.symbol} />
      </span>
      <div>
        <b>{v.name}</b>
        <small>{vorlageUntertitel(v)}</small>
      </div>
      {v.standard && (
        <span className="nk-std" title="Standard für neue Kunden">
          <Sym n="star" />
        </span>
      )}
    </button>
  );
  const agentur = vorlagen.filter((v) => !v.eigene);
  const eigene = vorlagen.filter((v) => v.eigene);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onAbbrechen()}>
      <div
        className="sheet ex1 nk1"
        role="dialog"
        aria-label="Neuer Kunde"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onAbbrechen();
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') anlegen();
        }}
      >
        <header>
          <h2>
            <Sym n="userplus" /> Neuer Kunde
          </h2>
          <p>Gespeichert wird nur der Name – keine Anschrift, kein Geburtsdatum.</p>
        </header>
        <div className="body">
          <div className="nk-kopf">
            <span className="avatar a2 nk-av">{name.trim() ? initialen(name) : <Sym n="user" />}</span>
            <div className="nk-f nk-name">
              <label htmlFor="nk-name">Name des Kunden</label>
              <input id="nk-name" className="tin eingabe" autoFocus value={name} placeholder="z. B. Familie Hoffmann" onChange={(e) => setName(e.target.value)} />
              {ok &&
                (dublette ? (
                  <div className="nk-frei warn">
                    <Sym n="alert" /> „{dublette.name}“ gibt es schon ·{' '}
                    <button type="button" className="ds-link knopf-rein" onClick={() => onOeffnen(dublette.id)}>
                      öffnen
                    </button>{' '}
                    oder trotzdem neu anlegen
                  </div>
                ) : (
                  <div className="nk-frei">
                    <Sym n="check" /> Noch kein Kunde mit diesem Namen
                  </div>
                ))}
            </div>
            <div className="nk-f">
              <label htmlFor="nk-titel">Erste Vertragsübersicht</label>
              <span className="kk-input">
                <input id="nk-titel" className="eingabe-rein" value={titel} onChange={(e) => setTitel(e.target.value)} />
                <span className="es-hint">änderbar</span>
              </span>
              <div className="nk-tip">Vorschlag aus Anlass und Jahr</div>
            </div>
          </div>
          <div className="ex-sec">Wie möchten Sie starten?</div>
          <div className="kk-anbieter">
            {kachel('leer', 'fileplus', 'Leer starten', '4 Bereiche, noch ohne Untergruppen')}
            {kachel('vorlage', 'tpl', 'Mit Vorlage', 'Untergruppen mit Symbolen fertig angelegt')}
            {kachel('ki', 'sparkles', 'Mit Unterlagen (KI)', 'KI liest PDFs/Scans, füllt „Aktuell“ vor')}
          </div>
          {art === 'vorlage' && vorlage && (
            <div className="nk-vorlage">
              <div className="nk-liste">
                <div className="nk-gr">Agentur</div>
                {agentur.map(eintrag)}
                {eigene.length > 0 && <div className="nk-gr">Meine Vorlagen</div>}
                {eigene.map(eintrag)}
                <button type="button" className="nk-verw knopf-rein" onClick={onVorlagenVerwalten}>
                  <Sym n="sliders" /> Vorlagen verwalten <Sym n="chev" />
                </button>
              </div>
              <div className="nk-vor">
                <div className="nk-vor-k">
                  <b>Vorschau „{vorlage.name}“</b>
                  <span className={`es-scope ${vorlage.eigene ? '' : 'ag'}`}>
                    <Sym n="user" /> {vorlage.eigene ? 'Meine Vorlage' : 'Agentur-Vorlage'}
                  </span>
                </div>
                <p>Legt nur Bereiche und Untergruppen an, keine leeren Vertragszeilen.</p>
                <VorlagenVorschau v={vorlage} />
                <div className="nk-auto">
                  <Sym n="wand" />
                  <span>
                    <b>Autovervollständigung:</b> Beim Tippen im Feld „Vertrag“ schlägt die App passende Namen vor (z. B. „Hausrat“ in „Wohnen“).
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        <footer>
          <span className="kk-fuss">
            <Sym n="info" /> Bereiche, Untergruppen und Symbole lassen sich danach jederzeit ändern.
          </span>
          <span className="spacer" />
          <button type="button" className="btn" onClick={onAbbrechen}>
            Abbrechen
          </button>
          <button type="button" className="btn primary" disabled={!ok} onClick={anlegen}>
            Kunde anlegen <Sym n="enter" />
          </button>
        </footer>
      </div>
    </div>
  );
}

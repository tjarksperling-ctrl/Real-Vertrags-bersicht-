/**
 * Einstellungen → Speicherort (Bild 8 v1, M5b): gemeinsamer Ordner der Agentur (SharePoint/OneDrive, von OneDrive
 * auf jedem PC synchronisiert) oder „Nur dieser Computer“. Wechsel übernimmt alle Daten, nichts geht verloren.
 */
import { useEffect, useState } from 'react';
import type { AblageArt, AblageOrt, AblageStand, OrdnerInfo } from '../../../../shared/api';
import type { Bestand } from '../../../../shared';
import { Avatar, Schalter, Sym } from '../../komponenten/ui';

const ARTEN: [AblageArt, string, string, string][] = [
  ['sharepoint', 'SharePoint', 'Team-Ordner · empfohlen', 'building'],
  ['onedrive', 'OneDrive', 'freigegebener Ordner', 'cloud'],
  ['lokal', 'Nur dieser Computer', 'ohne Mehrbenutzer', 'monitor'],
];

export function ortGleich(a: AblageOrt | null | undefined, b: AblageOrt | null | undefined): boolean {
  if (!a || !b) return a === b;
  if (a.art === 'lokal' || b.art === 'lokal') return a.art === b.art;
  return a.art === b.art && a.ordner === b.ordner;
}

/** Letzte drei Teile des Pfads (wie im Explorer). */
export function pfadTeile(p: string): string[] {
  return p.split(/[\\/]+/).filter(Boolean).slice(-3);
}

const mb = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toLocaleString('de-DE', { maximumFractionDigits: 1 })} MB`);

export function SpeicherortSeite({
  stand,
  ort,
  setOrt,
  bestand,
  passwortStandard,
  onPasswortStandard,
}: {
  stand: AblageStand | null;
  ort: AblageOrt;
  setOrt: (o: AblageOrt) => void;
  bestand: Bestand;
  passwortStandard: boolean;
  onPasswortStandard: (an: boolean) => void;
}) {
  const [info, setInfo] = useState<OrdnerInfo | null>(null);
  const [letzterOrdner, setLetzterOrdner] = useState<string | null>(ort.ordner ?? stand?.ort.ordner ?? null);
  const aktuell = ortGleich(ort, stand?.ort);

  useEffect(() => {
    setInfo(null);
    if (ort.art === 'lokal' || !ort.ordner) return;
    let aktiv = true;
    void window.api.ordnerInfo(ort).then((i) => aktiv && setInfo(i));
    return () => {
      aktiv = false;
    };
  }, [ort.art, ort.ordner]);

  const waehlen = async () => {
    const p = await window.api.ordnerWaehlen();
    if (!p) return;
    setLetzterOrdner(p);
    setOrt({ art: ort.art === 'lokal' ? 'sharepoint' : ort.art, ordner: p });
  };

  return (
    <>
      <p className="kk-lead">
        Alle Kunden und Vertragsübersichten liegen in einem gemeinsamen Ordner der Agentur. Alle Mitarbeitenden verbinden denselben Ordner, Änderungen erscheinen
        bei den anderen nach wenigen Sekunden. Kein eigener Server nötig.
      </p>
      <div className="ex-sec">
        <span className="kk-n">1</span>Gemeinsamer Ordner
      </div>
      <div className="kk-anbieter" role="radiogroup" aria-label="Speicherort">
        {ARTEN.map(([art, name, unter, sym]) => (
          <button
            type="button"
            key={art}
            role="radio"
            aria-checked={ort.art === art}
            className={`kk-anb knopf-rein ${ort.art === art ? 'on' : ''}`}
            onClick={() => setOrt(art === 'lokal' ? { art, ordner: null } : { art, ordner: ort.ordner ?? letzterOrdner })}
          >
            <span className="es-sym">
              <Sym n={sym} />
            </span>
            <div>
              <b>{name}</b>
              <small>{unter}</small>
            </div>
            {ort.art === art && (
              <span className="kk-sel">
                <Sym n="check" />
              </span>
            )}
          </button>
        ))}
      </div>
      {ort.art === 'lokal' ? (
        <div className="ex-box es-ordner">
          <p className="kk-lead klein" style={{ margin: 0 }}>
            Daten liegen nur auf diesem Computer im Benutzerprofil. Andere sehen sie nicht. Zum gemeinsamen Arbeiten „SharePoint“ oder „OneDrive“ wählen.
          </p>
        </div>
      ) : (
        <div className="ex-box es-ordner">
          {ort.ordner ? (
            <div className="es-pfad" title={ort.ordner}>
              {pfadTeile(ort.ordner).map((t, i, l) => (
                <span key={i} style={{ display: 'contents' }}>
                  <Sym n={i === 0 ? 'cloud' : 'chev'} />
                  {i === l.length - 1 ? <b>{t}</b> : <span>{t}</span>}
                </span>
              ))}
            </div>
          ) : (
            <div className="es-pfad">
              <Sym n="info" /> <span>Noch kein Ordner gewählt</span>
            </div>
          )}
          <button type="button" className="btn" onClick={() => void waehlen()}>
            {ort.ordner ? 'Ordner ändern …' : 'Ordner wählen …'}
          </button>
          {aktuell && stand?.gemeinsam && (
            <button type="button" className="btn ghost" onClick={() => void window.api.ablageOeffnen()}>
              {navigator.platform.startsWith('Mac') ? 'Im Finder öffnen' : 'Im Explorer öffnen'} <Sym n="ext" />
            </button>
          )}
          {ort.ordner && (
            <div className="es-stat">
              {aktuell && (
                <span>
                  <b>{bestand.kunden.length}</b> Kunden
                </span>
              )}
              <span>
                <b>{info ? (aktuell ? bestand.uebersichten.length : info.uebersichten) : '…'}</b> Übersichten
              </span>
              {info && (
                <span>
                  <b>{mb(info.groesse)}</b>
                </span>
              )}
              <span className="spacer" />
              {info && info.personen.length > 0 && (
                <>
                  <span className="es-wer">
                    {info.personen.slice(0, 5).map((p) => (
                      <Avatar key={p.id} id={p.id} name={p.name} title={p.name} />
                    ))}
                  </span>
                  {info.personen.length === 1 ? '1 Person nutzt diesen Ordner' : `${info.personen.length} Mitarbeitende nutzen diesen Ordner`}
                </>
              )}
            </div>
          )}
        </div>
      )}
      {!aktuell && (ort.art === 'lokal' || ort.ordner) && (
        <p className="kk-lead klein es-wechsel" role="status">
          <Sym n="info" />{' '}
          {ort.art === 'lokal'
            ? 'Nach „Speichern“ werden alle Kunden auf diesen Computer übernommen. Der gemeinsame Ordner bleibt unverändert.'
            : info?.vorhanden
              ? `In diesem Ordner liegen schon Daten der Agentur (${info.uebersichten} Übersichten). Nach „Speichern“ kommen Ihre Kunden dazu, nichts geht verloren.`
              : 'Nach „Speichern“ werden alle Kunden in diesen Ordner übernommen. Die anderen verbinden danach denselben Ordner.'}
        </p>
      )}
      <div className="ex-sec">
        <span className="kk-n">2</span>Auf Desktop speichern
      </div>
      <div className="ex-box es-desk">
        <div className="es-vz">
          <label>Ziel</label>
          <div className="kk-input">
            <Sym n="monitor" /> Desktop
          </div>
        </div>
        <div className="es-vz">
          <label>Dateiname</label>
          <div className="kk-input">
            <span className="es-ph">Kunde</span> – <span className="es-ph">Titel</span> – <span className="es-ph">Datum</span>
            <span className="spacer" />
            <span className="es-hint">.vtue</span>
          </div>
        </div>
        <div className="es-bsp">z. B. „Familie Berger – Jahresgespräch 2026 – 02.11.2026.vtue“ · Doppelklick öffnet diesen Stand in der App</div>
        <div className="optrow es-voll">
          <div>
            Beim Speichern ein Passwort anbieten<small>Die Datei wird verschlüsselt und lässt sich nur mit Passwort öffnen.</small>
          </div>
          <Schalter an={passwortStandard} onChange={onPasswortStandard} />
        </div>
      </div>
      <div className="ex-sec">
        <span className="kk-n">3</span>Sicherheit
      </div>
      <div className="ex-box">
        <div className="optrow">
          <div>
            Jede Person schreibt nur ihre eigene Datei
            <small>Keine Konfliktkopien: Die App führt die Änderungen aller zusammen. Gelöschte Kunden bleiben für alle gelöscht.</small>
          </div>
          <span className="kk-fest">
            <Sym n="check" /> immer an
          </span>
        </div>
        <div className="optrow">
          <div>
            Ohne Internet weiterarbeiten<small>Änderungen werden nachgeholt, sobald die Verbindung wieder da ist</small>
          </div>
          <span className="kk-fest">
            <Sym n="check" /> immer an
          </span>
        </div>
      </div>
    </>
  );
}

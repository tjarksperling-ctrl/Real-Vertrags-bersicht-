/** „Auf Desktop speichern“ (Bild 10 v1): eingefrorener Stand als `.vtue`, optional mit Passwort (AES-256). */
import { useMemo, useState } from 'react';
import * as Y from 'yjs';
import { fassungSumme, formatBetrag, formatHeute, leseUebersicht, wurzel, type Kunde } from '../../../shared';
import { Schalter, Sym } from '../komponenten/ui';
import { MIN_LAENGE, passwortStaerke, passwortVorschlag } from '../datei/passwort';

export function DateiSymbol({ groesse = '', schloss = false }: { groesse?: '' | 'gross' | 'mittel'; schloss?: boolean }) {
  return (
    <span className={`ds-ico ${groesse}`} aria-hidden="true">
      <i />
      <b>VTÜ</b>
      {schloss && (
        <span className="ds-lock">
          <Sym n="lock" />
        </span>
      )}
    </span>
  );
}

const zwei = (n: number) => String(n).padStart(2, '0');
export function uhrzeitLang(d: Date): string {
  return `${formatHeute(d)}, ${zwei(d.getHours())}:${zwei(d.getMinutes())} Uhr`;
}

/** Stand ohne Aufgaben (Aufgaben sind intern, Standard: nicht mitspeichern). */
function stand(doc: Y.Doc, mitAufgaben: boolean): Uint8Array {
  if (mitAufgaben) return Y.encodeStateAsUpdate(doc);
  const kopie = new Y.Doc();
  Y.applyUpdate(kopie, Y.encodeStateAsUpdate(doc));
  kopie.transact(() => wurzel(kopie).set('aufgaben', new Y.Array()));
  return Y.encodeStateAsUpdate(kopie);
}

export function DesktopDialog({
  doc,
  kunde,
  benutzer,
  passwortStandard,
  onSchliessen,
  onFertig,
}: {
  doc: Y.Doc;
  kunde: Kunde;
  benutzer: string;
  passwortStandard: boolean;
  onSchliessen: () => void;
  onFertig: (pfad: string, mitPasswort: boolean) => void;
}) {
  const u = useMemo(() => leseUebersicht(doc), [doc]);
  const zeit = useMemo(() => new Date(), []);
  const titel = u.titel || 'Vertragsübersicht';
  const [name, setName] = useState(`${kunde.name} – ${titel} – ${formatHeute(zeit)}`);
  const [ort, setOrt] = useState<'desktop' | 'waehlen'>('desktop');
  const [mitAufgaben, setMitAufgaben] = useState(false);
  const [mitPasswort, setMitPasswort] = useState(passwortStandard);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [zeigen, setZeigen] = useState(false);
  const [zeigen2, setZeigen2] = useState(false);
  const [explorer, setExplorer] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const daten = useMemo(() => stand(doc, mitAufgaben), [doc, mitAufgaben]);
  const kb = Math.max(1, Math.round((daten.length * (mitPasswort ? 1.37 : 1.34) + 600) / 1024));
  const st = passwortStaerke(pw);
  const gleich = pw.length > 0 && pw === pw2;
  const pwOk = !mitPasswort || (pw.length >= MIN_LAENGE && gleich);
  const offene = u.aufgaben.filter((a) => !a.erledigt).length;

  const speichern = async () => {
    if (!pwOk || !name.trim()) return;
    setLaeuft(true);
    setFehler(null);
    const r = await window.api.dateiSpeichern({
      name: name.trim(),
      ort,
      meta: { kunde: kunde.name, kundeId: kunde.id, uebersichtId: u.id, titel, gespeichert: zeit.toISOString(), von: benutzer },
      daten,
      ...(mitPasswort ? { passwort: pw } : {}),
      imOrdnerZeigen: explorer,
    });
    setLaeuft(false);
    if (r.fehler) return setFehler(r.fehler);
    if (r.pfad) onFertig(r.pfad, mitPasswort);
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onSchliessen()}>
      <div
        className="sheet ex1 ds1"
        role="dialog"
        aria-label="Auf Desktop speichern"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onSchliessen();
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') void speichern();
        }}
      >
        <header>
          <h2>
            <Sym n="monitor" /> Auf Desktop speichern
          </h2>
          <p>
            {kunde.name} · {titel} · Stand von heute, {uhrzeitLang(zeit)}
          </p>
        </header>
        <div className="body">
          <div className="ds-datei">
            <DateiSymbol groesse="gross" schloss={mitPasswort} />
            <div className="ds-df">
              <label htmlFor="ds-name">Dateiname</label>
              <div className="kk-input">
                <input id="ds-name" className="eingabe-rein" value={name} onChange={(e) => setName(e.target.value)} />
                <span className="es-hint">.vtue</span>
              </div>
              <div className="ds-ort">
                <Sym n={ort === 'desktop' ? 'monitor' : 'folder'} /> {ort === 'desktop' ? 'Desktop' : 'Ort beim Speichern wählen'}
                <button type="button" className="ds-link knopf-rein" onClick={() => setOrt(ort === 'desktop' ? 'waehlen' : 'desktop')}>
                  {ort === 'desktop' ? 'Anderer Ort …' : 'Doch auf den Desktop'}
                </button>
                <span className="spacer" />
                <span className="ds-gr">ca. {kb} KB</span>
              </div>
            </div>
          </div>
          <div className="ex-sec">Enthält</div>
          <div className="ex-box ds-inhalt">
            <div className="ds-teile">
              <span className="ds-t">
                <Sym n="check" /> Aktuell <small>{formatBetrag(fassungSumme(u.aktuell).gesamtMonat)}</small>
              </span>
              <span className="ds-t">
                <Sym n="check" /> Neu <small>{formatBetrag(fassungSumme(u.neu).gesamtMonat)}</small>
              </span>
              {u.vorteile.stichpunkte.length > 0 && (
                <span className="ds-t">
                  <Sym n="check" /> Vorteile
                </span>
              )}
              <span className="ds-t">
                <Sym n="check" /> Ersparnis-Einstellung
              </span>
              {mitAufgaben && offene > 0 && (
                <span className="ds-t">
                  <Sym n="check" /> {offene} {offene === 1 ? 'Aufgabe' : 'Aufgaben'}
                </span>
              )}
            </div>
            <div className="optrow">
              <div>
                Offene Aufgaben mitspeichern
                <small>{mitAufgaben ? 'An: Aufgaben stehen mit in der Datei' : 'Aus: Aufgaben sind intern und bleiben nur in der App'}</small>
              </div>
              <Schalter an={mitAufgaben} onChange={setMitAufgaben} />
            </div>
          </div>
          <div className="ex-sec ex-sec-row">
            <span>
              <Sym n="lock" /> Mit Passwort schützen
            </span>
            <small>empfohlen, wenn die Datei das Büro verlässt</small>
            <span className="spacer" />
            <Schalter an={mitPasswort} onChange={setMitPasswort} />
          </div>
          {mitPasswort && (
            <div className="ex-box ds-pw">
              <div className="ds-pwf">
                <label htmlFor="ds-pw1">Passwort</label>
                <div className="kk-input ds-mask">
                  <input
                    id="ds-pw1"
                    className="eingabe-rein"
                    type={zeigen ? 'text' : 'password'}
                    autoFocus
                    value={pw}
                    placeholder={`mind. ${MIN_LAENGE} Zeichen`}
                    onChange={(e) => setPw(e.target.value)}
                  />
                  <button type="button" className="pw-eye knopf-rein" title="Passwort anzeigen" onClick={() => setZeigen(!zeigen)}>
                    <Sym n={zeigen ? 'eyeoff' : 'eye'} />
                  </button>
                </div>
              </div>
              <div className="ds-pwf">
                <label htmlFor="ds-pw2">Passwort wiederholen</label>
                <div className={`kk-input ds-mask ${pw2 && !gleich ? 'fehler' : ''}`}>
                  <input id="ds-pw2" className="eingabe-rein" type={zeigen2 ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)} />
                  {gleich ? (
                    <span className="ds-gleich">
                      <Sym n="check" />
                    </span>
                  ) : (
                    <button type="button" className="pw-eye knopf-rein" title="Passwort anzeigen" onClick={() => setZeigen2(!zeigen2)}>
                      <Sym n={zeigen2 ? 'eyeoff' : 'eye'} />
                    </button>
                  )}
                </div>
              </div>
              <div className="ds-st">
                <span className={`ds-bar stufe-${st.stufe}`}>
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <b className={`st-${st.stufe}`}>{pw ? st.text[0]!.toUpperCase() + st.text.slice(1) : ''}</b>
                <button
                  type="button"
                  className="ds-link knopf-rein"
                  onClick={() => {
                    const v = passwortVorschlag();
                    setPw(v);
                    setPw2(v);
                    setZeigen(true);
                  }}
                >
                  <Sym n="wand" /> Sicheres Passwort vorschlagen
                </button>
                <span className="spacer" />
                {gleich ? (
                  <span className="ds-gleich-t">
                    <Sym n="check" /> stimmt überein
                  </span>
                ) : (
                  pw2 && <span className="ds-ungleich">stimmt nicht überein</span>
                )}
              </div>
              <div className="ds-warn">
                <Sym n="info" />
                <span>
                  <b>Passwort gut aufbewahren.</b> Ohne Passwort lässt sich die Datei nicht mehr öffnen, auch nicht durch die Agentur. Passwort nie in derselben E-Mail wie die Datei senden.
                </span>
              </div>
            </div>
          )}
          <div className="ds-so">
            <div>
              <span className="kk-n">1</span>
              <span>
                <b>Fester Stand</b> – spätere Änderungen in der App ändern die Datei nicht.
              </span>
            </div>
            <div>
              <span className="kk-n">2</span>
              <span>
                <b>Doppelklick</b> öffnet die Datei in einem eigenen Fenster, auch mehrere gleichzeitig.
              </span>
            </div>
            <div>
              <span className="kk-n">3</span>
              <span>
                <b>Nur auf diesem Computer</b> – nicht im Agentur-Ordner. Das Original bleibt in der Kundenakte.
              </span>
            </div>
          </div>
          {fehler && <div className="pdf-fehler">Speichern fehlgeschlagen: {fehler}</div>}
        </div>
        <footer>
          <button type="button" className="cbl ds-nach knopf-rein" role="checkbox" aria-checked={explorer} onClick={() => setExplorer(!explorer)}>
            <span className={`cbx ${explorer ? 'on' : ''}`}>{explorer && <Sym n="check" />}</span>
            <span>Danach im Explorer zeigen</span>
          </button>
          <span className="spacer" />
          <button type="button" className="btn" onClick={onSchliessen}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={laeuft || !pwOk || !name.trim()}
            title={pwOk ? undefined : `Passwort mit mindestens ${MIN_LAENGE} Zeichen zweimal gleich eingeben`}
            onClick={() => void speichern()}
          >
            <Sym n={mitPasswort ? 'lock' : 'monitor'} /> {laeuft ? 'Wird gespeichert …' : mitPasswort ? 'Verschlüsselt speichern' : 'Speichern'}
          </button>
        </footer>
      </div>
    </div>
  );
}

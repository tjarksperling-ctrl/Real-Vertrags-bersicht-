/** Dialog „PDF erstellen“ (Bild 5 v2) mit Versand über Outlook (M5b, Microsoft Graph). */
import { useState } from 'react';
import * as Y from 'yjs';
import {
  BEREICH_TYPEN,
  fassungSumme,
  formatBetrag,
  formatHeute,
  pdfDateiname,
  vergleicheBetraege,
  type Editor,
  type PdfInhalt,
  type Uebersicht,
  type OutlookEinstellungen,
  empfaengerLesen,
  mailHtml,
  vorlageFuellen,
} from '../../../shared';
import { Schalter, Sym } from '../komponenten/ui';
import { useMsKonto } from './einst/Outlook';

export function PdfDialog({
  editor,
  u,
  kunde,
  passwortStandard,
  ziel,
  onSchliessen,
  onFertig,
  outlook,
  benutzer,
  onOutlookEinstellungen,
}: {
  outlook?: OutlookEinstellungen | undefined;
  /** „Mein Name“ für die Vorlage (sonst Name aus dem Microsoft-Konto). */
  benutzer?: string | undefined;
  /** „Outlook verbinden“ → Einstellungen öffnen. */
  onOutlookEinstellungen?: (() => void) | undefined;
  editor: Editor;
  u: Uebersicht;
  kunde: string;
  passwortStandard: boolean;
  /** Nur für Screenshots/Tests: ohne Speichern-Dialog in diesen Pfad schreiben. */
  ziel?: string | undefined;
  onSchliessen: () => void;
  onFertig: (text: string) => void;
}) {
  const [inhalt, setInhalt] = useState<PdfInhalt>('beide');
  const [vergleich, setVergleich] = useState(true);
  const [titel, setTitel] = useState(false);
  const [mitPasswort, setMitPasswort] = useState(passwortStandard);
  const [passwort, setPasswort] = useState('');
  const [zeigen, setZeigen] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const datum = formatHeute();
  const v = vergleicheBetraege(fassungSumme(u.aktuell).gesamtMonat, fassungSumme(u.neu).gesamtMonat);
  const bereiche = (f: 'aktuell' | 'neu') => BEREICH_TYPEN.filter((t) => u[f].bereiche[t].aktiv).length;
  const passwortFehlt = mitPasswort && passwort.length < 4;
  // ---- E-Mail (M5b)
  const [konto, setKonto] = useMsKonto();
  const [mail, setMail] = useState(false);
  const [an, setAn] = useState('');
  const [betreff, setBetreff] = useState('');
  const [text, setText] = useState('');
  const [textOffen, setTextOffen] = useState(false);
  const [anhang, setAnhang] = useState(true);
  const [kontakte, setKontakte] = useState<{ name: string; mail: string }[]>([]);
  const empf = empfaengerLesen(an);
  const mailFehlt = mail && (!empf.gueltig.length || empf.fehler.length > 0 || !betreff.trim());
  const mailAn = (an: boolean) => {
    setMail(an);
    if (an && outlook && !betreff) {
      const werte = { Kunde: kunde, Titel: u.titel || 'Vertragsübersicht', Datum: datum, 'Mein Name': konto?.name || benutzer || '' };
      setBetreff(vorlageFuellen(outlook.betreff, werte));
      setText(vorlageFuellen(outlook.text, werte));
    }
  };
  const anTippen = async (w: string) => {
    setAn(w);
    const letztes = w.split(/[;,]/).pop()?.trim() ?? '';
    setKontakte(outlook?.kontakte && konto?.angemeldet && letztes.length >= 2 && !letztes.includes('@') ? await window.api.kontakteSuchen(letztes) : []);
  };
  const kontaktWaehlen = (m: string) => {
    const teile = an.split(/[;,]/).map((t) => t.trim());
    teile[teile.length - 1] = m;
    setAn(teile.filter(Boolean).join('; '));
    setKontakte([]);
  };

  const senden = async () => {
    if (passwortFehlt || mailFehlt || !outlook) return;
    setLaeuft(true);
    setFehler(null);
    let pdf: Uint8Array | undefined;
    let seiten: number | undefined;
    if (anhang) {
      const r = await window.api.pdfErstellen({
        dateiname: pdfDateiname(kunde),
        daten: Y.encodeStateAsUpdate(editor.doc),
        kunde,
        datum,
        optionen: { inhalt, vergleich: inhalt === 'beide' && vergleich, vorteile: u.vorteile.aktiv, ersparnis: u.ersparnisAnzeigen, titel },
        ...(mitPasswort ? { passwort } : {}),
        nurDaten: true,
      });
      if (r.fehler || !r.daten) {
        setLaeuft(false);
        return setFehler(r.fehler ?? 'PDF konnte nicht erstellt werden');
      }
      pdf = r.daten;
      seiten = r.seiten;
    }
    const r = await window.api.mailSenden({
      an: empf.gueltig,
      betreff: betreff.trim(),
      html: mailHtml(text, outlook.signaturAn ? outlook.signatur : undefined),
      ...(pdf ? { anhang: { name: pdfDateiname(kunde), daten: pdf } } : {}),
      entwurf: outlook.vorOeffnen,
    });
    setLaeuft(false);
    if (!r.ok) return setFehlerMail(r.fehler ?? 'E-Mail konnte nicht gesendet werden');
    onFertig(
      outlook.vorOeffnen
        ? `E-Mail in Outlook geöffnet${pdf ? ` · PDF ${seiten ?? '?'} ${seiten === 1 ? 'Seite' : 'Seiten'}` : ''}`
        : `E-Mail an ${empf.gueltig.join(', ')} gesendet${pdf ? ' · mit PDF' : ''} · liegt in „Gesendete Elemente“`,
    );
  };
  const [fehlerMail, setFehlerMail] = useState<string | null>(null);

  const erstellen = async (vorschau: boolean) => {
    if (passwortFehlt) return;
    setLaeuft(true);
    setFehler(null);
    const r = await window.api.pdfErstellen({
      dateiname: pdfDateiname(kunde),
      daten: Y.encodeStateAsUpdate(editor.doc),
      kunde,
      datum,
      optionen: { inhalt, vergleich: inhalt === 'beide' && vergleich, vorteile: u.vorteile.aktiv, ersparnis: u.ersparnisAnzeigen, titel },
      ...(mitPasswort ? { passwort } : {}),
      ...(vorschau ? { vorschau: true } : {}),
      ...(ziel && !vorschau ? { ziel } : {}),
    });
    setLaeuft(false);
    if (r.fehler) return setFehler(r.fehler);
    if (!r.pfad) return;
    if (!vorschau) onFertig(`PDF gespeichert · ${r.seiten ?? '?'} ${r.seiten === 1 ? 'Seite' : 'Seiten'}${mitPasswort ? ' · mit Passwort' : ''}`);
  };

  const wahl = (w: PdfInhalt, mini: ('a' | 'b')[], n: string, d: string) => (
    <button type="button" className={`choice knopf-rein ${inhalt === w ? 'on' : ''}`} onClick={() => setInhalt(w)}>
      <div className="mini">
        {mini.map((m, i) => (
          <i key={i} className={m === 'b' ? 'b' : ''} />
        ))}
      </div>
      <b>{n}</b>
      <small>{d}</small>
    </button>
  );

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onSchliessen()}>
      <div className="sheet ex1 ex2" role="dialog" aria-label="PDF erstellen" onKeyDown={(e) => e.key === 'Escape' && onSchliessen()}>
        <header>
          <h2>PDF erstellen</h2>
          <p>
            {kunde} · {u.titel || 'Vertragsübersicht'} · {datum}
          </p>
        </header>
        <div className="body">
          <div className="ex-sec">Inhalt</div>
          <div className="choices">
            {wahl('aktuell', ['a'], 'Nur Aktuell', `${bereiche('aktuell')} Bereiche`)}
            {wahl('neu', ['b'], 'Nur Neu', `${bereiche('neu')} Bereiche`)}
            {wahl('beide', ['a', 'b'], 'Beide', 'Aktuell, dann Neu')}
          </div>
          <div className="ex-sec">Im PDF</div>
          <div className="ex-box">
            <div className={`optrow ${inhalt === 'beide' ? '' : 'gesperrt'}`}>
              <div>
                Vergleichsseite anhängen<small>Summen von Aktuell und Neu auf einer Seite gegenübergestellt{inhalt === 'beide' ? '' : ' · nur bei „Beide“'}</small>
              </div>
              <Schalter an={inhalt === 'beide' && vergleich} onChange={setVergleich} />
            </div>
            <div className={`optrow ${inhalt === 'aktuell' ? 'gesperrt' : ''}`}>
              <div>
                Vorteile der Änderungen<small>Stichpunkte {vergleich && inhalt === 'beide' ? 'auf der Vergleichsseite' : 'nach dem Gesamtbetrag in „Neu“'} · gleicher Schalter wie „im PDF“</small>
              </div>
              <Schalter an={u.vorteile.aktiv} onChange={(an) => editor.vorteileAktiv(an)} />
            </div>
            <div className="optrow">
              <div>
                Ersparnis anzeigen
                <small>
                  {u.ersparnisAnzeigen
                    ? `${formatBetrag(v.differenzMonat, { mitVorzeichen: true })} pro Monat · ${formatBetrag(v.differenzJahr, { mitVorzeichen: true })} pro Jahr · gleicher Schalter wie in der Ansicht „Neu“`
                    : 'aus – keine Differenzen und keine Ersparnis im PDF'}
                </small>
              </div>
              <Schalter an={u.ersparnisAnzeigen} onChange={(an) => editor.ersparnisAnzeigen(an)} />
            </div>
            <div className="optrow cb">
              <button type="button" className="cbl knopf-rein" role="checkbox" aria-checked={titel} onClick={() => setTitel(!titel)}>
                <span className={`cbx ${titel ? 'on' : ''}`}>{titel && <Sym n="check" />}</span>
                <div>
                  Titel im PDF-Kopf<small>„{u.titel || 'Vertragsübersicht'}“ zusätzlich in der Kopfzeile jeder Seite</small>
                </div>
              </button>
            </div>
            <div className="kopf-vorschau">
              <span className="kv-l">Kopfzeile</span>
              <span className="kv-t">
                Vertragsübersicht{titel && <span className="kv-titel">{u.titel}</span>}
              </span>
              <span className="kv-m">
                <b>{kunde}</b>
                <span className="kv-f">{inhalt === 'aktuell' ? 'Aktuell' : 'Neu'}</span>
                {datum}
              </span>
            </div>
            <div className={`optrow ${mitPasswort ? 'pw-row' : ''}`}>
              <div>
                Mit Passwort schützen
                <small>{mitPasswort ? 'Passwort separat mitteilen, nicht in derselben E-Mail' : 'PDF lässt sich nur mit Passwort öffnen'}</small>
              </div>
              {mitPasswort && (
                <span className={`pw-feld ${passwortFehlt && passwort ? 'fehler' : ''}`}>
                  <Sym n="lock" />
                  <input
                    className="eingabe-rein"
                    type={zeigen ? 'text' : 'password'}
                    autoFocus
                    aria-label="Passwort"
                    placeholder="mind. 4 Zeichen"
                    value={passwort}
                    onChange={(e) => setPasswort(e.target.value)}
                  />
                  <button type="button" className="pw-eye knopf-rein" title="Passwort anzeigen" onClick={() => setZeigen(!zeigen)}>
                    <Sym n={zeigen ? 'eyeoff' : 'eye'} />
                  </button>
                </span>
              )}
              <Schalter an={mitPasswort} onChange={setMitPasswort} />
            </div>
          </div>
          <div className={`ex-sec ex-sec-row ${konto?.angemeldet && outlook ? '' : 'gesperrt'}`}>
            <span>Per E-Mail senden</span>
            <small>
              {konto?.angemeldet ? (
                `über Ihr Outlook-Konto · ${outlook?.vorOeffnen ? 'öffnet die fertige Mail in Outlook' : 'danach in „Gesendete Elemente“'}`
              ) : (
                <>
                  zuerst Outlook verbinden ·{' '}
                  <button type="button" className="knopf-rein mb-link" onClick={onOutlookEinstellungen}>
                    Einstellungen → Outlook
                  </button>
                </>
              )}
            </small>
            <span className="spacer" />
            <Schalter an={mail} onChange={(x) => konto?.angemeldet && outlook && mailAn(x)} />
          </div>
          {mail && (
            <div className="mailbox">
              <div className="r mail-an">
                <span>An</span>
                <input className="eingabe-rein" autoFocus aria-label="An" placeholder="E-Mail-Adresse oder Name" value={an} onChange={(e) => void anTippen(e.target.value)} />
                {kontakte.length > 0 && (
                  <div className="mail-vorschlaege" role="listbox">
                    {kontakte.map((k) => (
                      <button type="button" key={k.mail} role="option" aria-selected={false} className="knopf-rein" onClick={() => kontaktWaehlen(k.mail)}>
                        <b>{k.name}</b> <small>{k.mail}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="r">
                <span>Betreff</span>
                <input className="eingabe-rein" aria-label="Betreff" value={betreff} onChange={(e) => setBetreff(e.target.value)} />
              </div>
              <div className="r mail-text">
                <span>Text</span>
                {textOffen ? (
                  <textarea className="eingabe-rein" aria-label="Text" rows={5} autoFocus value={text} onChange={(e) => setText(e.target.value)} />
                ) : (
                  <button type="button" className="knopf-rein mail-text-kurz" title="Text ändern" onClick={() => setTextOffen(true)}>
                    {text.split('\n').filter(Boolean).slice(0, 2).join(' · ')} <Sym n="pencil" />
                  </button>
                )}
              </div>
              <div className="r">
                <span>Anhang</span>
                <span className="attach">
                  <Sym n="pdf" /> {pdfDateiname(kunde)}
                  {mitPasswort ? ' · mit Passwort' : ''}
                </span>
                <span className="spacer" />
                <Schalter an={anhang} onChange={setAnhang} />
              </div>
            </div>
          )}
          {fehler && <div className="pdf-fehler">PDF konnte nicht erstellt werden: {fehler}</div>}
          {fehlerMail && <div className="pdf-fehler">E-Mail nicht gesendet: {fehlerMail}</div>}
        </div>
        <footer>
          <button type="button" className="btn ghost" disabled={laeuft || passwortFehlt} onClick={() => void erstellen(true)}>
            <Sym n="file" /> Vorschau öffnen
          </button>
          <span className="spacer" />
          <button type="button" className="btn" onClick={onSchliessen}>
            Abbrechen
          </button>
          {mail ? (
            <>
              <button type="button" className="btn" disabled={laeuft || passwortFehlt} onClick={() => void erstellen(false)}>
                <Sym n="pdf" /> Nur speichern
              </button>
              <button type="button" className="btn primary" disabled={laeuft || passwortFehlt || mailFehlt} onClick={() => void senden()}>
                <Sym n="mail" /> {laeuft ? 'Wird gesendet …' : outlook?.vorOeffnen ? 'In Outlook öffnen' : 'Erstellen & senden'}
              </button>
            </>
          ) : (
            <button type="button" className="btn primary" disabled={laeuft || passwortFehlt} onClick={() => void erstellen(false)}>
              <Sym n="pdf" /> {laeuft ? 'Wird erstellt …' : 'PDF speichern'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

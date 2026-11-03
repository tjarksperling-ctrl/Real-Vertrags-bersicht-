/**
 * Einstellungen → Outlook (Bild 8 v1, M5b): Microsoft-Konto, Senden, Vorlage für die E-Mail.
 * Abweichung vom Mockup: Graph liefert die Outlook-Signatur nicht – die Signatur wird hier einmal eingetragen.
 */
import { useEffect, useRef, useState } from 'react';
import { PLATZHALTER, type OutlookEinstellungen } from '../../../../shared';
import type { MsKonto, MsZugang } from '../../../../shared/api';
import { Schalter, Sym } from '../../komponenten/ui';

export function useMsKonto(): [MsKonto | null, (k: MsKonto) => void] {
  const [k, setK] = useState<MsKonto | null>(null);
  useEffect(() => {
    void window.api.msKonto().then(setK);
  }, []);
  return [k, setK];
}

const datum = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');

/** Microsoft-Konto (auch für Copilot genutzt). */
export function MsKontoBox({ konto, setKonto }: { konto: MsKonto | null; setKonto: (k: MsKonto) => void }) {
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const anmelden = async () => {
    setLaeuft(true);
    setFehler(null);
    const r = await window.api.msAnmelden();
    setLaeuft(false);
    if (r.konto) setKonto(r.konto);
    else setFehler(r.fehler ?? 'Anmeldung fehlgeschlagen');
  };
  if (!konto) return <div className="ex-box es-konto">…</div>;
  if (!konto.eingerichtet) return <ZugangBox onFertig={() => void window.api.msKonto().then(setKonto)} />;
  return (
    <>
      <div className="ex-box es-konto">
        <span className="es-ms">
          <i />
          <i />
          <i />
          <i />
        </span>
        {konto.angemeldet ? (
          <div className="es-konto-t">
            <b>{konto.name}</b>
            <small>
              {konto.mail} · Microsoft 365{konto.seit ? ` · angemeldet seit ${datum(konto.seit)}` : ''}
            </small>
          </div>
        ) : (
          <div className="es-konto-t">
            <b>Nicht angemeldet</b>
            <small>Anmeldung im Browser mit dem Microsoft-365-Konto der Agentur</small>
          </div>
        )}
        <span className="spacer" />
        {konto.angemeldet ? (
          <>
            <button
              type="button"
              className="btn"
              disabled={laeuft}
              onClick={async () => {
                await window.api.msAbmelden();
                await anmelden();
              }}
            >
              Anderes Konto
            </button>
            <button
              type="button"
              className="btn ghost kk-trennen"
              onClick={async () => {
                await window.api.msAbmelden();
                setKonto(await window.api.msKonto());
              }}
            >
              Abmelden
            </button>
          </>
        ) : (
          <button type="button" className="btn primary" disabled={laeuft} onClick={() => void anmelden()}>
            {laeuft ? 'Browser geöffnet …' : 'Bei Microsoft anmelden'}
          </button>
        )}
      </div>
      {fehler && <p className="kk-lead klein es-fehler">{fehler}</p>}
    </>
  );
}

/** Einmalig: Anwendungs-ID + Verzeichnis-ID der App-Registrierung (Entra ID) eintragen. */
function ZugangBox({ onFertig }: { onFertig: () => void }) {
  const [z, setZ] = useState<MsZugang>({ clientId: '', tenantId: '' });
  const [fehler, setFehler] = useState<string | null>(null);
  return (
    <div className="ex-box es-vorlage es-zugang">
      <div className="es-konto-t">
        <b>Microsoft-Zugang der Agentur einrichten</b>
        <small>Einmalig für die ganze Agentur: die beiden IDs aus Entra ID → App-Registrierung „Vertragsübersicht“ → Übersicht (Anleitung: ANLEITUNG-MICROSOFT.md).</small>
      </div>
      <div className="es-vz">
        <label>Anwendungs-ID (Client)</label>
        <input className="kk-input" value={z.clientId} placeholder="00000000-0000-0000-0000-000000000000" onChange={(e) => setZ({ ...z, clientId: e.target.value })} />
      </div>
      <div className="es-vz">
        <label>Verzeichnis-ID (Mandant)</label>
        <input className="kk-input" value={z.tenantId} placeholder="00000000-0000-0000-0000-000000000000" onChange={(e) => setZ({ ...z, tenantId: e.target.value })} />
      </div>
      <div className="es-platz">
        {fehler && <span className="es-fehler">{fehler}</span>}
        <span className="spacer" />
        <button
          type="button"
          className="btn primary"
          disabled={!z.clientId.trim() || !z.tenantId.trim()}
          onClick={async () => {
            const r = await window.api.msZugangSetzen(z);
            if (r.ok) onFertig();
            else setFehler(r.fehler ?? 'Ungültig');
          }}
        >
          Übernehmen
        </button>
      </div>
    </div>
  );
}

/** Textfeld mit Platzhalter-Knöpfen ({Kunde} …). */
function useVorlageFeld({ wert, onChange, mehrzeilig, label }: { wert: string; onChange: (w: string) => void; mehrzeilig?: boolean; label: string }) {
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  return { ref, el: mehrzeilig ? <textarea ref={ref} className="kk-input es-text" aria-label={label} rows={6} value={wert} onChange={(e) => onChange(e.target.value)} /> : <input ref={ref} className="kk-input" aria-label={label} value={wert} onChange={(e) => onChange(e.target.value)} /> };
}

export function OutlookSeite({ o, onChange, konto, setKonto }: { o: OutlookEinstellungen; onChange: (o: OutlookEinstellungen) => void; konto: MsKonto | null; setKonto: (k: MsKonto) => void }) {
  const [zuletzt, setZuletzt] = useState<'betreff' | 'text'>('text');
  const betreff = useVorlageFeld({ wert: o.betreff, onChange: (w) => onChange({ ...o, betreff: w }), label: 'Betreff' });
  const text = useVorlageFeld({ wert: o.text, onChange: (w) => onChange({ ...o, text: w }), mehrzeilig: true, label: 'Text' });
  const einfuegen = (p: string) => {
    const f = zuletzt === 'betreff' ? betreff : text;
    const el = f.ref.current;
    const alt = zuletzt === 'betreff' ? o.betreff : o.text;
    const pos = el?.selectionStart ?? alt.length;
    const neu = `${alt.slice(0, pos)}{${p}}${alt.slice(el?.selectionEnd ?? pos)}`;
    onChange({ ...o, [zuletzt]: neu });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(pos + p.length + 2, pos + p.length + 2);
    });
  };
  return (
    <>
      <p className="kk-lead">
        PDFs gehen direkt aus der App per E-Mail raus, über Ihr bestehendes Microsoft-365-Konto. Die Anmeldung läuft über Microsoft, die App kennt Ihr Passwort nicht.
      </p>
      <div className="ex-sec">
        <span className="kk-n">1</span>Konto
      </div>
      <MsKontoBox konto={konto} setKonto={setKonto} />
      <div className="ex-sec">
        <span className="kk-n">2</span>Senden
      </div>
      <div className="ex-box">
        <div className="optrow">
          <div>
            E-Mail vor dem Senden in Outlook öffnen<small>Aus: „Erstellen &amp; senden“ schickt sofort. An: Outlook öffnet die fertige Mail, Sie senden selbst.</small>
          </div>
          <Schalter an={o.vorOeffnen} onChange={(an) => onChange({ ...o, vorOeffnen: an })} />
        </div>
        <div className={`optrow ${o.signaturAn ? 'es-sig-an' : ''}`}>
          <div>
            Signatur anhängen<small>Outlook gibt seine Signatur nicht an andere Apps weiter – bitte hier einmal eintragen.</small>
          </div>
          <Schalter an={o.signaturAn} onChange={(an) => onChange({ ...o, signaturAn: an })} />
        </div>
        {o.signaturAn && (
          <textarea
            className="kk-input es-text es-signatur"
            rows={3}
            aria-label="Signatur"
            placeholder={'Tjark Sperling\nAgentur Muster · Telefon …'}
            value={o.signatur}
            onChange={(e) => onChange({ ...o, signatur: e.target.value })}
          />
        )}
        <div className="optrow">
          <div>
            Empfänger aus Outlook-Kontakten vorschlagen<small>Beim Tippen im Feld „An“ erscheinen passende Kontakte</small>
          </div>
          <Schalter an={o.kontakte} onChange={(an) => onChange({ ...o, kontakte: an })} />
        </div>
      </div>
      <div className="ex-sec">
        <span className="kk-n">3</span>Vorlage für die E-Mail
      </div>
      <div className="ex-box es-vorlage">
        <div className="es-vz" onFocus={() => setZuletzt('betreff')}>
          <label>Betreff</label>
          {betreff.el}
        </div>
        <div className="es-vz" onFocus={() => setZuletzt('text')}>
          <label>Text</label>
          {text.el}
        </div>
        <div className="es-platz">
          Platzhalter einfügen:
          {PLATZHALTER.map((p) => (
            <button type="button" key={p} className="es-ph knopf-rein" onMouseDown={(e) => e.preventDefault()} onClick={() => einfuegen(p)}>
              {p}
            </button>
          ))}
          <span className="spacer" />
          <span className="es-hint">Im PDF-Dialog vor dem Senden änderbar</span>
        </div>
      </div>
    </>
  );
}

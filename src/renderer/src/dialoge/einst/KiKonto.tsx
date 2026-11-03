/**
 * Einstellungen → KI-Konto (Bild 6b v1, M5b angepasst): Anbieter Microsoft 365 Copilot über das Microsoft-Konto
 * (kein eigener API-Schlüssel), Verbindung testen, Datenschutz. Weitere Anbieter folgen über dieselbe Schnittstelle.
 */
import { useState } from 'react';
import type { MsKonto } from '../../../../shared/api';
import { Schalter, Sym } from '../../komponenten/ui';
import { MsKontoBox } from './Outlook';

export function KiKontoSeite({
  konto,
  setKonto,
  kiHinweis,
  onKiHinweis,
}: {
  konto: MsKonto | null;
  setKonto: (k: MsKonto) => void;
  kiHinweis: boolean;
  onKiHinweis: (an: boolean) => void;
}) {
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const testen = async () => {
    setLaeuft(true);
    setTest(null);
    const r = await window.api.kiTesten();
    setLaeuft(false);
    setTest(r.ok ? { ok: true, text: `Verbindung erfolgreich (Antwort in ${((r.ms ?? 0) / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} s)` } : { ok: false, text: r.fehler ?? 'Keine Verbindung' });
  };
  return (
    <>
      <p className="kk-lead">
        Die KI liest Unterlagen (PDFs, Scans) aus und füllt „Aktuell“ vor. Genutzt wird Microsoft 365 Copilot im Microsoft-Konto der Agentur – kein eigener Schlüssel, keine
        zusätzliche Rechnung. Voraussetzung: eine Lizenz „Microsoft 365 Copilot“ je Person.
      </p>
      <div className="ex-sec">
        <span className="kk-n">1</span>Anbieter
      </div>
      <div className="kk-anbieter">
        <div className="kk-anb on">
          <span className="es-sym kk-copilot">
            <Sym n="sparkles" />
          </span>
          <div>
            <b>Microsoft 365 Copilot</b>
            <small>über Ihr Microsoft-Konto · Vorschau-Schnittstelle</small>
          </div>
          <span className="kk-sel">
            <Sym n="check" />
          </span>
        </div>
        <div className="kk-anb kk-spaeter" title="Weitere Anbieter lassen sich später über dieselbe Schnittstelle ergänzen.">
          <span className="es-sym">
            <Sym n="plus" />
          </span>
          <div>
            <b>Weitere Anbieter</b>
            <small>Azure OpenAI (EU), Claude, Mistral … später möglich</small>
          </div>
        </div>
      </div>
      <div className="ex-sec">
        <span className="kk-n">2</span>Zugang
      </div>
      <MsKontoBox konto={konto} setKonto={setKonto} />
      {konto?.angemeldet && (
        <div className="es-platz ki-test">
          <button type="button" className="btn" disabled={laeuft} onClick={() => void testen()}>
            {laeuft ? 'Wird geprüft …' : 'Verbindung testen'}
          </button>
          {test && (
            <span className={test.ok ? 'ki-ok' : 'ki-fehler'}>
              <Sym n={test.ok ? 'check' : 'alert'} /> {test.text}
            </span>
          )}
        </div>
      )}
      <div className="ex-sec">
        <span className="kk-n">3</span>Datenschutz
      </div>
      <div className="ex-box">
        <div className="optrow">
          <div>
            Kundenname wird nicht mitgesendet<small>Weder im Auftrag an die KI noch im Dateinamen der Unterlage. Die KI soll keine Personendaten zurückgeben.</small>
          </div>
          <span className="kk-fest">
            <Sym n="check" /> immer an
          </span>
        </div>
        <div className="optrow">
          <div>
            Unterlagen nach der Auswertung verwerfen<small>Liegt nur während der Auswertung in Ihrem OneDrive, danach endgültig gelöscht. Nichts in der App gespeichert.</small>
          </div>
          <span className="kk-fest">
            <Sym n="check" /> immer an
          </span>
        </div>
        <div className="optrow">
          <div>
            Auftragsverarbeitung<small>Copilot läuft im Microsoft-365-Konto der Agentur und ist durch deren Vertrag mit Microsoft (DPA) abgedeckt.</small>
          </div>
          <span className="kk-fest">
            <Sym n="check" /> Microsoft-Vertrag
          </span>
        </div>
        <div className="optrow">
          <div>
            Hinweis vor jedem KI-Import zeigen<small>Kurze Erinnerung, dass Unterlagen an Copilot gehen und das Ergebnis geprüft werden muss</small>
          </div>
          <Schalter an={kiHinweis} onChange={onKiHinweis} />
        </div>
      </div>
    </>
  );
}

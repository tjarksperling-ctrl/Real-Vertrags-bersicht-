/** Startseite (schlicht, M2): Begrüßung und „Zuletzt bearbeitet“. Schnellstart, Aufgaben, Angepinnt folgen mit M5. */
import { formatBetrag, type Bestand } from '../../../shared';
import { Avatar, Sym } from '../komponenten/ui';

const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export function gruss(d = new Date()): string {
  const h = d.getHours();
  return h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
}

export function wann(iso: string, jetzt = new Date()): string {
  const d = new Date(iso);
  const tag = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((tag(jetzt) - tag(d)) / 86400000);
  if (diff === 0) return `heute, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (diff === 1) return 'gestern';
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
}

export function Start({ bestand, vorname, onOeffnen, onNeuerKunde }: { bestand: Bestand; vorname: string; onOeffnen: (uebersichtId: string) => void; onNeuerKunde: () => void }) {
  const heute = new Date();
  const kunde = new Map(bestand.kunden.map((k) => [k.id, k]));
  const liste = bestand.uebersichten.slice(0, 12);
  return (
    <main className="main">
      <div className="toolbar start">
        <div>
          <h1>
            {gruss(heute)}, {vorname}
          </h1>
          <div className="datum">
            {TAGE[heute.getDay()]}, {heute.getDate()}. {MONATE[heute.getMonth()]} {heute.getFullYear()}
          </div>
        </div>
      </div>
      <div className="content narrow start">
        <div className="section-title">
          Zuletzt bearbeitet<span className="spacer" />
          <span className="hdr-note">Beitrag pro Monat</span>
        </div>
        <div className="panel">
          {liste.map((u) => {
            const k = kunde.get(u.kundeId);
            if (!k) return null;
            const d = u.gesamtNeu - u.gesamtAktuell;
            return (
              <div key={u.id} className="crow klickbar" onClick={() => onOeffnen(u.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOeffnen(u.id)}>
                <Avatar id={k.id} name={k.name} />
                <div className="cmain">
                  <b>{k.name}</b>
                  <small>
                    {u.titel || 'Vertragsübersicht'} · {wann(u.geaendert, heute)}
                  </small>
                </div>
                <div className="cval">
                  <small>Aktuell</small>
                  {formatBetrag(u.gesamtAktuell)}
                </div>
                <div className="cval">
                  <small>Neu</small>
                  {formatBetrag(u.gesamtNeu)}
                </div>
                <div className="cdiff">
                  {d === 0 ? <span className="diff0">gleich</span> : <span className={`badge ${d < 0 ? 'green' : 'orange'}`}>{formatBetrag(d, { mitVorzeichen: true })}</span>}
                </div>
                <span className="go">
                  <Sym n="chev" />
                </span>
              </div>
            );
          })}
          {liste.length === 0 && (
            <div className="start-leer">
              <b>Noch keine Kunden</b>
              <span>Legen Sie den ersten Kunden an – gespeichert wird nur der Name.</span>
              <button type="button" className="btn primary" onClick={onNeuerKunde}>
                <Sym n="plus" /> Neuer Kunde
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

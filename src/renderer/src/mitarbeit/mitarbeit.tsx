/**
 * Gemeinsam bearbeiten (Bild 15, M5b): Speicherstatus, Personen im gemeinsamen Ordner,
 * Anwesenheit in der Kopfzeile mit Erklärkarte.
 */
import { useEffect, useMemo, useState } from 'react';
import { anwesendIn, uhrzeit, type FremdMarke } from '../../../shared';
import type { AblageStand, PersonStand } from '../../../shared/api';
import { Avatar, Sym } from '../komponenten/ui';

/** Speicherstatus (lokal / gemeinsamer Ordner / offline). */
export function useAblage(): AblageStand | null {
  const [s, setS] = useState<AblageStand | null>(null);
  useEffect(() => {
    let aktiv = true;
    void window.api.ablageStand().then((x) => aktiv && setS(x));
    const ab = window.api.aufAblageStatus(setS);
    return () => {
      aktiv = false;
      ab();
    };
  }, []);
  return s;
}

/** Alle Personen im gemeinsamen Ordner (+ Uhr, damit „gerade drin“ abläuft). */
export function usePersonen(): { personen: PersonStand[]; jetzt: number } {
  const [personen, setPersonen] = useState<PersonStand[]>([]);
  const [jetzt, setJetzt] = useState(() => Date.now());
  useEffect(() => {
    let aktiv = true;
    void window.api.personen().then((l) => aktiv && setPersonen(l));
    const ab = window.api.aufPersonen((l) => {
      setPersonen(l);
      setJetzt(Date.now());
    });
    const t = setInterval(() => setJetzt(Date.now()), 15000);
    return () => {
      aktiv = false;
      ab();
      clearInterval(t);
    };
  }, []);
  return { personen, jetzt };
}

/** Wo jemand anderes gerade steht: Vertrag → Name + Feld. */
export type FremdOrte = Map<string, { name: string; id: string; spalte: string }>;

export function fremdOrte(andere: PersonStand[]): FremdOrte {
  const m: FremdOrte = new Map();
  for (const p of andere) if (p.ort) m.set(p.ort.vertragId, { name: p.name, id: p.id, spalte: p.ort.spalte });
  return m;
}

export interface Mitarbeit {
  /** Andere in dieser Übersicht. */
  andere: PersonStand[];
  orte: FremdOrte;
  marken: Map<string, FremdMarke>;
  jetzt: number;
}

export function useMitarbeit(uebersichtId: string | null, ichId: string | null, marken: Map<string, FremdMarke>): Mitarbeit {
  const { personen, jetzt } = usePersonen();
  const andere = useMemo(() => (uebersichtId && ichId ? anwesendIn(personen, ichId, uebersichtId, jetzt) : []), [personen, ichId, uebersichtId, jetzt]);
  const orte = useMemo(() => fremdOrte(andere), [andere]);
  return { andere, orte, marken, jetzt };
}

const ANSICHT: Record<string, string> = { aktuell: '„Aktuell“', neu: '„Neu“', neben: '„Nebeneinander“' };

/** Kürzel der anderen in der Kopfzeile, Klick → Erklärkarte (Bild 15). */
export function Anwesende({ andere, onHinspringen }: { andere: PersonStand[]; onHinspringen: (p: PersonStand) => void }) {
  const [offen, setOffen] = useState<string | null>(null);
  const p = andere.find((x) => x.id === offen);
  useEffect(() => {
    if (offen && !p) setOffen(null);
  }, [offen, p]);
  if (!andere.length) return null;
  const vorname = (n: string) => n.split(' ')[0] ?? n;
  return (
    <span className="mb-anwesend">
      {andere.map((x) => (
        <button
          type="button"
          key={x.id}
          className="knopf-rein mb-av-knopf"
          title={`${x.name} arbeitet gerade auch hier`}
          aria-expanded={offen === x.id}
          onClick={() => setOffen(offen === x.id ? null : x.id)}
        >
          <Avatar id={x.id} name={x.name} />
        </button>
      ))}
      {p && (
        <div className="mb-karte" role="dialog" aria-label={`${p.name} arbeitet gerade auch hier`} onMouseLeave={() => setOffen(null)}>
          <span className="mb-pfeil" />
          <div className="mb-kopf">
            <Avatar id={p.id} name={p.name} />
            <div>
              <b>{p.name}</b> arbeitet gerade auch hier
              <small>
                {p.seit ? `seit ${uhrzeit(p.seit)}` : 'gerade eben'}
                {p.ansicht && ANSICHT[p.ansicht] ? ` · in ${ANSICHT[p.ansicht]}` : ''}
              </small>
            </div>
          </div>
          {p.ort?.wo && (
            <div className="mb-wo">
              <Sym n="pencil" /> {p.ort.wo} <span className="spacer" />
              <button
                type="button"
                className="mb-link knopf-rein"
                onClick={() => {
                  onHinspringen(p);
                  setOffen(null);
                }}
              >
                Hinspringen
              </button>
            </div>
          )}
          <ul>
            <li>Niemand wird gesperrt – Sie können beide überall gleichzeitig arbeiten.</li>
            <li>Was {vorname(p.name)} ändert, sehen Sie nach wenigen Sekunden, und umgekehrt.</li>
            <li>Ändern Sie beide dasselbe Feld, gilt der zuletzt eingegebene Wert.</li>
          </ul>
        </div>
      )}
    </span>
  );
}

/** Statuszeile unten in der Seitenleiste. */
export function SpeicherStatus({ s }: { s: AblageStand | null }) {
  if (!s || !s.gemeinsam)
    return (
      <div className="row" title="Nur auf diesem Computer gespeichert. Gemeinsamer Ordner: Einstellungen → Speicherort.">
        <Sym n="cloud" /> Lokal gespeichert <span className="dot" style={{ marginLeft: 'auto' }} />
      </div>
    );
  const dienst = s.ort.art === 'onedrive' ? 'OneDrive' : 'SharePoint';
  if (!s.online)
    return (
      <div className="row mb-off" title="Ihre Änderungen sind auf diesem Computer gesichert und werden automatisch zusammengeführt, sobald die Verbindung wieder da ist.">
        <Sym n="cloudoff" /> Offline{s.wartend > 0 ? ` · ${s.wartend} ${s.wartend === 1 ? 'Änderung wartet' : 'Änderungen warten'}` : ''}
        <span className="dot" style={{ marginLeft: 'auto', background: 'var(--orange)' }} />
      </div>
    );
  if (s.fehler)
    return (
      <div className="row mb-fehler" title={s.fehler}>
        <Sym n="cloudoff" /> Speichern fehlgeschlagen <span className="dot" style={{ marginLeft: 'auto', background: '#ff3b30' }} />
      </div>
    );
  return (
    <div className="row" title={`Gemeinsamer Ordner: ${s.wurzel ?? ''}`}>
      <Sym n="cloud" /> {dienst} · alles gespeichert <span className="dot" style={{ marginLeft: 'auto' }} />
    </div>
  );
}

/** Hinweis beim Wechsel auf offline (Bild 15 offline). */
export function OfflineHinweis({ s }: { s: AblageStand | null }) {
  const [zeigen, setZeigen] = useState(false);
  const offline = !!s?.gemeinsam && !s.online;
  useEffect(() => {
    if (!offline) {
      setZeigen(false);
      return;
    }
    setZeigen(true);
    const t = setTimeout(() => setZeigen(false), 9000);
    return () => clearTimeout(t);
  }, [offline]);
  if (!zeigen) return null;
  return (
    <div className="ub-toast mb-toast" role="status">
      <Sym n="cloudoff" />
      <span>
        <b>Keine Verbindung zu {s?.ort.art === 'onedrive' ? 'OneDrive' : 'SharePoint'}</b> – Sie können normal weiterarbeiten.
        <br />
        <small>Ihre Änderungen sind auf diesem Computer gesichert und werden automatisch zusammengeführt, sobald die Verbindung wieder da ist.</small>
      </span>
    </div>
  );
}

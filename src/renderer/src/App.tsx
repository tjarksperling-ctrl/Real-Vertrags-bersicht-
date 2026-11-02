/** App-Rahmen: Seitenleiste + Start bzw. Editor, Dialoge, globale Tastenkürzel. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as Y from 'yjs';
import {
  BEREICH_NAME,
  BEREICH_TYPEN,
  baueKatalog,
  fassungAusVorlage,
  leereFassung,
  leseBestand,
  neueUebersicht,
  neuerKunde,
  leseUebersicht,
  type Katalog,
} from '../../shared';
import type { AppInfo } from '../../shared/api';
import { gespeichertLaden, Speicher, type Gespeichert } from './daten/speicher';
import { useDocVersion } from './daten/hooks';
import { darstellungAnwenden } from './daten/darstellung';
import { Seitenleiste } from './komponenten/Seitenleiste';
import { Sym } from './komponenten/ui';
import { Start } from './seiten/Start';
import { EditorSeite, type Ansicht } from './seiten/Editor';
import { Leiste } from './komponenten/Leiste';
import { NeuerKundeDialog, type NeuerKundeErgebnis } from './dialoge/NeuerKunde';
import { EinstellungenDialog, KuerzelListe, type EinstSeite } from './dialoge/Einstellungen';

type Dialog = null | { art: 'neuerKunde' } | { art: 'einstellungen'; seite: EinstSeite } | { art: 'kuerzel' };

interface Band {
  uebersichtId: string;
  kunde: string;
  vorlage: string;
  aus: string[];
}

export function App() {
  const [basis, setBasis] = useState<{ speicher: Speicher; info: AppInfo } | null>(null);
  const [gespeichert, setGespeichert] = useState<Gespeichert | null>(null);

  useEffect(() => {
    void (async () => {
      const info = await window.api.info();
      const [speicher, g] = await Promise.all([Speicher.oeffnen(info.demo), gespeichertLaden()]);
      darstellungAnwenden(g.einstellungen.darstellung);
      setGespeichert(g);
      setBasis({ speicher, info });
    })();
  }, []);

  if (!basis || !gespeichert) return <div className="laedt" />;
  return <Oberflaeche speicher={basis.speicher} info={basis.info} gespeichert={gespeichert} setGespeichert={setGespeichert} />;
}

function Oberflaeche({
  speicher,
  info,
  gespeichert,
  setGespeichert,
}: {
  speicher: Speicher;
  info: AppInfo;
  gespeichert: Gespeichert;
  setGespeichert: (g: Gespeichert) => void;
}) {
  const bestandVersion = useDocVersion(speicher.bestand);
  const bestand = useMemo(() => leseBestand(speicher.bestand), [speicher, bestandVersion]);
  const [offen, setOffen] = useState<{ id: string; doc: Y.Doc } | null>(null);
  const [ansicht, setAnsicht] = useState<Ansicht>('aktuell');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [katalog, setKatalog] = useState<Katalog | null>(null);
  const [band, setBand] = useState<Band | null>(null);
  const [neuId, setNeuId] = useState<string | null>(null);
  const [leisteOffen, setLeisteOffen] = useState(false);
  const suche = useRef<HTMLInputElement>(null);

  const oeffnen = useCallback(
    async (uebersichtId: string) => {
      const doc = await speicher.uebersicht(uebersichtId);
      if (!doc) return;
      setOffen({ id: uebersichtId, doc });
      setAnsicht('aktuell');
      setBand((b) => (b?.uebersichtId === uebersichtId ? b : null));
      if (gespeichert.autovervollstaendigung) {
        const alle = await speicher.alleUebersichten();
        setKatalog(baueKatalog(gespeichert.vorlagen, alle));
      } else setKatalog(null);
    },
    [speicher, gespeichert],
  );

  const kundeOeffnen = (kundeId: string) => {
    const u = bestand.uebersichten.find((x) => x.kundeId === kundeId);
    if (u) void oeffnen(u.id);
  };

  const anlegen = (e: NeuerKundeErgebnis) => {
    const kunde = neuerKunde(e.name);
    const u = neueUebersicht(kunde.id, e.vorlage ? fassungAusVorlage(e.vorlage) : leereFassung());
    u.titel = e.titel;
    speicher.anlegen(kunde, u);
    setDialog(null);
    setNeuId(kunde.id);
    if (e.vorlage) {
      const aus = BEREICH_TYPEN.filter((t) => !e.vorlage!.bereiche[t].aktiv).map((t) => BEREICH_NAME[t]);
      setBand({ uebersichtId: u.id, kunde: kunde.name, vorlage: e.vorlage.name, aus });
    } else setBand(null);
    void oeffnen(u.id);
  };

  const speichern = (g: Gespeichert) => {
    setGespeichert(g);
    void window.api.einstellungenSpeichern(g);
    darstellungAnwenden(g.einstellungen.darstellung);
  };

  // Globale Kürzel: Strg+K Kundensuche, Strg+/ Kürzel-Übersicht, Strg+, Einstellungen
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        suche.current?.focus();
        suche.current?.select();
      } else if (e.key === '/' || (e.key === '7' && e.shiftKey)) {
        e.preventDefault();
        setDialog((d) => (d?.art === 'kuerzel' ? null : { art: 'kuerzel' }));
      } else if (e.key === ',') {
        e.preventDefault();
        setDialog({ art: 'einstellungen', seite: 'Allgemein' });
      }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, []);

  const offeneInfo = offen ? bestand.uebersichten.find((u) => u.id === offen.id) : undefined;
  const kunde = offeneInfo ? bestand.kunden.find((k) => k.id === offeneInfo.kundeId) : undefined;
  const vorname = info.benutzer.split(' ')[0] ?? info.benutzer;

  return (
    <div className={`app ${offen && ansicht === 'neben' && !leisteOffen ? 'mit-leiste' : ''}`}>
      {offen && ansicht === 'neben' && !leisteOffen ? (
        <Leiste
          bestand={bestand}
          auswahl={kunde?.id ?? ''}
          onAusklappen={() => setLeisteOffen(true)}
          onSuche={() => {
            setLeisteOffen(true);
            requestAnimationFrame(() => suche.current?.focus());
          }}
          onStart={() => setOffen(null)}
          onKunde={kundeOeffnen}
          onNeuerKunde={() => setDialog({ art: 'neuerKunde' })}
        />
      ) : (
      <Seitenleiste
        ref={suche}
        bestand={bestand}
        auswahl={kunde?.id ?? 'start'}
        benutzer={info.benutzer}
        neuerKunde={neuId}
        onStart={() => setOffen(null)}
        onKunde={kundeOeffnen}
        onNeuerKunde={() => setDialog({ art: 'neuerKunde' })}
        onEinstellungen={() => setDialog({ art: 'einstellungen', seite: 'Allgemein' })}
      />
      )}
      {offen && kunde ? (
        <EditorSeite
          key={offen.id}
          doc={offen.doc}
          kunde={kunde}
          katalog={katalog}
          ansicht={ansicht}
          setAnsicht={(a) => {
            setAnsicht(a);
            setLeisteOffen(false);
          }}
          benutzer={info.benutzer}
          band={
            band?.uebersichtId === offen.id ? (
              <div className="nk-band">
                <Sym n="tpl" />
                <span>
                  <b>{band.kunde}</b> wurde mit der Vorlage „{band.vorlage}“ angelegt
                  {band.aus.length > 0 && ` · ${band.aus.join(' und ')} ist aus und lässt sich oben jederzeit zuschalten`}.
                </span>
                <span className="spacer" />
                <button type="button" className="nk-x knopf-rein" aria-label="Hinweis schließen" onClick={() => setBand(null)}>
                  <Sym n="x" />
                </button>
              </div>
            ) : null
          }
        />
      ) : (
        <Start bestand={bestand} vorname={vorname} onOeffnen={(id) => void oeffnen(id)} onNeuerKunde={() => setDialog({ art: 'neuerKunde' })} />
      )}
      {dialog?.art === 'neuerKunde' && (
        <NeuerKundeDialog
          kunden={bestand.kunden}
          vorlagen={gespeichert.vorlagen}
          onAnlegen={anlegen}
          onAbbrechen={() => setDialog(null)}
          onOeffnen={(id) => {
            setDialog(null);
            kundeOeffnen(id);
          }}
          onVorlagenVerwalten={() => setDialog({ art: 'einstellungen', seite: 'Vorlagen' })}
        />
      )}
      {dialog?.art === 'einstellungen' && (
        <EinstellungenDialog
          start={dialog.seite}
          gespeichert={gespeichert}
          aktuelleFassung={offen ? leseUebersicht(offen.doc).aktuell : null}
          onSpeichern={speichern}
          onSchliessen={() => setDialog(null)}
        />
      )}
      {dialog?.art === 'kuerzel' && (
        <div className="overlay" onMouseDown={() => setDialog(null)}>
          <div className="sheet kuerzel-sheet" role="dialog" aria-label="Tastenkürzel" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <h2>Tastenkürzel</h2>
              <p>Auch unter Einstellungen → Allgemein.</p>
            </header>
            <div className="body">
              <KuerzelListe />
            </div>
            <footer>
              <span className="spacer" />
              <button type="button" className="btn primary" autoFocus onClick={() => setDialog(null)}>
                Fertig
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

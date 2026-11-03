/** App-Rahmen: Seitenleiste + Start / Kundenakte / Editor, Dialoge, globale Tastenkürzel, Befehle aus Datei-Fenstern. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import {
  BEREICH_NAME,
  BEREICH_TYPEN,
  alteKunden,
  baueKatalog,
  fassungAusVorlage,
  findeDublette,
  heuteDatum,
  jetzt,
  kopiereFassung,
  kundeEintragen,
  kundeUmbenennen,
  leereFassung,
  leseBestand,
  leseUebersicht,
  letzteAenderung,
  neueId,
  neueUebersicht,
  neuerKunde,
  titelVorschlag,
  uebersichtAktualisieren,
  type Aufgabe,
  type Einstellungen,
  type Katalog,
  type SchnellstartLink,
  type UebersichtInfo,
  FERN,
  type FremdMarke,
} from '../../shared';
import type { AppBefehl, AppInfo, VtueMeta } from '../../shared/api';
import { gespeichertLaden, Speicher, type Gespeichert } from './daten/speicher';
import { demoEinstellungen } from './daten/demo';
import { useDocVersion } from './daten/hooks';
import { OfflineHinweis, useAblage, useMitarbeit } from './mitarbeit/mitarbeit';
import { darstellungAnwenden } from './daten/darstellung';
import { Seitenleiste } from './komponenten/Seitenleiste';
import { Sym } from './komponenten/ui';
import { MAX_PINS, Start } from './seiten/Start';
import { Kundenakte, type NeueArt } from './seiten/Kundenakte';
import { EditorSeite, type Ansicht } from './seiten/Editor';
import { Leiste } from './komponenten/Leiste';
import { NeuerKundeDialog, type NeuerKundeErgebnis } from './dialoge/NeuerKunde';
import { EinstellungenDialog, KuerzelListe, type EinstSeite } from './dialoge/Einstellungen';
import { DesktopDialog } from './dialoge/Desktop';
import { Rueckfrage } from './dialoge/Rueckfrage';

type Dialog = null | { art: 'neuerKunde' } | { art: 'einstellungen'; seite: EinstSeite } | { art: 'kuerzel' } | { art: 'desktop' } | { art: 'uebersichtLoeschen'; info: UebersichtInfo };

type Seite = { art: 'start' } | { art: 'aufgaben' } | { art: 'kunde'; id: string };

interface Band {
  uebersichtId: string;
  kunde: string;
  vorlage: string;
  aus: string[];
}

interface Offen {
  id: string;
  doc: Y.Doc;
  /** Seitenfeld „Aufgaben“ gleich öffnen. */
  aufgaben: boolean;
  /** Titel gleich bearbeiten (neue Übersicht aus der Kundenakte). */
  titel: boolean;
  n: number;
}

export function App() {
  const [basis, setBasis] = useState<{ speicher: Speicher; info: AppInfo } | null>(null);
  const [gespeichert, setGespeichert] = useState<Gespeichert | null>(null);

  useEffect(() => {
    void (async () => {
      const info = await window.api.info();
      const [speicher, geladen] = await Promise.all([Speicher.oeffnen(info.demo, info.benutzer), gespeichertLaden()]);
      let g = geladen;
      if (info.demo && g.einstellungen.team.length === 0 && g.einstellungen.schnellstart.length === 0) {
        const b = leseBestand(speicher.bestand);
        const pins = ['Familie Berger', 'Jonas & Mira Albers', 'Elif Yılmaz', 'Thomas Brandt']
          .map((n) => b.kunden.find((k) => k.name === n))
          .map((k) => k && b.uebersichten.filter((u) => u.kundeId === k.id).sort((x, y) => y.erstellt.localeCompare(x.erstellt))[0]?.id)
          .filter((x): x is string => !!x);
        g = { ...g, einstellungen: demoEinstellungen(g.einstellungen, pins) };
        void window.api.einstellungenSpeichern(g);
      }
      darstellungAnwenden(g.einstellungen.darstellung);
      setGespeichert(g);
      setBasis({ speicher, info });
    })();
  }, []);

  if (!basis || !gespeichert) return <div className="laedt" />;
  return <Oberflaeche speicher={basis.speicher} info={basis.info} gespeichert={gespeichert} setGespeichert={setGespeichert} />;
}

function Oberflaeche({ speicher, info, gespeichert, setGespeichert }: { speicher: Speicher; info: AppInfo; gespeichert: Gespeichert; setGespeichert: (g: Gespeichert) => void }) {
  const bestandVersion = useDocVersion(speicher.bestand);
  const bestand = useMemo(() => leseBestand(speicher.bestand), [speicher, bestandVersion]);
  const [seite, setSeite] = useState<Seite>({ art: 'start' });
  const [offen, setOffen] = useState<Offen | null>(null);
  const [ansicht, setAnsicht] = useState<Ansicht>('aktuell');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [katalog, setKatalog] = useState<Katalog | null>(null);
  const [band, setBand] = useState<Band | null>(null);
  const [neuId, setNeuId] = useState<string | null>(null);
  const [leisteOffen, setLeisteOffen] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const suche = useRef<HTMLInputElement>(null);
  const e = gespeichert.einstellungen;
  // Bild 15: gemeinsam bearbeiten
  const ablage = useAblage();
  const [markenStand, setMarkenStand] = useState(0);
  useEffect(() => speicher.aufMarken(() => setMarkenStand((x) => x + 1)), [speicher]);
  const marken = useMemo(() => (offen ? new Map(speicher.markenFuer(offen.id)) : new Map<string, FremdMarke>()), [speicher, offen?.id, markenStand]);
  const mitarbeit = useMitarbeit(offen?.id ?? null, ablage?.gemeinsam ? ablage.ich.id : null, marken);
  const team = e.team.map((t) => t.name);

  const kundeName = useCallback((kundeId: string) => leseBestand(speicher.bestand).kunden.find((k) => k.id === kundeId)?.name, [speicher]);

  /** Protokoll (Bild 16): wer hat wann was getan – nur lokal, 12 Monate. */
  const protokoll = useCallback(
    (was: string, kundeId?: string, titel?: string) => {
      const k = kundeId ? kundeName(kundeId) : undefined;
      void window.api.protokollSchreiben({ zeit: jetzt(), wer: info.benutzer, was, ...(k ? { kunde: k } : {}), ...(titel ? { uebersicht: titel } : {}) });
    },
    [info.benutzer, kundeName],
  );

  const speichern = useCallback(
    (g: Gespeichert) => {
      setGespeichert(g);
      void window.api.einstellungenSpeichern(g);
      darstellungAnwenden(g.einstellungen.darstellung);
    },
    [setGespeichert],
  );
  const einstellungen = (teil: Partial<Einstellungen>) => speichern({ ...gespeichert, einstellungen: { ...gespeichert.einstellungen, ...teil } });

  const oeffnen = useCallback(
    async (uebersichtId: string, opt: { aufgaben?: boolean; titel?: boolean } = {}) => {
      const doc = await speicher.uebersicht(uebersichtId);
      if (!doc) return;
      setOffen((o) => ({ id: uebersichtId, doc, aufgaben: !!opt.aufgaben, titel: !!opt.titel, n: (o?.n ?? 0) + 1 }));
      setAnsicht('aktuell');
      setBand((b) => (b?.uebersichtId === uebersichtId ? b : null));
      if (gespeichert.autovervollstaendigung) {
        const alle = await speicher.alleUebersichten();
        setKatalog(baueKatalog(gespeichert.vorlagen, alle));
      } else setKatalog(null);
    },
    [speicher, gespeichert],
  );

  // Protokoll „bearbeitet“: einmal je geöffneter Übersicht bei der ersten eigenen Änderung
  useEffect(() => {
    if (!offen) return;
    const doc = offen.doc;
    let erst = true;
    const h = (_u: Uint8Array, ursprung: unknown) => {
      if (!erst || ursprung === null || ursprung === FERN) return;
      erst = false;
      const u = leseUebersicht(doc);
      protokoll('Übersicht bearbeitet', u.kundeId, u.titel);
      doc.off('update', h);
    };
    doc.on('update', h);
    return () => doc.off('update', h);
  }, [offen?.doc, protokoll]);

  const kundeOeffnen = (kundeId: string) => {
    setOffen(null);
    setSeite({ art: 'kunde', id: kundeId });
  };

  const anlegen = (r: NeuerKundeErgebnis) => {
    const kunde = neuerKunde(r.name);
    const u = neueUebersicht(kunde.id, r.vorlage ? fassungAusVorlage(r.vorlage) : leereFassung());
    u.titel = r.titel;
    speicher.anlegen(kunde, u);
    protokoll('Kunde angelegt', kunde.id, u.titel);
    setDialog(null);
    setNeuId(kunde.id);
    setSeite({ art: 'kunde', id: kunde.id });
    if (r.vorlage) {
      const aus = BEREICH_TYPEN.filter((t) => !r.vorlage!.bereiche[t].aktiv).map((t) => BEREICH_NAME[t]);
      setBand({ uebersichtId: u.id, kunde: kunde.name, vorlage: r.vorlage.name, aus });
    } else setBand(null);
    void oeffnen(u.id);
  };

  /** Neue Übersicht aus der Kundenakte (Bild 1b „Neue Vertragsübersicht“). */
  const neueUebersichtAnlegen = async (kundeId: string, art: NeueArt) => {
    let aktuell = leereFassung();
    if (art.art === 'vorlage') aktuell = fassungAusVorlage(art.vorlage);
    if (art.art === 'uebernehmen') {
      const doc = await speicher.uebersicht(art.quelle);
      if (doc) aktuell = kopiereFassung(leseUebersicht(doc).neu, false);
    }
    const u = neueUebersicht(kundeId, aktuell);
    u.titel = titelVorschlag(new Date(), 'Jahresgespräch');
    speicher.uebersichtHinzufuegen(kundeId, u);
    protokoll('Übersicht angelegt', kundeId, u.titel);
    void oeffnen(u.id, { titel: true });
  };

  const pin = (id: string, an: boolean) => {
    const liste = e.angepinnt.filter((x) => x !== id && bestand.uebersichten.some((u) => u.id === x));
    if (an) {
      if (liste.length >= MAX_PINS) return setMeldung(`Höchstens ${MAX_PINS} Übersichten angepinnt – erst eine lösen.`);
      liste.push(id);
    }
    einstellungen({ angepinnt: liste });
  };

  const aufgabeErledigt = (uid: string, aid: string, erledigt = true) => void speicher.mitEditor(uid, (ed) => ed.aufgabeAendern(aid, { erledigt }));
  const aufgabeAnlegen = (uid: string, a: Aufgabe) => void speicher.mitEditor(uid, (ed) => ed.aufgabeAnlegen(a));

  const linkOeffnen = async (l: SchnellstartLink) => {
    const ok = await window.api.oeffnenExtern(l.ziel);
    if (!ok) setMeldung(`„${l.name}“ ließ sich nicht öffnen – Ziel unter Schnellstart → Anpassen prüfen.`);
  };

  /** Datei-Fenster (Bild 10) → „In der App öffnen“ / „Als neue Übersicht übernehmen“. */
  const befehl = useRef<(b: AppBefehl) => void>(() => {});
  befehl.current = (b) => {
    if (b.art === 'uebersichtOeffnen') {
      if (bestand.uebersichten.some((u) => u.id === b.uebersichtId)) {
        setSeite({ art: 'kunde', id: b.kundeId });
        void oeffnen(b.uebersichtId);
      } else setMeldung('Die Übersicht gibt es in der App nicht mehr – „Als neue Übersicht übernehmen“ legt sie wieder an.');
    } else void uebernehmen(b.meta, b.daten);
  };
  useEffect(() => window.api.aufBefehl((b) => befehl.current(b)), []);

  const uebernehmen = async (meta: VtueMeta, daten: Uint8Array) => {
    const quelle = new Y.Doc();
    Y.applyUpdate(quelle, daten);
    const alt = leseUebersicht(quelle);
    let kunde = bestand.kunden.find((k) => k.id === meta.kundeId) ?? findeDublette(bestand.kunden, meta.kunde);
    if (!kunde) {
      kunde = neuerKunde(meta.kunde);
      kundeEintragen(speicher.bestand, kunde);
      protokoll('Kunde angelegt (aus Datei)', kunde.id);
    }
    const zeit = jetzt();
    const u = { ...alt, id: neueId(), kundeId: kunde.id, titel: `${alt.titel || 'Vertragsübersicht'} (aus Datei)`, erstellt: zeit, geaendert: zeit };
    speicher.uebersichtHinzufuegen(kunde.id, u);
    protokoll('Übersicht aus Datei übernommen', kunde.id, u.titel);
    setSeite({ art: 'kunde', id: kunde.id });
    await oeffnen(u.id);
  };

  // Globale Kürzel: Strg+K Kundensuche, Strg+/ Kürzel-Übersicht, Strg+, Einstellungen, Strg+O Datei öffnen
  useEffect(() => {
    const taste = (ev: KeyboardEvent) => {
      const mod = ev.ctrlKey || ev.metaKey;
      if (!mod) return;
      if (ev.key === 'k' || ev.key === 'K') {
        ev.preventDefault();
        suche.current?.focus();
        suche.current?.select();
      } else if (ev.key === '/' || (ev.key === '7' && ev.shiftKey)) {
        ev.preventDefault();
        setDialog((d) => (d?.art === 'kuerzel' ? null : { art: 'kuerzel' }));
      } else if (ev.key === ',') {
        ev.preventDefault();
        setDialog({ art: 'einstellungen', seite: 'Allgemein' });
      } else if (ev.key === 'o' || ev.key === 'O') {
        ev.preventDefault();
        void window.api.dateiOeffnenDialog();
      }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, []);

  useEffect(() => {
    if (!meldung) return;
    const t = setTimeout(() => setMeldung(null), 6000);
    return () => clearTimeout(t);
  }, [meldung]);

  const offeneInfo = offen ? bestand.uebersichten.find((u) => u.id === offen.id) : undefined;
  const kunde = offeneInfo ? bestand.kunden.find((k) => k.id === offeneInfo.kundeId) : undefined;
  const akteKunde = !offen && seite.art === 'kunde' ? bestand.kunden.find((k) => k.id === seite.id) : undefined;
  const vorname = info.benutzer.split(' ')[0] ?? info.benutzer;
  const auswahl = kunde?.id ?? (akteKunde ? akteKunde.id : seite.art === 'aufgaben' ? 'aufgaben' : 'start');
  const zurStart = () => {
    setOffen(null);
    setSeite({ art: 'start' });
  };
  const alte = e.alteKundenVorschlagen
    ? alteKunden(
        bestand.kunden.map((k) => ({ ...k, geaendert: letzteAenderung(bestand, k.id) })),
        heuteDatum(),
        e.aufbewahrungJahre,
      ).length
    : 0;

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
          onStart={zurStart}
          onKunde={kundeOeffnen}
          onNeuerKunde={() => setDialog({ art: 'neuerKunde' })}
        />
      ) : (
        <Seitenleiste
          ref={suche}
          bestand={bestand}
          auswahl={auswahl}
          angepinnt={e.angepinnt}
          benutzer={info.benutzer}
          neuerKunde={neuId}
          onStart={zurStart}
          onAufgaben={() => {
            setOffen(null);
            setSeite({ art: 'aufgaben' });
          }}
          onKunde={kundeOeffnen}
          onNeuerKunde={() => setDialog({ art: 'neuerKunde' })}
          onEinstellungen={() => setDialog({ art: 'einstellungen', seite: 'Allgemein' })}
        />
      )}
      {offen && kunde ? (
        <EditorSeite
          key={`${offen.id}-${offen.n}`}
          uebersichtId={offen.id}
          {...(ablage?.gemeinsam ? { mitarbeit } : {})}
          doc={offen.doc}
          kunde={kunde}
          katalog={katalog}
          ansicht={ansicht}
          setAnsicht={(a) => {
            setAnsicht(a);
            setLeisteOffen(false);
          }}
          benutzer={info.benutzer}
          team={team}
          aufgabenStart={offen.aufgaben}
          titelStart={offen.titel}
          onKunde={() => kundeOeffnen(kunde.id)}
          onEreignis={(was) => protokoll(was, kunde.id, offeneInfo?.titel)}
          pdfPasswortStandard={e.pdfPasswortStandard}
          pdfZiel={info.pdfZiel}
          outlook={e.outlook}
          onOutlookEinstellungen={() => setDialog({ art: 'einstellungen', seite: 'Outlook' })}
          kiHinweis={e.kiHinweis}
          onKiEinstellungen={() => setDialog({ art: 'einstellungen', seite: 'KI-Konto' })}
          extra={
            <button
              type="button"
              className="btn"
              title="Speichert diesen Stand als Datei auf dem Desktop. Doppelklick auf die Datei öffnet ihn in der App."
              onClick={() => setDialog({ art: 'desktop' })}
            >
              <Sym n="monitor" /> Auf Desktop speichern
            </button>
          }
          menuExtra={(zu) => {
            const gepinnt = e.angepinnt.includes(offen.id);
            return (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="ub-mi knopf-rein"
                  onClick={() => {
                    zu();
                    pin(offen.id, !gepinnt);
                  }}
                >
                  <Sym n="pin" />
                  <span>{gepinnt ? 'Nicht mehr anpinnen' : 'Anpinnen'}</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="ub-mi knopf-rein"
                  onClick={() => {
                    zu();
                    uebersichtAktualisieren(speicher.bestand, offen.id, { umgesetzt: offeneInfo?.umgesetzt ? null : heuteDatum() });
                  }}
                >
                  <Sym n="check" />
                  <span>{offeneInfo?.umgesetzt ? 'Wieder „In Arbeit“' : 'Als umgesetzt markieren'}</span>
                </button>
              </>
            );
          }}
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
      ) : akteKunde ? (
        <Kundenakte
          key={akteKunde.id}
          kunde={akteKunde}
          bestand={bestand}
          benutzer={info.benutzer}
          team={team}
          angepinnt={e.angepinnt}
          vorlagen={gespeichert.vorlagen}
          ladeUebersicht={async (id) => {
            const d = await speicher.uebersicht(id);
            return d ? leseUebersicht(d) : null;
          }}
          onOeffnen={(id) => void oeffnen(id)}
          onNeu={(art) => void neueUebersichtAnlegen(akteKunde.id, art)}
          onPin={pin}
          onUmgesetzt={(id, an) => uebersichtAktualisieren(speicher.bestand, id, { umgesetzt: an ? heuteDatum() : null })}
          onLoeschen={(i) => setDialog({ art: 'uebersichtLoeschen', info: i })}
          onUmbenennen={(name) => {
            kundeUmbenennen(speicher.bestand, akteKunde.id, name, jetzt());
            protokoll('Kunde umbenannt', akteKunde.id);
          }}
          onErledigt={aufgabeErledigt}
          onAufgabeAnlegen={aufgabeAnlegen}
        />
      ) : (
        <Start
          key={seite.art}
          bestand={bestand}
          vorname={vorname}
          benutzer={info.benutzer}
          team={team}
          schnellstart={e.schnellstart}
          angepinnt={e.angepinnt}
          hinweisAlteKunden={alte}
          nurAufgaben={seite.art === 'aufgaben'}
          onOeffnen={(id, aufgaben) => void oeffnen(id, { aufgaben: !!aufgaben })}
          onNeuerKunde={() => setDialog({ art: 'neuerKunde' })}
          onAnpassen={() => setDialog({ art: 'einstellungen', seite: 'Schnellstart' })}
          onLink={(l) => void linkOeffnen(l)}
          onPin={pin}
          onErledigt={(u, a) => aufgabeErledigt(u, a)}
          onAufgabeAnlegen={aufgabeAnlegen}
          onAlteKunden={() => setDialog({ art: 'einstellungen', seite: 'Datenschutz' })}
          onDateiOeffnen={() => void window.api.dateiOeffnenDialog()}
        />
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
          onVorWechsel={() => speicher.sofortSpeichern()}
          start={dialog.seite}
          gespeichert={gespeichert}
          benutzer={info.benutzer}
          bestand={bestand}
          aktuelleFassung={offen ? leseUebersicht(offen.doc).aktuell : null}
          onSpeichern={speichern}
          onSchliessen={() => setDialog(null)}
          onKundeLoeschen={async (k) => {
            const n = await speicher.kundeLoeschen(k.id);
            void window.api.protokollSchreiben({ zeit: jetzt(), wer: info.benutzer, was: `Kunde endgültig gelöscht (${n} ${n === 1 ? 'Übersicht' : 'Übersichten'})`, kunde: k.name });
            if (kunde?.id === k.id || (seite.art === 'kunde' && seite.id === k.id)) zurStart();
            einstellungen({ angepinnt: e.angepinnt.filter((id) => leseBestand(speicher.bestand).uebersichten.some((u) => u.id === id)) });
          }}
          ladeUebersichten={async (kundeId) => {
            const ids = bestand.uebersichten.filter((u) => u.kundeId === kundeId).map((u) => u.id);
            const docs = await Promise.all(ids.map((id) => speicher.uebersicht(id)));
            return docs.filter((d): d is Y.Doc => !!d).map((d) => ({ u: leseUebersicht(d), daten: Y.encodeStateAsUpdate(d) }));
          }}
          onProtokoll={protokoll}
        />
      )}
      {dialog?.art === 'desktop' && offen && kunde && (
        <DesktopDialog
          doc={offen.doc}
          kunde={kunde}
          benutzer={info.benutzer}
          passwortStandard={e.dateiPasswortStandard}
          onSchliessen={() => setDialog(null)}
          onFertig={(pfad, mitPasswort) => {
            setDialog(null);
            uebersichtAktualisieren(speicher.bestand, offen.id, { eingefroren: jetzt() });
            protokoll(`Stand als Datei gespeichert${mitPasswort ? ' (mit Passwort)' : ''}`, kunde.id, offeneInfo?.titel);
            setMeldung(`Gespeichert: ${pfad.split(/[\\/]/).pop()}`);
          }}
        />
      )}
      {dialog?.art === 'uebersichtLoeschen' && (
        <Rueckfrage
          titel={`„${dialog.info.titel || 'Vertragsübersicht'}“ löschen?`}
          text="Die Übersicht wird mit allen Aufgaben endgültig gelöscht. Das lässt sich nicht rückgängig machen."
          knopf="Endgültig löschen"
          onAbbrechen={() => setDialog(null)}
          onOk={async () => {
            const i = dialog.info;
            setDialog(null);
            await speicher.uebersichtLoeschen(i.id);
            einstellungen({ angepinnt: e.angepinnt.filter((x) => x !== i.id) });
            protokoll('Übersicht gelöscht', i.kundeId, i.titel);
          }}
        />
      )}
      {dialog?.art === 'kuerzel' && (
        <div className="overlay" onMouseDown={() => setDialog(null)}>
          <div className="sheet kuerzel-sheet" role="dialog" aria-label="Tastenkürzel" onMouseDown={(ev) => ev.stopPropagation()}>
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
      <OfflineHinweis s={ablage} />
      {meldung && (
        <div className="ub-toast" role="status">
          <Sym n="info" />
          <span>{meldung}</span>
        </div>
      )}
    </div>
  );
}

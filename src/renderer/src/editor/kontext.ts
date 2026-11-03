import { createContext, useContext } from 'react';
import type { Editor, FassungName, Katalog, Uebersicht } from '../../../shared';

/** Merkt sich Eingabefelder, um nach „+ Vertrag“, Enter usw. gezielt hineinzuspringen. */
export class FokusRegister {
  private felder = new Map<string, HTMLElement>();
  private wartend: string | null = null;

  setze(key: string, el: HTMLElement | null): void {
    if (!el) {
      this.felder.delete(key);
      return;
    }
    this.felder.set(key, el);
    if (this.wartend === key) {
      this.wartend = null;
      requestAnimationFrame(() => el.focus());
    }
  }

  fokus(key: string): void {
    const el = this.felder.get(key);
    if (el && el.isConnected) el.focus();
    else this.wartend = key;
  }
}

export interface EditorKontextWert {
  editor: Editor;
  u: Uebersicht;
  fassung: FassungName;
  fokus: FokusRegister;
  /** Markierte Zeile (Entf löscht sie). */
  markiert: string | null;
  setMarkiert: (id: string | null) => void;
  /** Hinweis unten mit „Rückgängig“ (Bild 12/13). */
  hinweis: (text: string) => void;
  katalog: Katalog | null;
  /** Untergruppe, deren Symbolreihe offen ist (neu angelegt oder Symbol angeklickt). */
  symbolOffen: string | null;
  setSymbolOffen: (id: string | null) => void;
  /** Untergruppe, die gerade neu angelegt wurde (Hinweis „Enter fertig …“). */
  neueUg: string | null;
  setNeueUg: (id: string | null) => void;
  /** Zuletzt per „+ Vertrag“/Enter angelegte Zeile (Tastenhinweis im Fuß). */
  neueZeile: string | null;
  setNeueZeile: (id: string | null) => void;
  /** Nach dem Speichern eines Feldes (z. B. Hinweis „auch in ‚Neu‘“, Bild 14). */
  nachAenderung?: (vertragId: string, feld: import('../../../shared').VertragFeld) => void;
  /** Offene Aufgaben je Vertrag (Marke am Vertrag, Bild 9). */
  aufgabenMarken?: Map<string, { n: number; ueberfaellig: boolean; texte: string[] }>;
  aufgabenZeigen?: () => void;
  /** Nur ansehen (geöffnete Desktop-Datei, Bild 10). */
  nurLesen?: boolean;
  /** Gemeinsam bearbeiten (Bild 15): wer wo steht, was andere geändert haben. */
  mitarbeit?: import('../mitarbeit/mitarbeit').Mitarbeit | undefined;
}

export const EditorKontext = createContext<EditorKontextWert | null>(null);

export function useEditorKontext(): EditorKontextWert {
  const k = useContext(EditorKontext);
  if (!k) throw new Error('EditorKontext fehlt');
  return k;
}

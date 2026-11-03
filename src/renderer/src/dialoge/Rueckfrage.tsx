/** Schlichte Rückfrage vor endgültigen Schritten (Löschen). */
import { useState } from 'react';

export function Rueckfrage({
  titel,
  text,
  knopf,
  bestaetigen,
  onOk,
  onAbbrechen,
}: {
  titel: string;
  text: string;
  knopf: string;
  /** Muss eingetippt werden (z. B. der Kundenname), bevor der Knopf frei wird. */
  bestaetigen?: string;
  onOk: () => void;
  onAbbrechen: () => void;
}) {
  const [eingabe, setEingabe] = useState('');
  const frei = !bestaetigen || eingabe.trim() === bestaetigen;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onAbbrechen()}>
      <div className="sheet rf-sheet" role="alertdialog" aria-label={titel} onKeyDown={(e) => e.key === 'Escape' && onAbbrechen()}>
        <header>
          <h2>{titel}</h2>
          <p>{text}</p>
        </header>
        {bestaetigen && (
          <div className="body">
            <label className="rf-label">
              Zur Bestätigung den Namen eintippen: <b>{bestaetigen}</b>
            </label>
            <input
              className="kk-input rf-feld"
              autoFocus
              value={eingabe}
              aria-label="Bestätigung"
              onChange={(e) => setEingabe(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && frei && onOk()}
            />
          </div>
        )}
        <footer>
          <span className="spacer" />
          <button type="button" className="btn" autoFocus={!bestaetigen} onClick={onAbbrechen}>
            Abbrechen
          </button>
          <button type="button" className="btn primary rot" disabled={!frei} onClick={onOk}>
            {knopf}
          </button>
        </footer>
      </div>
    </div>
  );
}

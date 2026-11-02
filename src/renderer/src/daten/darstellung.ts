/** Hell/Dunkel (Festlegung Sitzung 23): folgt dem System oder fester Wahl; setzt die Klasse „dunkel“ am Dokument. */
import type { Darstellung } from '../../../shared';

let abmelden: (() => void) | null = null;

export function darstellungAnwenden(d: Darstellung): void {
  void window.api.darstellungSetzen(d);
  abmelden?.();
  abmelden = null;
  const setzen = (dunkel: boolean) => document.documentElement.classList.toggle('dunkel', dunkel);
  if (d === 'auto') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setzen(mq.matches);
    const h = (e: MediaQueryListEvent) => setzen(e.matches);
    mq.addEventListener('change', h);
    abmelden = () => mq.removeEventListener('change', h);
  } else setzen(d === 'dunkel');
}

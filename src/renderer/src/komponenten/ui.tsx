/** Kleine, überall genutzte Bausteine im Stil der Mockups. */
import type { ReactNode } from 'react';
import { SYMBOL_PFADE } from '../symbol-pfade';
import { avatarFarbe, initialen } from '../../../shared';

export function Sym({ n, cls = 'i' }: { n: string; cls?: string }) {
  return <svg className={cls} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SYMBOL_PFADE[n] ?? SYMBOL_PFADE['star']! }} />;
}

export function Avatar({ id, name, cls = '', title }: { id: string; name: string; cls?: string; title?: string }) {
  const farbe = avatarFarbe(id);
  return (
    <span className={`avatar ${farbe === 'a0' ? '' : farbe} ${cls}`} title={title}>
      {initialen(name)}
    </span>
  );
}

export function Schalter({
  an,
  onChange,
  children,
  title,
  cls = '',
}: {
  an: boolean;
  onChange: (an: boolean) => void;
  children?: ReactNode;
  title?: string;
  cls?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={an}
      className={`switch knopf-rein ${an ? 'on' : ''} ${cls}`}
      title={title}
      onClick={() => onChange(!an)}
    >
      <i />
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd>{children}</kbd>;
}

/** „Strg“ unter Windows, „⌘“ auf dem Mac (Festlegung 6). */
export const istMac = navigator.userAgent.includes('Mac');
export const STRG = istMac ? '⌘' : 'Strg';

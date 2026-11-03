import { describe, expect, it } from 'vitest';
import { fehlerText, pruefenMoeglich, pruefZeit, statusText, weiter, zeigeHinweis, type UpdateStand } from './update';

const T = '2026-11-03T14:05:00';
const start: UpdateStand = { zustand: { art: 'bereit-zu-pruefen' }, version: '0.1.0' };

describe('Update-Ablauf', () => {
  it('prüfen → laden → bereit', () => {
    let s = weiter(start, { art: 'pruefen' }, T);
    expect(s.zustand.art).toBe('pruefe');
    expect(pruefenMoeglich(s.zustand)).toBe(false);
    s = weiter(s, { art: 'verfuegbar', version: '0.2.0' }, T);
    expect(s.zustand).toEqual({ art: 'laedt', version: '0.2.0', prozent: 0 });
    expect(s.letztePruefung).toBe(T);
    s = weiter(s, { art: 'fortschritt', prozent: 42.6 }, T);
    expect(statusText(s)).toBe('Version 0.2.0 wird geladen … 43 %');
    s = weiter(s, { art: 'fortschritt', prozent: 140 }, T);
    expect(s.zustand).toMatchObject({ prozent: 100 });
    s = weiter(s, { art: 'geladen', version: '0.2.0' }, T);
    expect(s.zustand).toEqual({ art: 'bereit', version: '0.2.0' });
    expect(zeigeHinweis(s.zustand)).toBe(true);
    expect(statusText(s)).toContain('beim nächsten Start installiert');
  });

  it('nichts Neues → aktuell', () => {
    const s = weiter(weiter(start, { art: 'pruefen' }, T), { art: 'nicht-verfuegbar' }, T);
    expect(statusText(s)).toBe('Sie haben die neueste Version.');
    expect(zeigeHinweis(s.zustand)).toBe(false);
    expect(pruefenMoeglich(s.zustand)).toBe(true);
  });

  it('ein bereites Update geht durch spätere Fehler nicht verloren', () => {
    const bereit: UpdateStand = { ...start, zustand: { art: 'bereit', version: '0.2.0' } };
    expect(weiter(bereit, { art: 'pruefen' }, T).zustand.art).toBe('bereit');
    const s = weiter(bereit, { art: 'fehler', meldung: 'x' }, T);
    expect(s.zustand.art).toBe('bereit');
    expect(s.letztePruefung).toBe(T);
    expect(weiter(bereit, { art: 'nicht-verfuegbar' }, T).zustand.art).toBe('bereit');
    // ein noch neueres Update ersetzt es
    expect(weiter(bereit, { art: 'geladen', version: '0.3.0' }, T).zustand).toEqual({ art: 'bereit', version: '0.3.0' });
  });

  it('„aus“ bleibt aus', () => {
    const aus: UpdateStand = { ...start, zustand: { art: 'aus', grund: 'Entwicklungsversion' } };
    expect(weiter(aus, { art: 'pruefen' }, T)).toBe(aus);
    expect(pruefenMoeglich(aus.zustand)).toBe(false);
    expect(statusText(aus)).toBe('Entwicklungsversion');
  });

  it('Fortschritt ohne Laden wird ignoriert', () => {
    const s = weiter(start, { art: 'fortschritt', prozent: 50 }, T);
    expect(s).toBe(start);
  });
});

describe('Texte', () => {
  it('übersetzt Fehler verständlich', () => {
    expect(fehlerText('getaddrinfo ENOTFOUND github.com')).toContain('Keine Verbindung');
    expect(fehlerText('net::ERR_INTERNET_DISCONNECTED')).toContain('Keine Verbindung');
    expect(fehlerText('HttpError: 404 Not Found … latest.yml')).toBe('Noch keine Version veröffentlicht.');
    expect(fehlerText('sha512 checksum mismatch')).toContain('beschädigt');
    expect(fehlerText('irgendwas')).toBe('Prüfung fehlgeschlagen. Neuer Versuch später.');
  });

  it('zeigt die Prüfzeit', () => {
    const jetzt = new Date(2026, 10, 3, 16, 0);
    expect(pruefZeit(new Date(2026, 10, 3, 9, 7).toISOString(), jetzt)).toBe('heute, 09:07');
    expect(pruefZeit(new Date(2026, 10, 2, 18, 30).toISOString(), jetzt)).toBe('gestern, 18:30');
    expect(pruefZeit(new Date(2026, 9, 28, 8, 0).toISOString(), jetzt)).toBe('28.10.2026, 08:00');
    expect(pruefZeit(undefined, jetzt)).toBe('');
    expect(pruefZeit('unsinn', jetzt)).toBe('');
  });
});

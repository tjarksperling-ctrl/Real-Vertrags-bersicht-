import { describe, expect, it } from 'vitest';
import { empfaengerLesen, graphNachricht, mailHtml, STANDARD_OUTLOOK, vorlageFuellen } from './mail';

const werte = { Kunde: 'Familie Berger', Titel: 'Jahresgespräch 2026', Datum: '03.11.2026', 'Mein Name': 'Tjark Sperling' };

describe('E-Mail', () => {
  it('füllt die Vorlage', () => {
    expect(vorlageFuellen(STANDARD_OUTLOOK.betreff, werte)).toBe('Ihre Vertragsübersicht – Jahresgespräch 2026');
    const t = vorlageFuellen(STANDARD_OUTLOOK.text, werte);
    expect(t).toContain('Guten Tag Familie Berger,');
    expect(t).toContain('„Jahresgespräch 2026“ vom 03.11.2026');
    expect(t.endsWith('Tjark Sperling')).toBe(true);
    expect(vorlageFuellen('{Unbekannt} {Kunde}', werte)).toBe('{Unbekannt} Familie Berger');
  });

  it('HTML mit Absätzen, Zeilenumbrüchen, Signatur und ohne Einschleusen', () => {
    const h = mailHtml('Hallo <b>,\n\nZeile 1\nZeile 2', 'Tjark Sperling\nAgentur Muster');
    expect(h).toContain('<p>Hallo &lt;b&gt;,</p><p>Zeile 1<br>Zeile 2</p>');
    expect(h).toContain('Tjark Sperling<br>Agentur Muster');
    expect(mailHtml('x', '  ')).not.toContain('color:#555');
  });

  it('liest Empfänger', () => {
    expect(empfaengerLesen('a@b.de; Max <c@d.com>, kaputt')).toEqual({ gueltig: ['a@b.de', 'c@d.com'], fehler: ['Max', 'kaputt'] });
    expect(empfaengerLesen('')).toEqual({ gueltig: [], fehler: [] });
  });

  it('baut die Graph-Nachricht mit PDF-Anhang', () => {
    const n = graphNachricht({ an: ['a@b.de'], betreff: 'B', html: '<p>x</p>', anhang: { name: 'x.pdf', daten: new Uint8Array([37, 80, 68, 70]) }, entwurf: false });
    expect(n).toMatchObject({ subject: 'B', toRecipients: [{ emailAddress: { address: 'a@b.de' } }] });
    expect((n['attachments'] as { contentBytes: string }[])[0]!.contentBytes).toBe('JVBERg==');
  });
});

"""Erzeugt die statischen Mockups (Phase 3) – kein App-Code. Aufruf aus dem Repo-Stamm: python3 mockups/werkzeug/generieren.py mockups
   Danach PDF: node mockups/werkzeug/pdf-und-screenshots.js <ordner-fuer-screenshots>"""
import copy, sys, os
from fractions import Fraction

OUT = sys.argv[1]

# ---------------- Icons (Lucide, MIT) ----------------
P = {
 'shield': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
 'home': '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
 'car': '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
 'trend': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
 'key': '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
 'bank': '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
 'cart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
 'hourglass': '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
 'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
 'grip': '<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>',
 'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
 'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
 'pdf': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/>',
 'file': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
 'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
 'snow': '<line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>',
 'tasks': '<path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5"/><path d="m9 11 3 3L22 4"/>',
 'sparkles': '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
 'cloud': '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
 'sync': '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
 'sliders': '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
 'calendar': '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
 'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
 'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
 'check': '<path d="M20 6 9 17l-5-5"/>',
 'down': '<path d="m6 9 6 6 6-6"/>',
 'more': '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
 'arrow': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
 'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 'columns': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/>',
 'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
 'globe': '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
 'calc': '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
 'chat': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
 'ext': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
 'flag': '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
 'pin': '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
 'monitor': '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
 'chev': '<path d="m9 18 6-6-6-6"/>',
 'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
}
def ic(n, cls='i'):
    return f'<svg class="{cls}" viewBox="0 0 24 24">{P[n]}</svg>'

# ---------------- Formatierung & Rechnen ----------------
def eur(c, sign=False):
    c = round(c)
    s = f"{abs(c)/100:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    pre = ('−' if c < 0 else ('+' if sign and c > 0 else ''))
    return f"{pre}{s} €"

DIV = {'monatlich': 1, 'vierteljährlich': 3, 'halbjährlich': 6, 'jährlich': 12}
def mtl(betrag, zw):
    if not betrag or zw == 'einmalig':
        return Fraction(0)
    return Fraction(betrag, DIV[zw])

# Hauptbetrag + Einmalbetrag je Typ
def v_monat(typ, v):
    return {'VERS': lambda: mtl(v.get('beitrag', 0), v['zw']),
            'SPAR': lambda: mtl(v.get('sparrate', 0), v['zw']),
            'DARL': lambda: mtl(v.get('rate', 0), v.get('zw', 'monatlich')),
            'AV':   lambda: mtl(v.get('beitrag', 0), v['zw'])}[typ]()
def v_einmal(typ, v):
    if typ == 'VERS': return v.get('beitrag', 0) if v['zw'] == 'einmalig' else 0
    if typ == 'SPAR': return v.get('einmal', 0)
    if typ == 'AV':   return v.get('einmal', 0)
    return 0

def ug_monat(typ, ug): return sum((v_monat(typ, v) for v in ug['v']), Fraction(0))
def b_summen(b):
    t = b['typ']; vs = [v for u in b['ug'] for v in u['v']]
    s = {'monat': round(sum((v_monat(t, v) for v in vs), Fraction(0))),
         'einmal': sum(v_einmal(t, v) for v in vs)}
    if t == 'SPAR': s['vermoegen'] = sum(v.get('guthaben', 0) + v.get('wert', 0) for v in vs)
    if t == 'DARL': s['restschuld'] = sum(v.get('rest', 0) for v in vs)
    return s
def gesamt(f): return sum(b_summen(b)['monat'] for b in f if b.get('aktiv', True))

# ---------------- Beispieldaten ----------------
META = {
 'VERS': ('Versicherungen', ''),  # Sitzung 7: „Versicherungen“ ohne Untertitel, gilt auf allen Seiten inkl. PDF
 'SPAR': ('Sparen & Investieren', ''),
 'DARL': ('Darlehen', ''),
 'AV':   ('Altersvorsorge & Familienabsicherung', ''),
}
AKTUELL = [
 {'typ': 'VERS', 'ug': [
   {'name': 'Haftpflicht & Recht', 'icon': 'shield', 'v': [
     {'n': 'Privathaftpflicht', 'b': 'Familientarif, Deckung 10 Mio. €\nSelbstbeteiligung 150 €', 'beitrag': 8940, 'zw': 'jährlich'},
     {'n': 'Rechtsschutz', 'b': 'Privat, Beruf, Verkehr', 'beitrag': 3250, 'zw': 'monatlich'}]},
   {'name': 'Wohnen', 'icon': 'home', 'v': [
     {'n': 'Hausrat', 'b': '110 m², inkl. Fahrraddiebstahl', 'beitrag': 14520, 'zw': 'jährlich'},
     {'n': 'Wohngebäude', 'b': 'Einfamilienhaus Bj. 1998, inkl. Elementar', 'beitrag': 61200, 'zw': 'jährlich'}]},
   {'name': 'Kfz', 'icon': 'car', 'v': [
     {'n': 'VW Golf', 'b': 'VK 300 € / TK 150 €, SF 12', 'beitrag': 48600, 'zw': 'halbjährlich'}]}]},
 {'typ': 'SPAR', 'ug': [
   {'name': 'Fonds & ETF', 'icon': 'trend', 'v': [
     {'n': 'ETF-Sparplan', 'b': 'MSCI World, thesaurierend', 'sparrate': 15000, 'zw': 'monatlich', 'guthaben': 1248000, 'wert': 231540},
     {'n': 'Mischfonds', 'b': 'Einmalanlage aus Erbschaft', 'sparrate': 0, 'zw': 'einmalig', 'einmal': 500000, 'guthaben': 500000, 'wert': 41280}]},
   {'name': 'Bausparen', 'icon': 'key', 'v': [
     {'n': 'Bausparvertrag', 'b': 'Bausparsumme 50.000 €', 'sparrate': 5000, 'zw': 'monatlich', 'guthaben': 620000, 'wert': 18430}]}]},
 {'typ': 'DARL', 'ug': [
   {'name': 'Immobilie', 'icon': 'bank', 'v': [
     {'n': 'Annuitätendarlehen', 'b': 'Sparkasse, Sollzins 3,1 % fest', 'rate': 115000, 'rest': 21480000, 'zins': '06/2034'}]},
   {'name': 'Konsum', 'icon': 'cart', 'v': [
     {'n': 'Autokredit', 'b': 'Restlaufzeit 28 Monate', 'rate': 28900, 'rest': 793000, 'zins': '03/2029'}]}]},
 {'typ': 'AV', 'ug': [
   {'name': 'Altersvorsorge', 'icon': 'hourglass', 'v': [
     {'n': 'Private Rente', 'b': 'Garantierente, Beitragsdynamik 3 %', 'beitrag': 10000, 'zw': 'monatlich', 'leistung': (41200, 'Rente mtl.'), 'bis': '01.07.2052'},
     {'n': 'Basisrente', 'b': 'Einmalbeitrag 2025, steuerlich gefördert', 'beitrag': 0, 'zw': 'einmalig', 'einmal': 300000, 'leistung': (9850, 'Rente mtl.'), 'bis': '31.12.2051'}]},
   {'name': 'Familienabsicherung', 'icon': 'heart', 'v': [
     {'n': 'Risikolebensversicherung', 'b': 'Verbunden, fallende Summe\n(Absicherung Immobiliendarlehen)', 'beitrag': 2380, 'zw': 'monatlich', 'leistung': (25000000, 'Todesfall'), 'bis': '31.10.2045'},
     {'n': 'Berufsunfähigkeit', 'b': 'Max, BU-Rente bis 67', 'beitrag': 8640, 'zw': 'monatlich', 'leistung': (150000, 'Rente mtl.'), 'bis': '30.06.2051'}]}]},
]
NEU = copy.deepcopy(AKTUELL)
def change(f, bi, ui, vi, **kw):
    v = f[bi]['ug'][ui]['v'][vi]
    v.setdefault('vorher', {})
    for k, val in kw.items():
        if k in ('beitrag', 'sparrate', 'rate'): v['vorher'][k] = v[k]
        v[k] = val
change(NEU, 0, 0, 1, beitrag=2890, b='Privat, Beruf, Verkehr\nohne Selbstbeteiligung')
change(NEU, 0, 1, 1, beitrag=54000, b='Neuer Tarif, gleiche Leistung inkl. Elementar')
change(NEU, 0, 2, 0, beitrag=43200, b='VK 300 € / TK 150 €, SF 12, Werkstattbindung')
change(NEU, 3, 1, 1, beitrag=7960, b='Max, BU-Rente bis 67\nVerzicht auf abstrakte Verweisung')

VORTEILE = [
 'Wohngebäude: gleiche Leistung inkl. Elementarschutz, 72 € günstiger im Jahr',
 'Kfz: Werkstattbindung bei gleicher Deckung, 108 € Ersparnis im Jahr',
 'Rechtsschutz: Selbstbeteiligung entfällt',
 'Berufsunfähigkeit: bessere Bedingungen bei niedrigerem Beitrag',
]

GA, GN = gesamt(AKTUELL), gesamt(NEU)
DIFF = GN - GA

# ---------------- Bausteine ----------------
COLS = {
 'VERS': [('Vertrag', '22%'), ('Bemerkung', ''), ('Beitrag', '13%', 1), ('Zahlweise', '14%')],
 'SPAR': [('Vertrag', '16%'), ('Bemerkung', ''), ('Sparrate', '10%', 1), ('Zahlweise', '11%'), ('Einmalbetrag', '11%', 1), ('Guthaben', '11%', 1), ('Wertentw.', '10%', 1)],
 'DARL': [('Vertrag', '22%'), ('Bemerkung', ''), ('Rate/Tilgung', '14%', 1), ('Restschuld', '14%', 1), ('Zinsbindung', '12%')],
 'AV':   [('Vertrag', '17%'), ('Bemerkung', ''), ('Beitrag', '10%', 1), ('Einmalbeitrag', '11%', 1), ('Zahlweise', '10%'), ('Leistung/Guthaben', '15%', 1), ('Laufzeit bis', '12%', 1)],
}
def opt(c): return eur(c) if c else '<span style="color:var(--faint)">–</span>'
def cells(typ, v, edit, mark):
    def money(key, val):
        s = opt(val)
        if mark and key in v.get('vorher', {}):
            return f'<span class="changed">{s}</span><span class="vorher">{eur(v["vorher"][key])}</span>' if edit else s
        return s
    if typ == 'VERS': return [money('beitrag', v['beitrag']), v['zw']]
    if typ == 'SPAR': return [money('sparrate', v['sparrate']), v['zw'], opt(v.get('einmal', 0)), opt(v['guthaben']), opt(v['wert'])]
    if typ == 'DARL': return [money('rate', v['rate']) + ('' if not edit else ' <small style="color:var(--muted)">mtl.</small>'), eur(v['rest']), v['zins']]
    if typ == 'AV':
        l = v['leistung']
        return [money('beitrag', v['beitrag']), opt(v.get('einmal', 0)), v['zw'], f'{eur(l[0])}<br><small style="color:var(--muted)">{l[1]}</small>', v['bis']]

def table(typ, ug, edit=True, mark=False, focus=None, cls='vt'):
    cols = COLS[typ]
    h = f'<table class="{cls}"><colgroup>' + ('<col style="width:22px">' if edit else '')
    h += ''.join(f'<col style="width:{c[1]}">' if c[1] else '<col>' for c in cols) + '</colgroup><thead><tr>'
    h += '<th class="g"></th>' if edit else ''
    h += ''.join(f'<th class="{"num" if len(c) > 2 else ""}">{c[0]}</th>' for c in cols) + '</tr></thead><tbody>'
    for i, v in enumerate(ug['v']):
        cs = cells(typ, v, edit, mark)
        fr = focus == v['n']
        h += f'<tr class="{"focus" if fr else ""}">'
        h += f'<td class="g grip">{ic("grip")}</td>' if edit else ''
        h += f'<td class="vname"><span class="edit-cell">{v["n"]}</span></td>' if edit else f'<td class="vname">{v["n"]}</td>'
        bem = v['b']
        h += f'<td class="bem"><span class="edit-cell{" active" if fr else ""}">{bem}</span></td>' if edit else f'<td class="bem">{bem}</td>'
        for c, val in zip(cols[2:], cs):
            num = len(c) > 2
            cl = 'num' if num else 'zw'
            h += f'<td class="{cl}">{val}</td>'
        h += '</tr>'
    return h + '</tbody></table>'

def ug_label(typ):
    return {'VERS': 'Beitrag', 'SPAR': 'Sparrate', 'DARL': 'Rate', 'AV': 'Beitrag'}[typ]

def summen_html(b, other=None, pdf=False):
    t = b['typ']; s = b_summen(b); o = b_summen(other) if other else None
    def kv(label, val, key):
        d = ''
        if o is not None and o[key] != val and not pdf:
            diff = val - o[key]
            d = f'<span class="delta {"minus" if diff < 0 else "plus"}">{eur(diff, True)} ggü. Aktuell</span>'
        return f'<div class="kv"><span>{label}</span><b>{eur(val)}</b>{d}</div>'
    out = []
    if t == 'SPAR': out.append(kv('Gesamtvermögen', s['vermoegen'], 'vermoegen'))
    if t == 'DARL': out.append(kv('Gesamtrestschuld', s['restschuld'], 'restschuld'))
    if s['einmal']: out.append(kv('Einmalbeiträge' if t == 'AV' else 'Einmalbeträge', s['einmal'], 'einmal'))
    out.append(kv(f'{ug_label(t)} / Monat', s['monat'], 'monat'))
    return ''.join(out)

def bereich(b, i, edit=True, mark=False, other=None, focus=None, compact=False):
    t = b['typ']; title, sub = META[t]
    h = f'<section class="bereich"><header class="bereich-kopf"><span class="nr">{i+1}</span><h2>{title}</h2>'
    h += f'<span class="sub">{sub}</span><span class="spacer"></span>' if sub else '<span class="spacer"></span>'
    if edit and not compact:
        h += f'<span class="switch on"><i></i></span><button class="btn icon ghost">{ic("more")}</button>'
    h += '</header>'
    for ui, ug in enumerate(b['ug']):
        m = ug_monat(t, ug)
        h += f'<div class="ug{" compact" if compact else ""}"><div class="ug-kopf">'
        h += f'<span class="grip">{ic("grip")}</span>' if edit and not compact else ''
        h += f'<span class="ug-icon">{ic(ug["icon"])}</span><span class="name">{ug["name"]}</span>'
        h += f'<span class="summe">{eur(m)} <small>{ug_label(t)} / Monat</small></span></div>'
        if compact:
            h += compact_table(t, ug, mark)
        else:
            h += table(t, ug, edit, mark, focus)
            if edit: h += f'<span class="add">{ic("plus")} Vertrag hinzufügen</span>'
        h += '</div>'
    if edit and not compact:
        h += f'<div class="add-ug"><span class="add" style="padding:0">{ic("plus")} Untergruppe hinzufügen</span></div>'
    h += f'<footer class="bereich-summe">{summen_html(b, other)}</footer></section>'
    return h

def compact_table(t, ug, mark):
    hd = {'VERS': ('Beitrag', 'Zahlweise'), 'SPAR': ('Sparrate', 'Guthaben'), 'DARL': ('Rate', 'Restschuld'), 'AV': ('Beitrag', 'Leistung')}[t]
    h = '<table class="vt"><colgroup><col><col style="width:26%"><col style="width:26%"></colgroup><thead><tr><th>Vertrag</th>'
    h += f'<th class="num">{hd[0]}</th><th class="num">{hd[1]}</th></tr></thead><tbody>'
    for v in ug['v']:
        key = {'VERS': 'beitrag', 'SPAR': 'sparrate', 'DARL': 'rate', 'AV': 'beitrag'}[t]
        main = v.get(key, 0)
        ch = mark and key in v.get('vorher', {})
        ms = f'<span class="changed" title="vorher {eur(v["vorher"][key])}">{opt(main)}</span>' if ch else opt(main)
        if t == 'VERS': sec = v['zw']
        elif t == 'SPAR': sec = opt(v['guthaben'])
        elif t == 'DARL': sec = eur(v['rest'])
        else: sec = f'{eur(v["leistung"][0])} <small style="color:var(--muted)">{v["leistung"][1]}</small>'
        if t == 'AV' and v['zw'] != 'monatlich' and main:
            ms += f' <small style="color:var(--muted)">{v["zw"][:4]}.</small>'
        if not main and v.get('einmal'):
            ms = f'{eur(v["einmal"])} <small style="color:var(--muted)">einm.</small>'
        h += f'<tr><td class="vname">{v["n"]}</td><td class="num">{ms}</td><td class="num zw">{sec}</td></tr>'
    return h + '</tbody></table>'

def gesamt_html(f, other=None):
    g = gesamt(f)
    neben = ''
    if other is not None:
        d = g - gesamt(other)
        neben = f'<div class="neben">Aktuell {eur(gesamt(other))}<br><b style="color:#7ee2a0">{eur(d, True)} pro Monat</b></div>'
    else:
        e = sum(b_summen(b)['einmal'] for b in f)
        neben = f'<div class="neben">Beiträge + Sparraten + Kreditraten<br>Einmalbeträge separat: {eur(e)}</div>'
    return f'<div class="gesamt"><div><div class="label">Gesamtbetrag pro Monat</div><div class="wert">{eur(g)}</div></div><span class="spacer"></span>{neben}</div>'

def vorteile_html(ersparnis=True):
    li = ''.join(f'<li>{ic("check")}<span>{t}</span></li>' for t in VORTEILE)
    return (f'<div class="vorteile"><h3>Vorteile der Änderungen<span class="spacer"></span><span class="switch on"><small>im PDF</small><i></i></span></h3>'
            f'<ul>{li}</ul><span class="add">{ic("plus")} Stichpunkt hinzufügen</span>' +
            (f'<div class="ersparnis"><div><span>Ersparnis pro Monat (automatisch)</span><b>{eur(-DIFF)}</b></div>'
            f'<div><span>Ersparnis pro Jahr (automatisch)</span><b>{eur(-DIFF*12)}</b></div></div>' if ersparnis else '') + '</div>')

# ---------------- Rahmen ----------------
KUNDEN = [('Familie Berger', 'FB', 'a1', '1'), ('Andreas Köhler', 'AK', 'a2', ''), ('Lea Nowak', 'LN', 'a3', ''),
          ('Jonas & Mira Albers', 'JA', 'a4', ''), ('Elif Yılmaz', 'EY', 'a5', ''), ('Thomas Brandt', 'TB', '', '1'),
          ('Katharina Vogt', 'KV', 'a3', ''), ('Familie Schreiber', 'FS', 'a1', '')]
def sidebar(sel='Familie Berger', v2=False):
    li = ''
    for n, k, a, badge in KUNDEN:
        b = f'<span class="badge orange">{badge}</span>' if badge and not v2 else ''
        li += f'<li class="{"sel" if n == sel else ""}"><span class="avatar {a}">{k}</span>{n}{b}</li>'
    kunden_titel = 'Kunden'
    if v2:  # angepinnte Übersichten oben, Rest darunter
        mk = lambda n, k, a: f'<li class="{"sel" if n == sel else ""}"><span class="avatar {a}">{k}</span>{n}</li>'
        pin_li = ''.join(mk(n, k, a) for n, k, a, _ in KUNDEN if n in PINNED)
        li = ''.join(mk(n, k, a) for n, k, a, _ in KUNDEN if n not in PINNED)
        kunden_titel = 'Angepinnt</div><ul class="nav" style="flex:none">' + pin_li + '</ul><div class="nav-title">Alle Kunden'
    return f'''<aside class="sidebar">
  <div class="top">
    <div class="search">{ic("search")} Kunde suchen <kbd>Strg K</kbd></div>
    <button class="btn primary" style="justify-content:center">{ic("plus")} Neuer Kunde</button>
  </div>
  <div class="nav-title" style="display:flex">Start</div>
  <ul class="nav" style="flex:none"><li class="{"sel" if sel == "start" else ""}">{ic("home")} Übersicht</li><li>{ic("tasks")} Aufgaben <span class="badge orange">{"3" if v2 else "2"}</span></li></ul>
  <div class="nav-title">{kunden_titel}</div>
  <ul class="nav">{li}</ul>
  <div class="bottom">
    <div class="row">{ic("cloud")} OneDrive · synchronisiert <span class="dot" style="margin-left:auto"></span></div>
    <div class="row"><span class="avatar a4" style="width:22px;height:22px;font-size:9px">TS</span> Tjark S. <span style="margin-left:auto">{ic("sliders")}</span></div>
  </div>
</aside>'''

def page(title, body, overlay=''):
    return f'''<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} – Mockup</title><link rel="stylesheet" href="style.css"></head>
<body><div class="window">
<div class="titlebar"><span>Vertragsübersicht</span><div class="winctl"><span>&#8212;</span><span>&#9633;</span><span>&#10005;</span></div></div>
<div class="app">{body}</div>{overlay}
</div></body></html>'''

def toolbar(mode):
    seg = ''.join(f'<span class="{"on" if m == mode else ""}">{m}</span>' for m in ('Aktuell', 'Neu', 'Nebeneinander'))
    return f'''<div class="toolbar">
  <span class="avatar a1">FB</span><h1>Familie Berger</h1>
  <div class="seg" style="margin-left:12px">{seg}</div>
  <span class="switch on" style="margin-left:8px" title="Änderungen in Aktuell werden live nach Neu übernommen"><i></i>Aktuell → Neu </span>
  <span class="spacer"></span>
  <div class="presence" title="Sabine K. arbeitet gerade ebenfalls in dieser Übersicht"><span class="avatar a2">SK</span></div>
  <button class="btn icon" title="Aufgaben">{ic("tasks")}<span class="badge">1</span></button>
  <button class="btn">{ic("sparkles")} KI-Import</button>
  <button class="btn">{ic("snow")} Einfrieren</button>
  <button class="btn primary">{ic("pdf")} PDF / E-Mail</button>
</div>'''

def editor_body(mode):
    if mode == 'Aktuell':
        inner = ''.join(bereich(b, i, focus='Hausrat') for i, b in enumerate(AKTUELL)) + gesamt_html(AKTUELL)
        hint = ''
    else:
        inner = ''.join(bereich(b, i, mark=True, other=AKTUELL[i]) for i, b in enumerate(NEU)) + gesamt_html(NEU, AKTUELL) + vorteile_html()
        hint = f'<div class="hint">{ic("info")} Geänderte Werte sind mit einem blauen Punkt markiert, der vorherige Wert steht klein darunter (nur in der App, nicht im PDF).</div>'
    return sidebar() + f'<main class="main">{toolbar(mode)}<div class="content narrow">{hint}{inner}</div></main>'

def side_body():
    h = '<div class="side-head"><div><span class="badge">Aktuell</span> Bestand</div><div><span class="badge blue">Neu</span> Vorschlag</div></div>'
    for i in range(4):
        h += f'<div class="side-row">{bereich(AKTUELL[i], i, edit=True, compact=True)}{bereich(NEU[i], i, mark=True, other=AKTUELL[i], compact=True)}</div>'
    h += f'<div class="side-row">{gesamt_html(AKTUELL)}{gesamt_html(NEU, AKTUELL)}</div>'
    hint = f'<div class="hint">{ic("columns")} Kompaktansicht: Bereiche stehen auf gleicher Höhe. Klick auf einen Vertrag öffnet alle Spalten zum Bearbeiten.</div>'
    return sidebar() + f'<main class="main">{toolbar("Nebeneinander")}<div class="content">{hint}{h}</div></main>'

# ---------------- Editor v1 (Bild 2, Sitzung 7) ----------------
# Wünsche des Nutzers: Bereiche farbig getrennt, Bereichsleiste oben (an-/abwählen + Navigation Gesamt/einzelner Bereich),
# „Auf Desktop speichern“ statt „Einfrieren“, Untergruppen als getönte Karten, UG-Summe unten rechts, schlichter Gesamtbalken,
# Bereich 1 heißt „Versicherung“. Eigene: Brotkrumen mit Übersichtstitel, Seitenleiste v2, Gesamtbetrag dauerhaft sichtbar,
# Spaltenköpfe nur einmal je Bereich, „+ Vertrag“ dezent, Toolbar entschlackt, Sync verständlich, Zahlweise als Auswahlfeld.
FARBE = {'VERS': 'vers', 'SPAR': 'spar', 'DARL': 'darl', 'AV': 'av'}
ZW_OPT = ['monatlich', 'vierteljährlich', 'halbjährlich', 'jährlich', 'einmalig']

def colgroup_v1(typ):
    return '<colgroup><col style="width:22px">' + ''.join(f'<col style="width:{c[1]}">' if c[1] else '<col>' for c in COLS[typ]) + '</colgroup>'

def spaltenkopf_v1(typ):
    th = ''.join(f'<th class="{"num" if len(c) > 2 else ""}">{c[0]}</th>' for c in COLS[typ])
    return f'<div class="spaltenkopf"><table class="vt">{colgroup_v1(typ)}<thead><tr><th class="g"></th>{th}</tr></thead></table></div>'

def table_v1(typ, ug, focus=None, mark=False):
    cols = COLS[typ]
    h = f'<table class="vt">{colgroup_v1(typ)}<tbody>'
    for v in ug['v']:
        fr = focus == v['n']
        h += f'<tr class="{"focus" if fr else ""}"><td class="g grip">{ic("grip")}</td>'
        h += f'<td class="vname"><span class="edit-cell">{v["n"]}</span></td><td class="bem"><span class="edit-cell">{v["b"]}</span></td>'
        for c, val in zip(cols[2:], cells(typ, v, True, mark)):
            if c[0] == 'Zahlweise':
                menu = ''
                if fr:
                    opts = ''.join(f'<span class="{"on" if o == v["zw"] else ""}"><i class="ck">{ic("check") if o == v["zw"] else ""}</i>{o}'
                                   f'{"<small>nicht in Monatssumme</small>" if o == "einmalig" else ""}</span>' for o in ZW_OPT)
                    menu = f'<div class="zw-menu">{opts}</div>'
                h += f'<td class="zw"><span class="zw-sel{" open" if fr else ""}">{val}{ic("down")}</span>{menu}</td>'
            else:
                h += f'<td class="{"num" if len(c) > 2 else "zw"}">{val}</td>'
        h += '</tr>'
    return h + '</tbody></table>'

def bereich_v1(b, i, focus=None, other=None, mark=False):
    t = b['typ']; title = META[t][0]
    h = (f'<section class="bereich v1 {FARBE[t]}"><header class="bereich-kopf"><span class="nr">{i+1}</span><h2>{title}</h2>'
         f'<span class="spacer"></span><button class="btn icon ghost" title="Bereich umbenennen, ausblenden …">{ic("more")}</button></header>')
    h += spaltenkopf_v1(t) + '<div class="ugs">'
    for ug in b['ug']:
        h += (f'<div class="ug v1"><div class="ug-kopf"><span class="grip">{ic("grip")}</span><span class="ug-icon">{ic(ug["icon"])}</span>'
              f'<span class="name">{ug["name"]}</span><span class="ug-more">{ic("more")}</span></div>')
        h += table_v1(t, ug, focus, mark=mark or other is not None)
        h += (f'<div class="ug-fuss"><span class="add-v">{ic("plus")} Vertrag</span>'
              f'<span class="summe"><small>{ug_label(t)} / Monat</small> {eur(ug_monat(t, ug))}</span></div></div>')
    h += f'<div class="add-ug v1">{ic("plus")} Untergruppe hinzufügen</div></div>'
    h += f'<footer class="bereich-summe v1"><span class="bs-label">Summe {title}</span><span class="spacer"></span>{summen_html(b, other)}</footer></section>'
    return h

def toolbar_v1(mode='Aktuell'):
    seg = ''.join(f'<span class="{"on" if m == mode else ""}">{m}</span>' for m in ('Aktuell', 'Neu', 'Nebeneinander'))
    return f'''<div class="toolbar v1">
  <span class="avatar a1">FB</span>
  <div class="crumb"><span class="kunde">Familie Berger {ic("chev")}</span><h1 title="Doppelklick zum Umbenennen">Jahresgespräch 2026 <span class="avatar a2 live" title="Sabine K. arbeitet gerade ebenfalls in dieser Übersicht">SK</span></h1></div>
  <div class="seg" style="margin-left:6px">{seg}</div>
  <span class="switch on sync" title="An: Was Sie in „Aktuell“ ändern, wird sofort auch in „Neu“ geändert. Aus: „Neu“ bleibt unverändert, nichts wird rückwirkend übernommen."><i></i>In „Neu“ übernehmen</span>
  <span class="spacer"></span>
  <button class="btn">{ic("tasks")} Aufgaben <span class="badge orange">1</span></button>
  <button class="btn" title="Speichert diesen Stand als Datei auf dem Desktop. Doppelklick auf die Datei öffnet ihn in der App.">{ic("monitor")} Auf Desktop speichern</button>
  <button class="btn primary">{ic("pdf")} PDF / E-Mail</button>
  <button class="btn icon" title="Weitere: KI-Import, Umbenennen, Duplizieren">{ic("more")}</button>
</div>'''

def bereichsleiste_v1(nur=None, g=None):
    h = f'<span class="bl-item bl-gesamt{" on" if not nur else ""}">{ic("columns")}Gesamt</span><span class="bl-sep"></span>'
    for b in AKTUELL:
        t = b['typ']
        h += (f'<span class="bl-item {FARBE[t]}{" on" if nur == t else ""}"><span class="chk" title="Bereich an-/abwählen">{ic("check")}</span>'
              f'{META[t][0]}</span>')
    return f'<div class="bleiste">{h}<span class="spacer"></span><div class="bl-total"><small>Gesamtbetrag monatlich</small><b>{eur(GA if g is None else g)}</b></div></div>'

def editor_v1(nur=None, mode='Aktuell', ersparnis=True):
    if mode == 'Neu':  # Bild 3 v2 (Sitzung 8): Ersparnis optional (Schalter, gilt für App + PDF), ruhigere Markierungen, Änderungsleiste
        bs = ''.join(bereich_v1(b, i, other=AKTUELL[i] if ersparnis else None, mark=True) for i, b in enumerate(NEU) if not nur or b['typ'] == nur)
        n = sum(1 for b in NEU for ug in b['ug'] for v in ug['v'] if 'vorher' in v)
        sw = lambda on, txt, tip: f'<span class="switch{" on" if on else ""}" title="{tip}"><i></i>{txt}</span>'
        leiste = (f'<div class="aenderungen"><span class="ae-mark">28,90 €</span><span><b>{n} Änderungen</b> gegenüber „Aktuell“ · vorheriger Wert steht darunter (nur in der App)</span>'
                  f'<span class="spacer"></span>{sw(False, "Nur Änderungen zeigen", "Blendet unveränderte Verträge aus")}'
                  f'{sw(ersparnis, "Ersparnis anzeigen", "An: Ersparnis bzw. Mehrbeitrag ggü. Aktuell wird in der App und im PDF gezeigt. Aus: nirgends.")}</div>')
        neben = f'<span class="spacer"></span><div class="neben">Aktuell {eur(GA)}<br><b style="color:#7ee2a0">{eur(DIFF, True)} pro Monat</b></div>' if ersparnis else '<span class="spacer"></span>'
        gz = '' if nur else (f'<div class="gesamt v1"><span>Gesamtbetrag monatlich</span>{neben}<b>{eur(GN)}</b></div>' + vorteile_html(ersparnis))
        return (sidebar('Familie Berger', v2=True) +
                f'<main class="main">{toolbar_v1("Neu")}{bereichsleiste_v1(nur, GN)}<div class="content narrow neu2">{leiste}{bs}{gz}</div></main>')
    bs = ''.join(bereich_v1(b, i, focus='Hausrat') for i, b in enumerate(AKTUELL) if not nur or b['typ'] == nur)
    gz = '' if nur else f'<div class="gesamt v1"><span>Gesamtbetrag monatlich</span><b>{eur(GA)}</b></div>'
    return (sidebar('Familie Berger', v2=True) +
            f'<main class="main">{toolbar_v1()}{bereichsleiste_v1(nur)}<div class="content narrow">{bs}{gz}</div></main>')

# ---------------- Bild 4 v1 (Sitzung 9): Nebeneinander im freigegebenen Design aus Bild 2/3 ----------------
# Inhalt wie bisher (Kompaktansicht, Bereiche paarweise auf gleicher Höhe), aber mit Kopfzeile v1, Bereichsleiste,
# Bereichsfarben, UG-Karten, Markierung „blau hinterlegt + vorher …“ und Schalter „Ersparnis anzeigen“.
KOMPAKT = {'VERS': ('Beitrag', 'Zahlweise'), 'SPAR': ('Sparrate', 'Guthaben'), 'DARL': ('Rate', 'Restschuld'), 'AV': ('Beitrag', 'Leistung')}
HAUPT = {'VERS': 'beitrag', 'SPAR': 'sparrate', 'DARL': 'rate', 'AV': 'beitrag'}
CG_K = '<colgroup><col><col style="width:30%"><col style="width:30%"></colgroup>'

def kompakt_table_v1(t, ug, mark, gegen=None):
    h = f'<table class="vt">{CG_K}<tbody>'
    for vi, v in enumerate(ug['v']):
        key = HAUPT[t]; main = v.get(key, 0)
        ms = opt(main)
        if t == 'AV' and v['zw'] != 'monatlich' and main: ms += f' <small class="zwk">{v["zw"][:4]}.</small>'
        if not main and v.get('einmal'): ms = f'{eur(v["einmal"])} <small class="zwk">einm.</small>'
        if mark and key in v.get('vorher', {}):
            ms = f'<span class="changed">{opt(main)}</span><span class="vorher">{eur(v["vorher"][key])}</span>'
        elif gegen and key in gegen['v'][vi].get('vorher', {}):  # Platzhalter, damit die Zeile so hoch ist wie in „Neu“
            ms += '<span class="vorher platz">–</span>'
        if t == 'VERS': sec = v['zw']
        elif t == 'SPAR': sec = opt(v['guthaben'])
        elif t == 'DARL': sec = eur(v['rest'])
        else: sec = f'{eur(v["leistung"][0])}<br><small class="zwk">{v["leistung"][1]}</small>'
        h += f'<tr><td class="vname">{v["n"]}</td><td class="num">{ms}</td><td class="num zw">{sec}</td></tr>'
    return h + '</tbody></table>'

def bereich_kompakt_v1(b, i, fassung, other=None, mark=False, gegen=None):
    t = b['typ']; title = META[t][0]; hd = KOMPAKT[t]
    tag = f'<span class="fass {"neu" if fassung == "Neu" else ""}">{fassung}</span>'
    h = (f'<section class="bereich v1 kompakt {FARBE[t]}"><header class="bereich-kopf"><span class="nr">{i+1}</span><h2>{title}</h2>'
         f'<span class="spacer"></span>{tag}</header>')
    h += (f'<div class="spaltenkopf"><table class="vt">{CG_K}<thead><tr><th>Vertrag</th><th class="num">{hd[0]}</th>'
          f'<th class="num">{hd[1]}</th></tr></thead></table></div><div class="ugs">')
    for ui, ug in enumerate(b['ug']):
        h += (f'<div class="ug v1"><div class="ug-kopf"><span class="ug-icon">{ic(ug["icon"])}</span>'
              f'<span class="name">{ug["name"]}</span></div>{kompakt_table_v1(t, ug, mark, gegen['ug'][ui] if gegen else None)}'
              f'<div class="ug-fuss"><span></span><span class="summe"><small>{ug_label(t)} / Monat</small> {eur(ug_monat(t, ug))}</span></div></div>')
    h += f'</div><footer class="bereich-summe v1"><span class="bs-label">Summe</span><span class="spacer"></span>{summen_html(b, other)}</footer></section>'
    return h

def side_v1(ersparnis=True):
    n = sum(1 for b in NEU for ug in b['ug'] for v in ug['v'] if 'vorher' in v)
    sw = lambda on, txt, tip: f'<span class="switch{" on" if on else ""}" title="{tip}"><i></i>{txt}</span>'
    leiste = (f'<div class="aenderungen"><span class="ae-mark">28,90 €</span><span><b>{n} Änderungen</b> in „Neu“ · Kompaktansicht, Klick auf einen Vertrag öffnet alle Spalten zum Bearbeiten</span>'
              f'<span class="spacer"></span>{sw(ersparnis, "Ersparnis anzeigen", "An: Ersparnis bzw. Mehrbeitrag ggü. Aktuell wird in der App und im PDF gezeigt. Aus: nirgends.")}</div>')
    kopf = (f'<div class="side-head v1"><div><span class="fass">Aktuell</span> Bestand</div>'
            f'<div><span class="fass neu">Neu</span> Vorschlag</div></div>')
    h = ''
    for i in range(4):
        h += (f'<div class="side-row">{bereich_kompakt_v1(AKTUELL[i], i, "Aktuell", gegen=NEU[i])}'
              f'{bereich_kompakt_v1(NEU[i], i, "Neu", other=AKTUELL[i] if ersparnis else None, mark=True)}</div>')
    neben = f'<div class="neben"><b style="color:#7ee2a0">{eur(DIFF, True)} pro Monat</b><br>{eur(DIFF*12, True)} pro Jahr</div>' if ersparnis else ''
    h += (f'<div class="side-row"><div class="gesamt v1"><span>Gesamtbetrag monatlich</span><b>{eur(GA)}</b></div>'
          f'<div class="gesamt v1"><span>Gesamtbetrag monatlich</span><span class="spacer"></span>{neben}<b>{eur(GN)}</b></div></div>')
    total = (f'<div class="bl-total"><small>Aktuell</small><b>{eur(GA)}</b><small style="margin-left:6px">Neu</small><b>{eur(GN)}</b></div>')
    bl = bereichsleiste_v1().rsplit('<div class="bl-total">', 1)[0] + total + '</div>'
    return (sidebar('Familie Berger', v2=True) +
            f'<main class="main">{toolbar_v1("Nebeneinander")}{bl}<div class="content neu2 side2">{leiste}{kopf}{h}</div></main>')

# ---------------- Bild 4 v2 (Sitzung 9): Nebeneinander mit allen Spalten ----------------
# Wunsch des Nutzers: „Alle Spalten anzeigen“ (wie in Bild 2/3). Damit es passt: Seitenleiste in dieser Ansicht schmal (Leiste mit Kundenkürzeln),
# Spalten wie COLS, Zeilen von Aktuell und Neu per data-k paarweise gleich hoch (in der App: gemeinsames Raster).
COLS_SEITE = {
 'VERS': [('Vertrag', '25%'), ('Bemerkung', ''), ('Beitrag', '19%', 1), ('Zahlweise', '20%')],
 'SPAR': [('Vertrag', '15%'), ('Bemerkung', ''), ('Sparrate', '12%', 1), ('Zahlweise', '13%'), ('Einmal-<br>betrag', '13%', 1), ('Guthaben', '14%', 1), ('Wertentw.', '12%', 1)],
 'DARL': [('Vertrag', '21%'), ('Bemerkung', ''), ('Rate/Tilgung', '17%', 1), ('Restschuld', '18%', 1), ('Zinsbindung', '15%')],
 'AV':   [('Vertrag', '16%'), ('Bemerkung', ''), ('Beitrag', '14%', 1), ('Einmal-<br>beitrag', '13%', 1), ('Zahlweise', '13%'), ('Leistung/<br>Guthaben', '15%', 1), ('Laufzeit<br>bis', '14%', 1)],
}
def cg_seite(t): return '<colgroup>' + ''.join(f'<col style="width:{c[1]}">' if c[1] else '<col>' for c in COLS_SEITE[t]) + '</colgroup>'

def voll_table_v2(t, ug, key, mark, gegen=None):
    h = f'<table class="vt">{cg_seite(t)}<tbody>'
    for vi, v in enumerate(ug['v']):
        cs = cells(t, v, True, mark)
        if gegen and gegen['v'][vi].get('vorher') and not mark:
            cs[0] += '<span class="vorher platz">–</span>'
        h += f'<tr data-k="{key}-{vi}"><td class="vname">{v["n"]}</td><td class="bem{" bem-neu" if mark and gegen is None and v.get("vorher") else ""}">{v["b"]}</td>'
        for c, val in zip(COLS_SEITE[t][2:], cs):
            h += f'<td class="{"num" if len(c) > 2 else "zw"}">{val}</td>'
        h += '</tr>'
    return h + '</tbody></table>'

def bereich_seite_v2(b, i, fassung, other=None, mark=False, gegen=None):
    t = b['typ']; title = META[t][0]
    h = (f'<section class="bereich v1 kompakt voll {FARBE[t]}"><header class="bereich-kopf"><span class="nr">{i+1}</span><h2>{title}</h2>'
         f'<span class="spacer"></span><span class="fass {"neu" if fassung == "Neu" else ""}">{fassung}</span></header>')
    th = ''.join(f'<th class="{"num" if len(c) > 2 else ""}">{c[0]}</th>' for c in COLS_SEITE[t])
    h += f'<div class="spaltenkopf"><table class="vt">{cg_seite(t)}<thead><tr>{th}</tr></thead></table></div><div class="ugs">'
    for ui, ug in enumerate(b['ug']):
        h += (f'<div class="ug v1"><div class="ug-kopf"><span class="ug-icon">{ic(ug["icon"])}</span><span class="name">{ug["name"]}</span></div>'
              f'{voll_table_v2(t, ug, f"{i}-{ui}", mark, gegen["ug"][ui] if gegen else None)}'
              f'<div class="ug-fuss"><span class="add-v" style="padding-left:0">{ic("plus")} Vertrag</span><span class="summe"><small>{ug_label(t)} / Monat</small> {eur(ug_monat(t, ug))}</span></div></div>')
    h += f'</div><footer class="bereich-summe v1"><span class="bs-label">Summe</span><span class="spacer"></span>{summen_html(b, other)}</footer></section>'
    return h

def rail(sel='Familie Berger'):
    av = lambda n, k, a: f'<span class="avatar {a}{" sel" if n == sel else ""}" title="{n}">{k}</span>'
    pins = ''.join(av(n, k, a) for n, k, a, _ in KUNDEN if n in PINNED)
    rest = ''.join(av(n, k, a) for n, k, a, _ in KUNDEN if n not in PINNED)
    return (f'<aside class="rail" title="Seitenleiste ist in „Nebeneinander“ eingeklappt, Klick auf ☰ klappt sie aus">'
            f'<span class="r-btn">{ic("columns")}</span><span class="r-btn">{ic("search")}</span><span class="r-btn prim">{ic("plus")}</span>'
            f'<span class="r-sep"></span><span class="r-btn">{ic("home")}</span><span class="r-btn">{ic("tasks")}</span><span class="r-sep"></span>'
            f'{pins}<span class="r-sep"></span>{rest}</aside>')

GLEICHE_HOEHE = """<script>/* Mockup: Zeilen von Aktuell und Neu gleich hoch (App: gemeinsames Raster) */
const m={};document.querySelectorAll('tr[data-k]').forEach(r=>{(m[r.dataset.k]=m[r.dataset.k]||[]).push(r)});
Object.values(m).forEach(rs=>{const h=Math.max(...rs.map(r=>r.getBoundingClientRect().height));rs.forEach(r=>r.style.height=h+'px')});</script>"""

def side_v2(ersparnis=True):
    n = sum(1 for b in NEU for ug in b['ug'] for v in ug['v'] if 'vorher' in v)
    sw = lambda on, txt, tip: f'<span class="switch{" on" if on else ""}" title="{tip}"><i></i>{txt}</span>'
    leiste = (f'<div class="aenderungen"><span class="ae-mark">28,90 €</span><span><b>{n} Änderungen</b> in „Neu“ · alle Spalten, direkt bearbeitbar</span>'
              f'<span class="spacer"></span>{sw(ersparnis, "Ersparnis anzeigen", "An: Ersparnis bzw. Mehrbeitrag ggü. Aktuell wird in der App und im PDF gezeigt. Aus: nirgends.")}</div>')
    kopf = '<div class="side-head v1"><div><span class="fass">Aktuell</span> Bestand</div><div><span class="fass neu">Neu</span> Vorschlag</div></div>'
    h = ''
    for i in range(4):
        h += (f'<div class="side-row">{bereich_seite_v2(AKTUELL[i], i, "Aktuell", gegen=NEU[i])}'
              f'{bereich_seite_v2(NEU[i], i, "Neu", other=AKTUELL[i] if ersparnis else None, mark=True)}</div>')
    neben = f'<div class="neben"><b style="color:#7ee2a0">{eur(DIFF, True)} pro Monat</b><br>{eur(DIFF*12, True)} pro Jahr</div>' if ersparnis else ''
    h += (f'<div class="side-row"><div class="gesamt v1"><span>Gesamtbetrag monatlich</span><b>{eur(GA)}</b></div>'
          f'<div class="gesamt v1"><span>Gesamtbetrag monatlich</span><span class="spacer"></span>{neben}<b>{eur(GN)}</b></div></div>')
    total = f'<div class="bl-total"><small>Aktuell</small><b>{eur(GA)}</b><small style="margin-left:6px">Neu</small><b>{eur(GN)}</b></div>'
    bl = bereichsleiste_v1().rsplit('<div class="bl-total">', 1)[0] + total + '</div>'
    return (rail() + f'<main class="main">{toolbar_v1("Nebeneinander")}{bl}<div class="content neu2 side2">{leiste}{kopf}{h}</div></main>' + GLEICHE_HOEHE)

# ---------------- Start ----------------
# Überarbeitung Bild 1: Links = eckige Symbol-Kacheln mit Pfeil (keine Initialen-Kreise wie bei Kunden),
# nur ein „Neuer Kunde“, kein KI-Import auf der Startseite, Aufgaben nach Dringlichkeit gruppiert,
# v3: angepinnte Übersichten (max. 4, Wunsch Sitzung 4), Aufgaben mit direktem Sprung in die Übersicht.
PINNED = ['Familie Berger', 'Thomas Brandt', 'Jonas & Mira Albers', 'Elif Yılmaz']

def start_body():
    links = [('Outlook', 'mail', 'App', '#0a64d0'), ('Teams', 'chat', 'App', '#4b53bc'), ('Kalender', 'calendar', 'App', '#d63a5a'),
             ('Maklerportal', 'globe', 'maklerportal.de', '#5e5ce6'), ('Vergleichsrechner', 'calc', 'vergleich.de', '#c77800'),
             ('Tarifrechner Kfz', 'car', 'kfz-tarif.de', '#1f8a4c'), ('Bank-Portal', 'bank', 'bank-partner.de', '#1f7f95')]
    lh = ''.join(f'<div class="lnk"><span class="sym" style="color:{c};background:{c}14">{ic(i)}</span><div><b>{n}</b><small>{t}</small></div>{ic("ext", "i ext")}</div>' for n, i, t, c in links)
    lh += f'<div class="lnk add"><span class="sym">{ic("plus")}</span><div><b>Link hinzufügen</b><small>App oder Webseite</small></div></div>'

    def trow(kunde, kz, av, text, due, cls, prio=False, hover=False):
        p = f'<span class="prio">{ic("flag")} Hoch</span>' if prio else ''
        go = (f'<span class="go on">Übersicht öffnen {ic("chev")}</span>' if hover else f'<span class="go">{ic("chev")}</span>')
        return (f'<div class="trow{" hover" if hover else ""}"><span class="box"></span><div class="tmain"><div class="kunde"><span class="avatar {av}">{kz}</span>{kunde}</div>'
                f'<div class="ttext">{text}</div></div><div class="tside">{p}<span class="due {cls}">{due}</span></div>{go}</div>')
    groups = [('Überfällig', 'rot', [trow('Familie Berger', 'FB', 'a1', 'Kfz-Angebot senden', 'seit 2 Tagen', 'over', True)]),
              ('Heute', 'orange', [trow('Thomas Brandt', 'TB', '', 'Unterlagen BU-Antrag anfordern', 'heute', 'today', True, hover=True),
                                   trow('Lea Nowak', 'LN', 'a3', 'Rückruf wegen Bausparvertrag', 'heute', 'today')]),
              ('Diese Woche', '', [trow('Jonas & Mira Albers', 'JA', 'a4', 'Termin Baufinanzierung vorbereiten', 'Do, 05.11.', ''),
                                   trow('Elif Yılmaz', 'EY', 'a5', 'Hausrat-Angebot nachfassen', 'Fr, 06.11.', '')])]
    tk = ''
    for g, c, rows in groups:
        tk += f'<div class="tgroup {c}"><span>{g}</span><em>{len(rows)}</em></div>' + ''.join(rows)
    tk += '<div class="tmore">Später: 2 weitere Aufgaben anzeigen</div>'

    pins = [('Familie Berger', 'FB', 'a1', GA, GN, '<span class="live"><span class="avatar a2">SK</span>Sabine K. ist gerade drin</span>', ('over', 'überfällig')),
            ('Thomas Brandt', 'TB', '', 152900, 148320, '29.10. · Tjark S.', ('today', 'heute fällig')),
            ('Jonas & Mira Albers', 'JA', 'a4', 241560, 238810, '26.10. · Sabine K.', ('', 'Do, 05.11.')),
            ('Elif Yılmaz', 'EY', 'a5', 38950, 36120, '22.10. · Tjark S.', ('', 'Fr, 06.11.'))]
    ph = ''
    for n, k, a, ga, gn, meta, (tc, tt) in pins:
        ph += (f'<div class="pcard"><div class="ptop"><span class="avatar {a}">{k}</span><div class="cmain"><b>{n}</b><small>{meta}</small></div>{ic("pin", "i pin")}</div>'
               f'<div class="pvals"><b>{eur(gn)}</b><span class="badge green">{eur(gn - ga, True)}</span><span class="spacer"></span>'
               f'<span class="pt {tc}">{ic("tasks")} {tt}</span></div></div>')

    recent = [('Lea Nowak', 'LN', 'a3', 'heute, 09:12 · Tjark S.', 84730, 79910, True),
              ('Andreas Köhler', 'AK', 'a2', 'gestern · Sabine K.', 31240, 31240, False),
              ('Katharina Vogt', 'KV', 'a3', '27.10. · Tjark S.', 46815, 46815, False)]
    ch = ''
    for n, k, a, meta, ga, gn, hov in recent:
        d = gn - ga
        dd = f'<span class="badge green">{eur(d, True)}</span>' if d < 0 else '<span class="diff0">gleich</span>'
        pin = f'<span class="pinbtn on">{ic("pin")} Anpinnen</span>' if hov else f'<span class="pinbtn">{ic("pin")}</span>'
        ch += (f'<div class="crow{" hover" if hov else ""}"><span class="avatar {a}">{k}</span><div class="cmain"><b>{n}</b><small>{meta}</small></div>'
               f'<div class="cval"><small>Aktuell</small>{eur(ga)}</div><div class="cval"><small>Neu</small>{eur(gn)}</div><div class="cdiff">{dd}</div>{pin}</div>')

    body = (f'<div class="toolbar start"><div><h1>Guten Morgen, Tjark</h1><div class="datum">Montag, 2. November 2026</div></div></div>'
            f'<div class="content narrow start">'
            f'<div class="section-title">Schnellstart<span class="spacer"></span><span class="btn ghost" style="padding:0">{ic("sliders")} Anpassen</span></div>'
            f'<div class="links">{lh}</div>'
            f'<div class="grid-start">'
            f'<div><div class="section-title">Aufgaben<span class="spacer"></span><span class="btn ghost" style="padding:0">{ic("plus")} Aufgabe</span></div><div class="panel">{tk}</div></div>'
            f'<div><div class="section-title">{ic("pin", "i pin-t")} Angepinnt<span class="hdr-note">4 von 4</span><span class="spacer"></span><span class="hdr-note">Neu pro Monat</span></div><div class="pins">{ph}</div>'
            f'<div class="section-title" style="margin-top:18px">Zuletzt bearbeitet<span class="spacer"></span><span class="hdr-note">Beitrag pro Monat</span></div><div class="panel">{ch}</div></div>'
            f'</div></div>')
    return sidebar('start', v2=True) + f'<main class="main">{body}</main>'

# ---------------- Kundenakte (Bild 1b, Wunsch Sitzung 5) ----------------
# Klick auf einen Kunden öffnet die Kundenakte statt direkt die letzte Übersicht:
# alle Vertragsübersichten des Kunden (über Jahre), Kennzahlen, Aufgaben des Kunden inkl. schnell neu anlegen.
UEBERSICHTEN = [  # Titel, angelegt, Status, Aktuell, Neu, Zusatz, offene Aufgaben, angepinnt
 ('Jahresgespräch 2026', 'seit 14.10.2026', 'arbeit', GA, GN, 'live', 2, True),
 ('Anschlussfinanzierung Haus', 'umgesetzt 28.05.2026', 'fertig', 205140, GA, 'frost', 1, False),
 ('Jahresgespräch 2024', 'umgesetzt 09.12.2024', 'fertig', 198760, 205140, 'frost', 0, False),
 ('Kfz-Wechsel', 'umgesetzt 15.02.2023', 'fertig', 199510, 198760, '', 0, False),
 ('Jahresgespräch 2021', 'umgesetzt 06.12.2021', 'fertig', 184000, 199510, 'frost', 0, False),
]

def kunde_body():
    st = {'arbeit': '<span class="badge blue">In Arbeit</span>', 'fertig': '<span class="badge">Umgesetzt</span>'}
    rows = ''
    for i, (t, meta, s, ga, gn, extra, auf, pin) in enumerate(UEBERSICHTEN):
        d = gn - ga
        dd = f'<span class="badge green">{eur(d, True)}</span>' if d < 0 else f'<span class="badge orange">{eur(d, True)}</span>'
        x = ''
        if extra == 'live': x = '<span class="live"><span class="avatar a2">SK</span>Sabine K. gerade drin</span>'
        if extra == 'frost': x = f'<span class="frost">{ic("snow")} eingefroren</span>'
        a = f'<span class="auf">· {ic("tasks")} {auf} {"Aufgabe" if auf == 1 else "Aufgaben"}</span>' if auf else ''
        p = f'{ic("pin", "i pin on")}' if pin else ''
        hov = i == 1
        go = (f'<span class="go on">Öffnen {ic("chev")}</span>' if hov else f'<span class="go">{ic("chev")}</span>')
        rows += (f'<div class="urow{" hover" if hov else ""}{" first" if i == 0 else ""}"><div class="umain"><b>{t} {p} {x}</b><small>{st[s]} {meta} {a}</small></div>'
                 f'<div class="cval"><small>Aktuell</small>{eur(ga)}</div><div class="cval"><small>Neu</small>{eur(gn)}</div>'
                 f'<div class="cdiff">{dd}</div>{go}</div>')
    rows += f'<div class="tmore">{ic("down")} 3 ältere Übersichten anzeigen (2014–2020)</div>'

    s = {b['typ']: b_summen(b) for b in AKTUELL}
    n_v = sum(len(u['v']) for b in AKTUELL for u in b['ug'])
    tiles = [('Beitrag pro Monat', eur(GA)), ('Gesamtvermögen', eur(s['SPAR']['vermoegen'])),
             ('Restschuld', eur(s['DARL']['restschuld'])), ('Verträge', str(n_v))]
    th = ''.join(f'<div class="kpi"><small>{l}</small><b>{v}</b></div>' for l, v in tiles)

    def task(text, due, cls, ueb, prio=False, wer='TS', wa='a4'):
        p = f'<span class="prio">{ic("flag")} Hoch</span>' if prio else ''
        return (f'<div class="trow"><span class="box"></span><div class="tmain"><div class="ttext k">{text}</div>'
                f'<div class="tueb">{ic("file")} {ueb}</div></div><div class="tside">{p}<span class="due {cls}">{due}</span></div>'
                f'<span class="avatar {wa} mini" title="zuständig">{wer}</span></div>')
    tk = (f'<div class="tadd"><div class="tin">{ic("plus")}<span>Termin zur Unterschrift vereinbaren</span><i class="caret"></i></div>'
          f'<div class="tchips"><span class="chip on">{ic("calendar")} Fr, 13.11.</span><span class="chip">{ic("flag")} Priorität</span>'
          f'<span class="chip on">{ic("file")} Jahresgespräch 2026</span><span class="chip"><span class="avatar a4 mini">TS</span> Tjark S.</span>'
          f'<span class="spacer"></span><span class="btn primary sm">Hinzufügen</span></div></div>')
    tk += '<div class="tgroup rot"><span>Überfällig</span><em>1</em></div>' + task('Kfz-Angebot senden', 'seit 2 Tagen', 'over', 'Jahresgespräch 2026', True)
    tk += '<div class="tgroup"><span>Diese Woche</span><em>1</em></div>' + task('BU-Unterlagen prüfen', 'Do, 05.11.', '', 'Jahresgespräch 2026', wer='SK', wa='a2')
    tk += '<div class="tgroup"><span>Später</span><em>1</em></div>' + task('Zinsbindung Bausparvertrag prüfen', '01.03.2027', '', 'Anschlussfinanzierung Haus')
    tk += f'<div class="tmore">{ic("check")} 14 erledigte Aufgaben anzeigen</div>'

    tb = (f'<div class="toolbar kunde"><span class="avatar a1 big">FB</span><div><h1>Familie Berger</h1>'
          f'<div class="datum">Kunde seit 2014 · 8 Vertragsübersichten</div></div><span class="spacer"></span>'
          f'<button class="btn">{ic("sparkles")} Mit Unterlagen starten</button>'
          f'<button class="btn primary">{ic("plus")} Neue Vertragsübersicht {ic("down")}</button></div>')
    body = (tb + f'<div class="content narrow start">'
            f'<div class="section-title">Aktueller Stand<span class="hdr-note">laut „Jahresgespräch 2026“, Fassung Aktuell</span></div>'
            f'<div class="kpis">{th}</div>'
            f'<div class="grid-kunde">'
            f'<div><div class="section-title">Vertragsübersichten<span class="spacer"></span><span class="hdr-note">Beitrag pro Monat</span></div><div class="panel">{rows}</div></div>'
            f'<div><div class="section-title">Aufgaben<span class="hdr-note">3 offen</span></div><div class="panel">{tk}</div></div>'
            f'</div></div>')
    return sidebar('Familie Berger', v2=True) + f'<main class="main">{body}</main>'

# ---------------- Export-Dialog ----------------
def export_overlay():
    return f'''<div class="overlay"><div class="sheet">
<header><h2>PDF erstellen</h2><p>Familie Berger · 02.11.2026</p></header>
<div class="body">
 <div class="field"><label>Inhalt</label><div class="choices">
  <div class="choice"><div class="mini"><i></i></div><b>Nur Aktuell</b><small>2 Seiten</small></div>
  <div class="choice"><div class="mini"><i class="b"></i></div><b>Nur Neu</b><small>2 Seiten</small></div>
  <div class="choice on"><div class="mini"><i></i><i class="b"></i></div><b>Beide</b><small>Aktuell, dann Neu</small></div>
 </div></div>
 <div class="field">
  <div class="optrow"><div>Vergleichsseite anhängen<small>Summen Aktuell und Neu gegenübergestellt</small></div><span class="switch on"><i></i></span></div>
  <div class="optrow"><div>Vorteile der Änderungen<small>Stichpunkte und Ersparnis, nach der Gesamtsumme in „Neu“</small></div><span class="switch on"><i></i></span></div>
  <div class="optrow"><div>Per E-Mail senden<small>Über Ihr Outlook-Konto, Mail liegt danach in „Gesendete Elemente“</small></div><span class="switch on"><i></i></span></div>
 </div>
 <div class="mailbox">
  <div class="r"><span>An</span>berger.familie@example.de</div>
  <div class="r"><span>Betreff</span>Ihre Vertragsübersicht</div>
  <div class="r"><span>Anhang</span><span class="attach" style="width:auto;color:var(--text)">{ic("pdf")} Vertragsuebersicht_Berger_2026-11-02.pdf · 5 Seiten</span><span style="margin-left:auto;width:auto" class="switch on"><i></i></span></div>
 </div>
</div>
<footer><button class="btn ghost">Vorschau öffnen</button><span class="spacer"></span><button class="btn">Abbrechen</button><button class="btn">{ic("pdf")} Nur speichern</button><button class="btn primary">{ic("mail")} Erstellen &amp; senden</button></footer>
</div></div>'''

# ---------------- Bild 5 v1 (Sitzung 10): PDF/E-Mail-Dialog im freigegebenen Design ----------------
# Neu: Übersichtstitel im Kopf, Abschnitte „Inhalt“ / „Im PDF“ / „E-Mail“, Schalter „Ersparnis anzeigen“
# (derselbe wie in „Neu“, wirkt auf App + PDF), Häkchen „Titel im PDF-Kopf“ (Standard aus) mit Kopfzeilen-Vorschau.
def export_overlay_v1(titel=False, ersparnis=True):
    sw = lambda on: f'<span class="switch{" on" if on else ""}"><i></i></span>'
    cb = lambda on: f'<span class="cbx{" on" if on else ""}">{ic("check") if on else ""}</span>'
    t = '<span class="kv-titel">Jahresgespräch 2026</span>' if titel else ''
    ers = f'{eur(DIFF, True)} pro Monat · {eur(DIFF*12, True)} pro Jahr' if ersparnis else 'aus – keine Differenzen und keine Ersparnis im PDF'
    return f'''<div class="overlay"><div class="sheet ex1">
<header><h2>PDF erstellen</h2><p>Familie Berger · Jahresgespräch 2026 · 02.11.2026</p></header>
<div class="body">
 <div class="ex-sec">Inhalt</div>
 <div class="choices">
  <div class="choice"><div class="mini"><i></i></div><b>Nur Aktuell</b><small>2 Seiten</small></div>
  <div class="choice"><div class="mini"><i class="b"></i></div><b>Nur Neu</b><small>2 Seiten</small></div>
  <div class="choice on"><div class="mini"><i></i><i class="b"></i></div><b>Beide</b><small>Aktuell, dann Neu</small></div>
 </div>
 <div class="ex-sec">Im PDF</div>
 <div class="ex-box">
  <div class="optrow"><div>Vergleichsseite anhängen<small>Summen von Aktuell und Neu auf einer Seite gegenübergestellt</small></div>{sw(True)}</div>
  <div class="optrow"><div>Vorteile der Änderungen<small>Stichpunkte nach dem Gesamtbetrag in „Neu“</small></div>{sw(True)}</div>
  <div class="optrow"><div>Ersparnis anzeigen<small>{ers} · gleicher Schalter wie in der Ansicht „Neu“</small></div>{sw(ersparnis)}</div>
  <div class="optrow cb"><div class="cbl">{cb(titel)}<div>Titel im PDF-Kopf<small>„Jahresgespräch 2026“ zusätzlich in der Kopfzeile jeder Seite</small></div></div></div>
  <div class="kopf-vorschau"><span class="kv-l">Kopfzeile</span><span class="kv-t">Vertragsübersicht{t}</span><span class="kv-m"><b>Familie Berger</b><span class="kv-f">Neu</span>02.11.2026</span></div>
 </div>
 <div class="ex-sec ex-sec-row"><span>Per E-Mail senden</span><small>über Ihr Outlook-Konto · danach in „Gesendete Elemente“</small><span class="spacer"></span>{sw(True)}</div>
 <div class="mailbox">
  <div class="r"><span>An</span>berger.familie@example.de</div>
  <div class="r"><span>Betreff</span>Ihre Vertragsübersicht – Jahresgespräch 2026</div>
  <div class="r"><span>Anhang</span><span class="attach">{ic("pdf")} Vertragsuebersicht_Berger_2026-11-02.pdf · 5 Seiten</span><span class="spacer"></span>{sw(True)}</div>
 </div>
</div>
<footer><button class="btn ghost">{ic("file")} Vorschau öffnen</button><span class="spacer"></span><button class="btn">Abbrechen</button><button class="btn">{ic("pdf")} Nur speichern</button><button class="btn primary">{ic("mail")} Erstellen &amp; senden</button></footer>
</div></div>'''

# ---------------- KI-Import ----------------
def ki_overlay():
    docs = [('Police_Wohngebaeude.pdf', '3 Seiten · analysiert', True), ('Kfz_Beitragsrechnung_2026.pdf', '1 Seite · analysiert', True),
            ('Scan_BU_Nachtrag.jpg', 'Scan · analysiert', True)]
    dh = ''.join(f'<div class="doc">{ic("file")}<div class="t"><b>{n}</b><small>{m}</small></div><span style="color:var(--green)">{ic("check")}</span></div>' for n, m, _ in docs)
    rows = [
     (True, 'Wohngebäude', 'Einfamilienhaus Bj. 1998, inkl. Elementar', '612,00 €', 'jährlich', '1 · Wohnen', None),
     (True, 'VW Golf', 'VK 300 € / TK 150 €, SF 12', '486,00 €', '<span class="unsure">halbjährlich?</span>', '1 · Kfz', 'Zahlweise unsicher – bitte prüfen'),
     (True, 'Berufsunfähigkeit', 'BU-Rente 1.500 € mtl. bis 67', '<span class="unsure">86,40 €</span>', 'monatlich', '4 · Familienabsicherung', 'Beitrag schlecht lesbar (Scan)'),
     (False, 'Glasversicherung', 'Im Hausrat-Nachtrag erwähnt', '24,00 €', 'jährlich', '1 · Wohnen', 'Vermutlich bereits gekündigt'),
    ]
    rh = ''
    for on, n, b, betrag, zw, ziel, note in rows:
        cb = f'<span class="cb">{ic("check")}</span>' if on else '<span class="cb off"></span>'
        nt = f'<br><small style="color:var(--orange)">{note}</small>' if note else ''
        rh += f'<tr class="{"" if on else "off"}"><td>{cb}</td><td><b style="font-weight:500">{n}</b>{nt}</td><td style="color:var(--muted)">{b}</td><td class="num">{betrag}</td><td>{zw}</td><td><span class="target">{ziel} {ic("down")}</span></td></tr>'
    return f'''<div class="overlay"><div class="sheet wide">
<header><h2>Unterlagen per KI einlesen</h2><p>Erkannte Verträge prüfen und in „Aktuell“ übernehmen. Nichts wird ohne Ihre Bestätigung übernommen.</p></header>
<div class="body"><div class="ki">
 <div class="docs">{dh}<div class="drop">{ic("upload")}<br>Weitere PDFs oder Scans hierher ziehen</div>
  <div class="privacy">{ic("lock")}<span>Der Kundenname wurde vor dem Senden entfernt. Unterlagen werden nach der Auswertung verworfen.<br><b style="color:var(--text);font-weight:500">KI-Konto:</b> frei wählbar in den Einstellungen</span></div></div>
 <div><table class="review" style="table-layout:fixed"><thead><tr><th style="width:24px"></th><th style="width:22%">Vertrag</th><th>Bemerkung</th><th class="num" style="width:12%">Beitrag</th><th style="width:14%">Zahlweise</th><th style="width:22%">Ziel</th></tr></thead><tbody>{rh}</tbody></table>
 <p style="color:var(--muted);font-size:12px;margin:12px 8px 0">Orange markierte Felder sollten Sie prüfen. Jeder Wert lässt sich per Klick ändern.</p></div>
</div></div>
<footer><span style="color:var(--muted)">3 von 4 ausgewählt</span><span class="spacer"></span><button class="btn">Abbrechen</button><button class="btn primary">{ic("check")} 3 Verträge übernehmen</button></footer>
</div></div>'''

# ---------------- Bild 6 v1 (Sitzung 11): KI-Import im freigegebenen Design ----------------
# Inhalt wie bisher (3 Unterlagen, 4 erkannte Verträge, 2 unsichere Werte, 1 abgewählt), aber Dialog im Stil von Bild 5 v1
# (Abschnittsüberschriften, Kästen, Häkchen .cbx), erkannte Verträge nach Bereich gruppiert in Bereichsfarben,
# Ziel-Untergruppe mit Symbol, Hinweise in normaler Schriftgröße statt kleiner grauer Zeile.
def ki_overlay_v1():
    docs = [('Police_Wohngebaeude.pdf', '3 Seiten'), ('Kfz_Beitragsrechnung_2026.pdf', '1 Seite'), ('Scan_BU_Nachtrag.jpg', 'Scan, 1 Seite')]
    dh = ''.join(f'<div class="kd">{ic("file")}<div class="t"><b>{n}</b><small>{m} · ausgewertet</small></div><span class="ok">{ic("check")}</span></div>' for n, m in docs)
    cb = lambda on: f'<span class="cbx{" on" if on else ""}">{ic("check") if on else ""}</span>'
    gruppen = [('VERS', [
        (True, 'Wohngebäude', 'Einfamilienhaus Bj. 1998, inkl. Elementar', '612,00 €', 'jährlich', ('home', 'Wohnen'), None, None),
        (True, 'VW Golf', 'VK 300 € / TK 150 €, SF 12', '486,00 €', 'halbjährlich', ('car', 'Kfz'), 'zw', 'Zahlweise unsicher – in der Rechnung steht „1. Rate“. Bitte prüfen.'),
        (False, 'Glasversicherung', 'Im Hausrat-Nachtrag erwähnt', '24,00 €', 'jährlich', ('home', 'Wohnen'), 'info', 'Vermutlich bereits gekündigt – daher nicht ausgewählt.')]),
       ('AV', [
        (True, 'Berufsunfähigkeit', 'BU-Rente 1.500 € mtl. bis 67', '86,40 €', 'monatlich', ('heart', 'Familienabsicherung'), 'betrag', 'Beitrag im Scan schlecht lesbar. Bitte prüfen.')])]
    tb, dn = '', ic('down')
    for i, (t, rows) in enumerate(gruppen):
        nr = [b['typ'] for b in AKTUELL].index(t) + 1
        rh = ''
        for on, n, bem, betrag, zw, (icn, ug), feld, note in rows:
            un = lambda f, v: f'<span class="unsure">{v}</span>' if feld == f else v
            rh += (f'<tr class="{"" if on else "off"}{" hat-note" if note else ""}"><td>{cb(on)}</td><td class="vn">{n}</td><td class="bem">{bem}</td>'
                   f'<td class="num">{un("betrag", betrag)}</td><td>{un("zw", f"<span class=sel>{zw} {dn}</span>")}</td>'
                   f'<td><span class="sel ziel">{ic(icn)}{ug} {ic("down")}</span></td></tr>')
            if note:
                warn = feld in ('zw', 'betrag')
                rh += f'<tr class="note{"" if on else " off"}"><td></td><td colspan="5"><span class="{"w" if warn else "i"}">{ic("info")}{note}</span></td></tr>'
        tb += (f'<div class="kb {FARBE[t]}"><div class="kb-kopf"><span class="nr">{nr}</span>{META[t][0]}<small>{len(rows)} erkannt</small></div>'
               f'<table class="review1"><colgroup><col style="width:34px"><col style="width:18%"><col><col style="width:11%"><col style="width:16%"><col style="width:26%"></colgroup>'
               f'<thead><tr><th></th><th>Vertrag</th><th>Bemerkung</th><th class="num">Beitrag</th><th>Zahlweise</th><th>Untergruppe</th></tr></thead><tbody>{rh}</tbody></table></div>')
    return f'''<div class="overlay"><div class="sheet ki1">
<header><h2>{ic("sparkles")} Unterlagen per KI einlesen</h2><p>Familie Berger · Jahresgespräch 2026 · Ergebnis wird in „Aktuell“ eingetragen</p></header>
<div class="body"><div class="ki1-grid">
 <div class="ki1-links">
  <div class="ex-sec">Unterlagen</div>
  <div class="kd-liste">{dh}</div>
  <div class="kdrop">{ic("upload")}<span>Weitere PDFs oder Scans hierher ziehen<br><u>oder auswählen</u></span></div>
  <div class="ex-sec">Datenschutz</div>
  <div class="kpriv">
   <div>{ic("user")}<span>Der Kundenname wird vor dem Senden entfernt.</span></div>
   <div>{ic("lock")}<span>Unterlagen werden nur ausgewertet und danach verworfen, nicht gespeichert.</span></div>
   <div>{ic("sparkles")}<span>KI-Konto: frei wählbar, änderbar in den Einstellungen.</span></div>
  </div>
 </div>
 <div class="ki1-rechts">
  <div class="ex-sec ex-sec-row"><span>Erkannte Verträge</span><small>4 gefunden · 2 Werte bitte prüfen</small><span class="spacer"></span><span class="legende"><span class="unsure">86,40 €</span> unsicher · Klick auf einen Wert ändert ihn</span></div>
  {tb}
 </div>
</div></div>
<footer><span class="kfuss"><b>3 von 4</b> ausgewählt · nur ausgewählte Verträge werden übernommen</span><span class="spacer"></span><button class="btn">Abbrechen</button><button class="btn primary">{ic("check")} 3 Verträge übernehmen</button></footer>
</div></div>'''

# ---------------- Bild 6b v1 (Sitzung 11): KI-Konto verbinden (Einstellungen) ----------------
# Wunsch des Nutzers: zeigen, wie die Verbindung mit einem KI-Konto läuft. Fehlender Screen „Einstellungen → KI-Konto“.
# Ablauf in 3 Schritten: Anbieter wählen → Zugang (API-Schlüssel) eintragen + testen → Datenschutz bestätigen.
def ki_konto_overlay_v1():
    sw = lambda on: f'<span class="switch{" on" if on else ""}"><i></i></span>'
    cb = lambda on: f'<span class="cbx{" on" if on else ""}">{ic("check") if on else ""}</span>'
    nav = [('sliders', 'Allgemein', ''), ('sparkles', 'KI-Konto', 'ok'), ('mail', 'Outlook', 'ok'), ('cloud', 'Speicherort', 'ok'),
           ('ext', 'Schnellstart', ''), ('file', 'Vorlagen', ''), ('lock', 'Datenschutz', '')]
    nh = ''.join(f'<div class="kk-nav-i{" on" if n == "KI-Konto" else ""}">{ic(i)}{n}{"<span class=dot></span>" if s else ""}</div>' for i, n, s in nav)
    anb = [('C', 'Claude', 'Anthropic', 'a1', True), ('G', 'ChatGPT', 'OpenAI', 'a3', False), ('G', 'Gemini', 'Google', 'a2', False),
           ('A', 'Azure OpenAI', 'Microsoft · Rechenzentrum EU', 'a4', False), ('M', 'Mistral', 'Anbieter aus der EU', 'a5', False),
           ('+', 'Anderer Anbieter', 'kompatible Schnittstelle', '', False)]
    ah = ''.join(f'<div class="kk-anb{" on" if on else ""}"><span class="kk-logo {c}">{l}</span><div><b>{n}</b><small>{d}</small></div>{"<span class=kk-sel>" + ic("check") + "</span>" if on else ""}</div>' for l, n, d, c, on in anb)
    return f'''<div class="overlay"><div class="sheet kk1">
<header><h2>Einstellungen</h2><p>Gilt für Ihr Benutzerkonto · Tjark S.</p></header>
<div class="kk-grid">
 <nav class="kk-nav">{nh}</nav>
 <div class="body">
  <div class="kk-titel"><h3>{ic("sparkles")} KI-Konto</h3><span class="kk-status">{ic("check")} Verbunden mit Claude</span></div>
  <p class="kk-lead">Die KI liest Unterlagen (PDFs, Scans) aus und füllt „Aktuell“ vor. Sie nutzen Ihr eigenes Konto beim Anbieter, die Kosten rechnet der Anbieter direkt mit Ihnen ab. Anbieter jederzeit wechselbar.</p>
  <div class="ex-sec"><span class="kk-n">1</span>Anbieter wählen</div>
  <div class="kk-anbieter">{ah}</div>
  <div class="ex-sec"><span class="kk-n">2</span>Zugang eintragen</div>
  <div class="ex-box kk-zugang">
   <div class="kk-feld"><label>API-Schlüssel</label><div class="kk-input mono">sk-ant-••••••••••••••••••••••••4f2c<span class="spacer"></span>{ic("lock")}</div></div>
   <div class="kk-feld"><label>Modell</label><div class="kk-input">Empfohlen (wird automatisch gewählt)<span class="spacer"></span>{ic("down")}</div></div>
   <div class="kk-test"><button class="btn">{ic("sync")} Verbindung testen</button><span class="kk-ok">{ic("check")} Verbindung erfolgreich (Antwort in 0,8 s)</span><span class="spacer"></span><a class="kk-link">Wo finde ich den Schlüssel? {ic("ext")}</a></div>
  </div>
  <div class="ex-sec"><span class="kk-n">3</span>Datenschutz</div>
  <div class="ex-box">
   <div class="optrow"><div>Kundenname vor dem Senden entfernen<small>Name und Anschrift werden in den Unterlagen geschwärzt</small></div><span class="kk-fest">{ic("lock")} immer an</span></div>
   <div class="optrow"><div>Unterlagen nach der Auswertung verwerfen<small>Nichts wird in der App, in OneDrive oder beim Anbieter gespeichert</small></div><span class="kk-fest">{ic("lock")} immer an</span></div>
   <div class="optrow cb"><div class="cbl">{cb(True)}<div>Auftragsverarbeitungsvertrag (AVV) mit dem Anbieter liegt vor<small>Nach DSGVO nötig, bevor Kundenunterlagen gesendet werden. Ohne Häkchen bleibt der KI-Import gesperrt.</small></div></div></div>
  </div>
 </div>
</div>
<footer><span class="kk-fuss">{ic("lock")} Schlüssel wird verschlüsselt nur auf diesem Computer gespeichert, nicht in OneDrive.</span><span class="spacer"></span><button class="btn ghost kk-trennen">Verbindung trennen</button><button class="btn">Abbrechen</button><button class="btn primary">Speichern</button></footer>
</div></div>'''

# ---------------- Bild 8 v1 (Sitzung 13): Einstellungen → Outlook, Speicherort, Schnellstart ----------------
# Fehlender Screen aus Abschnitt 2. Gleicher Dialog wie Bild 6b (Navigation links), je Seite ein Bild.
# Kennzeichnung je Seite, für wen die Einstellung gilt: „Nur für Sie“ oder „Ganze Agentur“.
def einst_overlay_v1(sel, titel_html, inhalt, fuss):
    nav = [('sliders', 'Allgemein', ''), ('sparkles', 'KI-Konto', 'ok'), ('mail', 'Outlook', 'ok'), ('cloud', 'Speicherort', 'ok'),
           ('ext', 'Schnellstart', ''), ('file', 'Vorlagen', ''), ('lock', 'Datenschutz', '')]
    nh = ''.join(f'<div class="kk-nav-i{" on" if n == sel else ""}">{ic(i)}{n}{"<span class=dot></span>" if s else ""}</div>' for i, n, s in nav)
    return f'''<div class="overlay"><div class="sheet kk1 es1">
<header><h2>Einstellungen</h2><p>Tjark S. · Inhaber · Was nur für Sie gilt und was für die ganze Agentur, steht neben jedem Titel.</p></header>
<div class="kk-grid">
 <nav class="kk-nav">{nh}</nav>
 <div class="body">{titel_html}{inhalt}</div>
</div>
<footer>{fuss}</footer>
</div></div>'''

def es_titel(sym, name, status, scope_agentur=False):
    sc = (f'<span class="es-scope ag">{ic("user")} Ganze Agentur</span>' if scope_agentur else f'<span class="es-scope">{ic("user")} Nur für Sie</span>')
    return f'<div class="kk-titel"><h3>{ic(sym)} {name}</h3>{status}<span class="spacer"></span>{sc}</div>'

def es_sw(on): return f'<span class="switch{" on" if on else ""}"><i></i></span>'

def outlook_overlay_v1():
    titel = es_titel('mail', 'Outlook', f'<span class="kk-status">{ic("check")} Verbunden</span>')
    inhalt = f'''<p class="kk-lead">PDFs gehen direkt aus der App per E-Mail raus, über Ihr bestehendes Microsoft-365-Konto. Die Anmeldung läuft über Microsoft, die App kennt Ihr Passwort nicht.</p>
  <div class="ex-sec"><span class="kk-n">1</span>Konto</div>
  <div class="ex-box es-konto">
   <span class="es-ms"><i></i><i></i><i></i><i></i></span>
   <div class="es-konto-t"><b>Tjark Sperling</b><small>t.sperling@agentur-muster.de · Microsoft 365 · angemeldet seit 14.10.2026</small></div>
   <span class="spacer"></span><button class="btn">Anderes Konto</button><button class="btn ghost kk-trennen">Abmelden</button>
  </div>
  <div class="ex-sec"><span class="kk-n">2</span>Senden</div>
  <div class="ex-box">
   <div class="optrow"><div>E-Mail vor dem Senden in Outlook öffnen<small>Aus: „Erstellen &amp; senden“ schickt sofort. An: Outlook öffnet die fertige Mail, Sie senden selbst.</small></div>{es_sw(False)}</div>
   <div class="optrow"><div>Outlook-Signatur anhängen<small>Ihre Standard-Signatur aus Outlook („Tjark Sperling · Agentur Muster“)</small></div>{es_sw(True)}</div>
   <div class="optrow"><div>Empfänger aus Outlook-Kontakten vorschlagen<small>Beim Tippen im Feld „An“ erscheinen passende Kontakte</small></div>{es_sw(True)}</div>
  </div>
  <div class="ex-sec"><span class="kk-n">3</span>Vorlage für die E-Mail</div>
  <div class="ex-box es-vorlage">
   <div class="es-vz"><label>Betreff</label><div class="kk-input">Ihre Vertragsübersicht – <span class="es-ph">Titel</span></div></div>
   <div class="es-vz"><label>Text</label><div class="kk-input es-text">Guten Tag <span class="es-ph">Kunde</span>,<br>anbei erhalten Sie Ihre Vertragsübersicht „<span class="es-ph">Titel</span>“ vom <span class="es-ph">Datum</span>. Bei Fragen melden Sie sich gern.<br>Viele Grüße<br><span class="es-ph">Mein Name</span></div></div>
   <div class="es-platz">Platzhalter einfügen: <span class="es-ph">Kunde</span><span class="es-ph">Titel</span><span class="es-ph">Datum</span><span class="es-ph">Mein Name</span><span class="spacer"></span><span class="es-hint">Im PDF-Dialog vor dem Senden änderbar</span></div>
  </div>'''
    fuss = (f'<span class="kk-fuss">{ic("lock")} Anmeldung über Microsoft. Gesendete Mails liegen wie gewohnt in Outlook, die App speichert keine Kopie.</span>'
            f'<span class="spacer"></span><button class="btn">Abbrechen</button><button class="btn primary">Speichern</button>')
    return einst_overlay_v1('Outlook', titel, inhalt, fuss)

def speicherort_overlay_v1():
    titel = es_titel('cloud', 'Speicherort', f'<span class="kk-status">{ic("check")} Synchronisiert · vor 1 Min.</span>', True)
    art = [('cloud', 'SharePoint', 'Team-Ordner · empfohlen', True), ('cloud', 'OneDrive', 'freigegebener Ordner', False),
           ('monitor', 'Nur dieser Computer', 'ohne Mehrbenutzer', False)]
    ah = ''.join(f'<div class="kk-anb{" on" if on else ""}"><span class="es-sym">{ic(i)}</span><div><b>{n}</b><small>{d}</small></div>{"<span class=kk-sel>" + ic("check") + "</span>" if on else ""}</div>' for i, n, d, on in art)
    inhalt = f'''<p class="kk-lead">Alle Kunden und Vertragsübersichten liegen in einem gemeinsamen Ordner der Agentur. Alle Mitarbeitenden verbinden denselben Ordner, Änderungen erscheinen bei den anderen nach wenigen Sekunden. Kein eigener Server nötig.</p>
  <div class="ex-sec"><span class="kk-n">1</span>Gemeinsamer Ordner</div>
  <div class="kk-anbieter">{ah}</div>
  <div class="ex-box es-ordner">
   <div class="es-pfad">{ic("cloud")}<span>Agentur Muster</span>{ic("chev")}<span>Dokumente</span>{ic("chev")}<b>Vertragsübersicht</b></div>
   <button class="btn">Ordner ändern …</button><button class="btn ghost">Im Explorer öffnen {ic("ext")}</button>
   <div class="es-stat"><span><b>128</b> Kunden</span><span><b>412</b> Übersichten</span><span><b>41 MB</b></span><span class="spacer"></span>
    <span class="es-wer"><span class="avatar a4">TS</span><span class="avatar a2">SK</span><span class="avatar a1">MB</span></span>3 Mitarbeitende nutzen diesen Ordner</div>
  </div>
  <div class="ex-sec"><span class="kk-n">2</span>Auf Desktop speichern</div>
  <div class="ex-box es-desk">
   <div class="es-vz"><label>Ziel</label><div class="kk-input">{ic("monitor")} Desktop<span class="spacer"></span>{ic("down")}</div></div>
   <div class="es-vz"><label>Dateiname</label><div class="kk-input"><span class="es-ph">Kunde</span> – <span class="es-ph">Titel</span> – <span class="es-ph">Datum</span><span class="spacer"></span><span class="es-hint">.vtue</span></div></div>
   <div class="es-bsp">z. B. „Familie Berger – Jahresgespräch 2026 – 02.11.2026.vtue“ · Doppelklick öffnet diesen Stand in der App</div>
   <div class="optrow es-voll"><div>Beim Speichern ein Passwort anbieten<small>Die Datei wird verschlüsselt und lässt sich nur mit Passwort öffnen. Gilt auch für PDFs.</small></div>{es_sw(True)}</div>
  </div>
  <div class="ex-sec"><span class="kk-n">3</span>Sicherheit</div>
  <div class="ex-box">
   <div class="optrow"><div>Ältere Stände wiederherstellen<small>SharePoint hebt jede Änderung 30 Tage lang auf</small></div><button class="btn">Verlauf öffnen …</button></div>
   <div class="optrow"><div>Ohne Internet weiterarbeiten<small>Änderungen werden nachgeholt, sobald die Verbindung wieder da ist</small></div><span class="kk-fest">{ic("lock")} immer an</span></div>
  </div>'''
    fuss = (f'<span class="kk-fuss">{ic("lock")} Kundendaten bleiben im Microsoft-365-Konto der Agentur (Rechenzentrum EU).</span>'
            f'<span class="spacer"></span><button class="btn">Abbrechen</button><button class="btn primary">Speichern</button>')
    return einst_overlay_v1('Speicherort', titel, inhalt, fuss)

def schnellstart_overlay_v1():
    titel = es_titel('ext', 'Schnellstart', '<span class="es-anz">7 von 8 Links</span>')
    links = [('Outlook', 'mail', 'App', 'Microsoft Outlook (installiert)', '#0a64d0'), ('Teams', 'chat', 'App', 'Microsoft Teams (installiert)', '#4b53bc'),
             ('Kalender', 'calendar', 'App', 'Outlook-Kalender', '#d63a5a'), ('Maklerportal', 'globe', 'Webseite', 'https://www.maklerportal.de/login', '#5e5ce6'),
             ('Vergleichsrechner', 'calc', 'Webseite', 'https://www.vergleich.de/makler', '#c77800'), ('Tarifrechner Kfz', 'car', 'Webseite', 'https://www.kfz-tarif.de', '#1f8a4c'),
             ('Bank-Portal', 'bank', 'Webseite', 'https://www.bank-partner.de/finanzierung', '#1f7f95')]
    rows = ''
    for k, (n, i, t, z, c) in enumerate(links):
        if k == 3:  # aufgeklappt: bearbeiten
            farben = ['#0a64d0', '#4b53bc', '#d63a5a', '#5e5ce6', '#c77800', '#1f8a4c', '#1f7f95', '#6e6e73']
            fh = ''.join(f'<i class="{"on" if f == c else ""}" style="background:{f}"></i>' for f in farben)
            sy = ''.join(f'<span class="{"on" if s == i else ""}">{ic(s)}</span>' for s in ['globe', 'calc', 'bank', 'shield', 'car', 'home', 'file', 'chat'])
            rows += (f'<div class="es-l edit"><span class="es-grip">{ic("grip")}</span><span class="sym" style="color:{c};background:{c}14">{ic(i)}</span>'
                     f'<div class="es-ed"><div class="es-ed-r"><div class="kk-input es-n">{n}</div><div class="kk-input es-z">{ic("globe")} {z}</div></div>'
                     f'<div class="es-ed-r"><span class="es-lab">Symbol</span><span class="es-syms">{sy}</span><span class="es-lab">Farbe</span><span class="es-farben">{fh}</span>'
                     f'<span class="spacer"></span><button class="btn ghost kk-trennen">Entfernen</button><button class="btn primary">Fertig</button></div></div></div>')
            continue
        rows += (f'<div class="es-l{" drag" if k == 5 else ""}"><span class="es-grip">{ic("grip")}</span><span class="sym" style="color:{c};background:{c}14">{ic(i)}</span>'
                 f'<b>{n}</b><span class="es-typ">{t}</span><span class="es-ziel">{z}</span><span class="es-akt">{ic("more")}</span></div>')
    inhalt = f'''<p class="kk-lead">Ihre Links oben auf der Startseite: 5 bis 8 Apps oder Webseiten, die Sie täglich brauchen. Reihenfolge durch Ziehen am Griff, Klick auf einen Link zum Bearbeiten.</p>
  <div class="es-liste">{rows}</div>
  <div class="es-add"><div class="es-add-b">{ic("monitor")}<div><b>App hinzufügen</b><small>aus den installierten Programmen</small></div></div>
   <div class="es-add-b">{ic("globe")}<div><b>Webseite hinzufügen</b><small>Adresse eintragen, Symbol wird vorgeschlagen</small></div></div></div>'''
    fuss = (f'<span class="kk-fuss">{ic("info")} Höchstens 8 Links, damit die Startseite übersichtlich bleibt.</span>'
            f'<span class="spacer"></span><button class="btn ghost">Agentur-Standard laden</button><button class="btn">Abbrechen</button><button class="btn primary">Speichern</button>')
    return einst_overlay_v1('Schnellstart', titel, inhalt, fuss)

# ---------------- Bild 9 v1 (Sitzung 14): Aufgaben je Vertragsübersicht ----------------
# Fehlender Screen aus Abschnitt 2. Knopf „Aufgaben“ in der Kopfzeile öffnet rechts ein Seitenfeld über der Übersicht
# (Übersicht bleibt sichtbar). Oben „Aufgabe anlegen“ (Text, Fällig, Priorität, Zuständig, Bezug auf Vertrag, Outlook-Erinnerung),
# darunter die offenen Aufgaben dieser Übersicht, gruppiert wie auf Startseite/Kundenakte. Verträge mit Aufgabe tragen ein Symbol.
TEAM = [('TS', 'a4', 'Ich'), ('SK', 'a2', 'Sabine K.'), ('MB', 'a1', 'Markus B.')]

def aufgaben_panel_v1(formular=True):
    def task(text, due, cls, vertrag, wer, wa, prio=False, hover=False):
        p = f'<span class="prio">{ic("flag")} Hoch</span>' if prio else ''
        v = f'<span class="au-v">{ic("file")} {vertrag}</span>' if vertrag else f'<span class="au-v">{ic("file")} ganze Übersicht</span>'
        akt = (f'<div class="au-akt"><span title="Verschieben">{ic("calendar")} +1 Woche</span><span>{ic("arrow")} Zum Vertrag</span><span>{ic("more")}</span></div>' if hover else '')
        return (f'<div class="au-row{" hover" if hover else ""}"><span class="box"></span><div class="au-main"><div class="au-t">{text}</div>'
                f'<div class="au-meta">{p}{v}</div>{akt}</div><div class="au-side"><span class="due {cls}">{due}</span>'
                f'<span class="avatar {wa} mini" title="zuständig">{wer}</span></div></div>')
    if formular:
        wer = ''.join(f'<span class="chip{" on" if k == "TS" else ""}"><span class="avatar {a} mini">{k}</span>{n}</span>' for k, a, n in TEAM)
        form = f'''<div class="au-form">
  <div class="tin">{ic("plus")}<span>Termin zur Unterschrift vereinbaren</span><i class="caret"></i></div>
  <div class="au-f"><label>Fällig</label><div class="au-fw"><span class="chip">Heute</span><span class="chip">Morgen</span><span class="chip">In 1 Woche</span><span class="chip on">{ic("calendar")} Fr, 13.11.</span></div></div>
  <div class="au-f"><label>Priorität</label><div class="au-fw"><div class="seg sm"><span class="on">Normal</span><span>{ic("flag")} Hoch</span></div></div></div>
  <div class="au-f"><label>Zuständig</label><div class="au-fw">{wer}</div></div>
  <div class="au-f"><label>Bezug</label><div class="au-fw"><div class="kk-input au-sel">{ic("file")} Ganze Übersicht<span class="spacer"></span>{ic("down")}</div></div></div>
  <div class="au-f"><label>Erinnerung</label><div class="au-fw nw"><span class="cbx on">{ic("check")}</span><span class="au-cb">In Outlook-Kalender <small>· am Fälligkeitstag, 9:00</small></span></div></div>
  <div class="au-btns"><span class="au-hint">Enter = anlegen</span><span class="spacer"></span><button class="btn">Abbrechen</button><button class="btn primary">Aufgabe anlegen</button></div>
 </div>'''
    else:
        form = f'<div class="au-neu">{ic("plus")} Neue Aufgabe <span class="spacer"></span><kbd>N</kbd></div>'
    liste = ('<div class="tgroup rot"><span>Überfällig</span><em>1</em></div>' +
             task('Kfz-Angebot senden', 'seit 2 Tagen', 'over', 'VW Golf', 'TS', 'a4', prio=True) +
             '<div class="tgroup"><span>Diese Woche</span><em>1</em></div>' +
             task('BU-Unterlagen prüfen', 'Do, 05.11.', '', 'Berufsunfähigkeit', 'SK', 'a2', hover=not formular))
    return f'''<aside class="au-panel">
 <header><div class="au-h"><h2>{ic("tasks")} Aufgaben</h2><span class="es-anz">2 offen</span><span class="spacer"></span><span class="au-x">{ic("x")}</span></div>
  <p>Jahresgespräch 2026 · Familie Berger</p>
  <div class="au-filter"><div class="seg sm"><span class="on">Offen 2</span><span>Erledigt 5</span></div><span class="spacer"></span><span class="switch"><i></i>Nur meine</span></div></header>
 <div class="au-body">{form}<div class="au-liste">{liste}</div>
  <div class="tmore">{ic("check")} 5 erledigte Aufgaben anzeigen</div></div>
 <footer>{ic("info")} Erscheint auch auf der Startseite und in der Kundenakte.</footer>
</aside>'''

def aufgaben_v1(formular=True):
    bs = ''.join(bereich_v1(b, i) for i, b in enumerate(AKTUELL))
    bs = bs.replace('<span class="edit-cell">VW Golf</span>',
                    f'<span class="edit-cell">VW Golf</span><span class="v-auf over" title="1 Aufgabe: Kfz-Angebot senden">{ic("tasks")}1</span>')
    bs = bs.replace('<span class="edit-cell">Berufsunfähigkeit</span>',
                    f'<span class="edit-cell">Berufsunfähigkeit</span><span class="v-auf" title="1 Aufgabe: BU-Unterlagen prüfen">{ic("tasks")}1</span>')
    gz = f'<div class="gesamt v1"><span>Gesamtbetrag monatlich</span><b>{eur(GA)}</b></div>'
    tb = toolbar_v1().replace(f'<button class="btn">{ic("tasks")} Aufgaben <span class="badge orange">1</span></button>',
                              f'<button class="btn on" title="Offene Aufgaben dieser Übersicht · rot = eine ist überfällig">{ic("tasks")} Aufgaben <span class="badge rot">2</span></button>')
    return (sidebar('Familie Berger', v2=True) +
            f'<main class="main au-main-wrap">{tb}{bereichsleiste_v1()}<div class="content narrow">{bs}{gz}</div>{aufgaben_panel_v1(formular)}</main>')

# ---------------- Bild 10 v1 (Sitzung 15): Auf Desktop speichern (+ Passwort) und gespeicherte Datei öffnen ----------------
# Fehlender Screen aus Abschnitt 2 („Stand einfrieren“ = Datei auf dem Desktop, Doppelklick öffnet, optional verschlüsselt).
# (a) Dialog „Auf Desktop speichern“ über der Ansicht „Aktuell“, (b) Doppelklick auf die Datei → Passwortabfrage,
# (c) geöffnete Datei in eigenem Fenster, nur ansehen.
P.update({
 'eye': '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
 'folder': '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
 'wand': '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
 'copy': '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
 'trash': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
})
DS_NAME = 'Familie Berger – Jahresgespräch 2026 – 02.11.2026'

def ds_icon(gross=False, lock=True):
    """Dateisymbol einer .vtue-Datei (App-Farbe, Schloss = mit Passwort)."""
    s = '<span class="ds-lock">' + ic('lock') + '</span>' if lock else ''
    return f'<span class="ds-ico{" gross" if gross else ""}"><i></i><b>VTÜ</b>{s}</span>'

def desktop_speichern_overlay_v1():
    cb = lambda on: f'<span class="cbx{" on" if on else ""}">{ic("check") if on else ""}</span>'
    punkte = '●' * 12
    return f'''<div class="overlay"><div class="sheet ex1 ds1">
<header><h2>{ic("monitor")} Auf Desktop speichern</h2><p>Familie Berger · Jahresgespräch 2026 · Stand von heute, 02.11.2026, 14:32 Uhr</p></header>
<div class="body">
 <div class="ds-datei">{ds_icon(True)}
  <div class="ds-df">
   <label>Dateiname</label>
   <div class="kk-input"><span>{DS_NAME}</span><span class="spacer"></span><span class="es-hint">.vtue</span></div>
   <div class="ds-ort">{ic("monitor")} Desktop <span class="ds-link">Anderer Ort …</span><span class="spacer"></span><span class="ds-gr">ca. 40 KB</span></div>
  </div>
 </div>
 <div class="ex-sec">Enthält</div>
 <div class="ex-box ds-inhalt">
  <div class="ds-teile"><span class="ds-t">{ic("check")} Aktuell <small>{eur(GA)}</small></span><span class="ds-t">{ic("check")} Neu <small>{eur(GN)}</small></span><span class="ds-t">{ic("check")} Vorteile</span><span class="ds-t">{ic("check")} Ersparnis-Einstellung</span></div>
  <div class="optrow"><div>Offene Aufgaben mitspeichern<small>Aus: Aufgaben sind intern und bleiben nur in der App</small></div>{es_sw(False)}</div>
 </div>
 <div class="ex-sec ex-sec-row"><span>{ic("lock")} Mit Passwort schützen</span><small>empfohlen, wenn die Datei das Büro verlässt</small><span class="spacer"></span>{es_sw(True)}</div>
 <div class="ex-box ds-pw">
  <div class="ds-pwf"><label>Passwort</label><div class="kk-input ds-mask fokus"><span>{punkte}</span><span class="spacer"></span>{ic("eye")}</div></div>
  <div class="ds-pwf"><label>Passwort wiederholen</label><div class="kk-input ds-mask"><span>{punkte}</span><span class="spacer"></span><span class="ds-gleich">{ic("check")}</span></div></div>
  <div class="ds-st"><span class="ds-bar"><i></i><i></i><i></i><i></i></span><b>Stark</b><span class="ds-link">{ic("wand")} Sicheres Passwort vorschlagen</span><span class="spacer"></span><span class="ds-gleich-t">{ic("check")} stimmt überein</span></div>
  <div class="ds-warn">{ic("info")}<span><b>Passwort gut aufbewahren.</b> Ohne Passwort lässt sich die Datei nicht mehr öffnen, auch nicht durch die Agentur. Passwort nie in derselben E-Mail wie die Datei senden.</span></div>
 </div>
 <div class="ds-so">
  <div><span class="kk-n">1</span><span><b>Fester Stand</b> – spätere Änderungen in der App ändern die Datei nicht.</span></div>
  <div><span class="kk-n">2</span><span><b>Doppelklick</b> öffnet die Datei in einem eigenen Fenster, auch mehrere gleichzeitig.</span></div>
  <div><span class="kk-n">3</span><span><b>Nur auf diesem Computer</b> – nicht im Agentur-Ordner. Das Original bleibt in der Kundenakte.</span></div>
 </div>
</div>
<footer><span class="cbl ds-nach">{cb(False)}<span>Danach im Explorer zeigen</span></span><span class="spacer"></span><button class="btn">Abbrechen</button><button class="btn primary">{ic("lock")} Verschlüsselt speichern</button></footer>
</div></div>'''

def desktop_speichern_v1():
    tb = toolbar_v1().replace(f'<button class="btn" title="Speichert diesen Stand als Datei auf dem Desktop. Doppelklick auf die Datei öffnet ihn in der App.">',
                              f'<button class="btn on" title="Speichert diesen Stand als Datei auf dem Desktop. Doppelklick auf die Datei öffnet ihn in der App.">')
    bs = ''.join(bereich_v1(b, i) for i, b in enumerate(AKTUELL))
    gz = f'<div class="gesamt v1"><span>Gesamtbetrag monatlich</span><b>{eur(GA)}</b></div>'
    return (sidebar('Familie Berger', v2=True) +
            f'<main class="main">{tb}{bereichsleiste_v1()}<div class="content narrow">{bs}{gz}</div></main>')

def datei_passwort_v1():
    """Windows-Desktop: Doppelklick auf die .vtue-Datei → kleines App-Fenster mit Passwortabfrage."""
    icons = [(f'<span class="dk-sys">{ic("trash")}</span>', 'Papierkorb', ''),
             (ds_icon(), DS_NAME + '.vtue', 'sel'),
             (ds_icon(lock=False), 'Lea Nowak – Beratung Altersvorsorge – 18.09.2026.vtue', ''),
             (f'<span class="dk-sys dk-app">{ic("columns")}</span>', 'Vertragsübersicht', ''),
             (f'<span class="dk-sys ordner">{ic("folder")}</span>', 'Scans', '')]
    ih = ''.join(f'<div class="dk-i {c}">{s}<span>{n}</span></div>' for s, n, c in icons)
    taskbar = (f'<div class="dk-bar"><span class="dk-start"><i></i><i></i><i></i><i></i></span>'
               f'<span class="dk-tb">{ic("search")}</span><span class="dk-tb">{ic("folder")}</span><span class="dk-tb">{ic("mail")}</span>'
               f'<span class="dk-tb on">{ic("columns")}</span><span class="spacer"></span><span class="dk-uhr">14:41<br>02.11.2026</span></div>')
    dialog = f'''<div class="dk-win">
 <div class="titlebar"><span>Vertragsübersicht</span><div class="winctl"><span>&#10005;</span></div></div>
 <div class="dk-pw">
  {ds_icon(True)}
  <h2>Geschützte Datei öffnen</h2>
  <p class="dk-name">{DS_NAME}.vtue</p>
  <p class="dk-meta">Gespeichert am 02.11.2026, 14:32 Uhr von Tjark S.</p>
  <div class="dk-feld"><label>Passwort</label><div class="kk-input ds-mask fokus"><span>●●●●●●●●●</span><i class="caret"></i><span class="spacer"></span>{ic("eye")}</div></div>
  <div class="dk-hilfe"><span class="ds-link">Passwort vergessen?</span><span class="dk-tip">Das Original liegt weiter in der Kundenakte. Von dort einfach neu speichern.</span></div>
  <div class="dk-btns"><button class="btn">Abbrechen</button><button class="btn primary">Öffnen</button></div>
 </div>
</div>'''
    return f'''<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Datei öffnen – Passwort – Mockup</title><link rel="stylesheet" href="style.css"></head>
<body class="dk"><div class="dk-desk"><div class="dk-icons">{ih}</div>
<div class="dk-klick">Doppelklick auf die Datei</div>{dialog}</div>{taskbar}</body></html>'''

def datei_geoeffnet_v1():
    """Geöffnete .vtue-Datei: eigenes Fenster ohne Seitenleiste, nur ansehen, Wege zum Weiterarbeiten."""
    seg = ''.join(f'<span class="{"on" if m == "Aktuell" else ""}">{m}</span>' for m in ('Aktuell', 'Neu', 'Nebeneinander'))
    tb = f'''<div class="toolbar v1 ds-tb">
  <span class="ds-ico mittel"><i></i><b>VTÜ</b><span class="ds-lock">{ic("lock")}</span></span>
  <div class="crumb"><span class="kunde">Familie Berger · gespeicherter Stand</span><h1>Jahresgespräch 2026</h1></div>
  <div class="seg" style="margin-left:6px">{seg}</div>
  <span class="spacer"></span>
  <button class="btn" title="Öffnet diese Übersicht in der App mit dem heutigen Stand">{ic("ext")} In der App öffnen</button>
  <button class="btn" title="Legt in der Kundenakte eine neue Vertragsübersicht mit genau diesem Stand an">{ic("copy")} Als neue Übersicht übernehmen</button>
  <button class="btn primary">{ic("pdf")} PDF / E-Mail</button>
</div>'''
    banner = (f'<div class="ds-banner">{ic("lock")}<span><b>Gespeicherter Stand vom 02.11.2026, 14:32 Uhr</b> · nur ansehen · mit Passwort geschützt</span>'
              f'<span class="spacer"></span><span class="ds-seit">{ic("info")} In der App wurde die Übersicht seitdem 3-mal geändert</span></div>')
    bs = ''.join(bereich_v1(b, i) for i, b in enumerate(AKTUELL))
    gz = f'<div class="gesamt v1"><span>Gesamtbetrag monatlich</span><b>{eur(GA)}</b></div>'
    body = f'<main class="main">{tb}{banner}{bereichsleiste_v1()}<div class="content narrow nurlesen">{bs}{gz}</div></main>'
    return page('Gespeicherte Datei', body).replace('<div class="app">', '<div class="app ds-app">').replace(
        '<span>Vertragsübersicht</span><div class="winctl">', f'<span>{DS_NAME}.vtue — Vertragsübersicht</span><div class="winctl">')

# ---------------- PDF ----------------
# ---------------- Bild 11 v1 (Sitzung 16): Neuer Kunde + Vorlagen + Autovervollständigung ----------------
# Fehlender Screen aus Abschnitt 2. (a) Dialog „Neuer Kunde“: nur Name, Titel der ersten Übersicht, Start leer / mit Vorlage / mit Unterlagen.
# (b) Einstellungen → Vorlagen (Design Bild 8): Agentur-Vorlagen + eigene, Untergruppen mit Symbolen, Vertragsvorschläge, Autovervollständigung.
# (c) Editor direkt nach dem Anlegen (Vorlage „Junge Familie“): Tippen im Feld „Vertrag“ zeigt Vorschläge.
P.update({
 'userplus': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
 'tpl': '<rect width="18" height="7" x="3" y="3" rx="1"/><rect width="9" height="7" x="3" y="14" rx="1"/><rect width="5" height="7" x="16" y="14" rx="1"/>',
 'fileplus': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9 15h6"/><path d="M12 18v-6"/>',
 'star': '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
 'baby': '<path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>',
 'activity': '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
 'briefcase': '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
 'umbrella': '<path d="M22 12a10.06 10.06 1 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 2v1"/>',
 'plane': '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
 'paw': '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
 'enter': '<polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
})

# Vorlage „Junge Familie“ (Agentur): Bereich, an/aus, Untergruppen (Symbol, Name, Vertragsvorschläge)
VORLAGE_JF = [
 ('VERS', True, [('shield', 'Haftpflicht & Recht', ['Privathaftpflicht', 'Rechtsschutz']), ('home', 'Wohnen', ['Hausrat', 'Wohngebäude']),
                 ('car', 'Kfz', ['Kfz-Versicherung']), ('activity', 'Gesundheit', ['Zahnzusatz', 'Kinder-Krankenzusatz'])]),
 ('SPAR', True, [('trend', 'Fonds & ETF', ['ETF-Sparplan']), ('baby', 'Sparen für Kinder', ['Kinder-Depot', 'Juniorsparen'])]),
 ('DARL', False, [('bank', 'Immobilie', []), ('cart', 'Konsum', [])]),
 ('AV', True, [('hourglass', 'Altersvorsorge', ['Private Rente']), ('heart', 'Familienabsicherung', ['Risikoleben', 'Berufsunfähigkeit'])]),
]
VORLAGEN = [  # Name, Untertitel, Symbol, Standard, eigene
 ('Agentur-Standard', '4 Bereiche · 9 Untergruppen', 'star', True, False),
 ('Junge Familie', '3 Bereiche · 8 Untergruppen', 'baby', False, False),
 ('Single & Berufsstart', '3 Bereiche · 6 Untergruppen', 'user', False, False),
 ('Selbstständige', '4 Bereiche · 10 Untergruppen', 'briefcase', False, False),
 ('Ruhestand', '3 Bereiche · 7 Untergruppen', 'hourglass', False, False),
 ('Baufinanzierung', '4 Bereiche · 8 Untergruppen', 'bank', False, True),
]

def nk_overlay_v1():
    kacheln = [('fileplus', 'Leer starten', '4 Bereiche, noch ohne Untergruppen', False),
               ('tpl', 'Mit Vorlage', 'Untergruppen mit Symbolen fertig angelegt', True),
               ('sparkles', 'Mit Unterlagen (KI)', 'KI liest PDFs/Scans, füllt „Aktuell“ vor', False)]
    kh = ''.join(f'<div class="kk-anb{" on" if on else ""}"><span class="es-sym">{ic(i)}</span><div><b>{n}</b><small>{d}</small></div>'
                 f'{"<span class=kk-sel>" + ic("check") + "</span>" if on else ""}</div>' for i, n, d, on in kacheln)
    def vl(n, sub, sym, std, eigen):
        on = n == 'Junge Familie'
        tag = f'<span class="nk-std" title="Standard für neue Kunden">{ic("star")}</span>' if std else ''
        return (f'<div class="nk-v{" on" if on else ""}"><span class="nk-radio{" on" if on else ""}"></span><span class="nk-vsym">{ic(sym)}</span>'
                f'<div><b>{n}</b><small>{sub}</small></div>{tag}</div>')
    liste = ('<div class="nk-gr">Agentur</div>' + ''.join(vl(*v) for v in VORLAGEN if not v[4]) +
             '<div class="nk-gr">Meine Vorlagen</div>' + ''.join(vl(*v) for v in VORLAGEN if v[4]))
    rows = ''
    for i, (t, an, ugs) in enumerate(VORLAGE_JF):
        if an:
            chips = ''.join(f'<span class="nk-ug">{ic(s)}{n}</span>' for s, n, _ in ugs)
        else:
            chips = '<span class="nk-aus">nicht in dieser Vorlage · später zuschaltbar</span>'
        rows += (f'<div class="nk-b {FARBE[t]}{"" if an else " off"}"><span class="nk-nr">{i+1}</span><div class="nk-bm"><b>{META[t][0]}</b>'
                 f'<div class="nk-ugs">{chips}</div></div></div>')
    return f'''<div class="overlay"><div class="sheet ex1 nk1">
<header><h2>{ic("userplus")} Neuer Kunde</h2><p>Gespeichert wird nur der Name – keine Anschrift, kein Geburtsdatum.</p></header>
<div class="body">
 <div class="nk-kopf">
  <span class="avatar a2 nk-av">FH</span>
  <div class="nk-f nk-name"><label>Name des Kunden</label><div class="tin">Familie Hoffmann<span class="caret"></span></div>
   <div class="nk-frei">{ic("check")} Noch kein Kunde mit diesem Namen</div></div>
  <div class="nk-f"><label>Erste Vertragsübersicht</label><div class="kk-input">Erstberatung 2026<span class="spacer"></span><span class="es-hint">änderbar</span></div>
   <div class="nk-tip">Vorschlag aus Anlass und Jahr</div></div>
 </div>
 <div class="ex-sec">Wie möchten Sie starten?</div>
 <div class="kk-anbieter">{kh}</div>
 <div class="nk-vorlage">
  <div class="nk-liste">{liste}<div class="nk-verw">{ic("sliders")} Vorlagen verwalten {ic("chev")}</div></div>
  <div class="nk-vor">
   <div class="nk-vor-k"><b>Vorschau „Junge Familie“</b><span class="es-scope ag">{ic("user")} Agentur-Vorlage</span></div>
   <p>Für Paare mit Kindern. Legt nur Bereiche und Untergruppen an, keine leeren Vertragszeilen.</p>
   {rows}
   <div class="nk-auto">{ic("wand")}<span><b>Autovervollständigung:</b> Beim Tippen im Feld „Vertrag“ schlägt die App passende Namen vor (z. B. „Hausrat“ in „Wohnen“).</span></div>
  </div>
 </div>
</div>
<footer><span class="kk-fuss">{ic("info")} Bereiche, Untergruppen und Symbole lassen sich danach jederzeit ändern.</span><span class="spacer"></span><button class="btn">Abbrechen</button><button class="btn primary">Kunde anlegen {ic("enter")}</button></footer>
</div></div>'''

def nk_start_v1():
    """Startseite, Knopf „Neuer Kunde“ in der Seitenleiste gedrückt."""
    return start_body()

def vorlagen_overlay_v1():
    titel = es_titel('tpl', 'Vorlagen', '<span class="es-anz">6 Vorlagen</span>', True)
    def vk(n, sub, sym, std, eigen):
        on = n == 'Junge Familie'
        tag = f'<span class="nk-std">{ic("star")}</span>' if std else ''
        return (f'<div class="vl-k{" on" if on else ""}"><span class="nk-vsym">{ic(sym)}</span><div><b>{n}</b><small>{sub}</small></div>{tag}</div>')
    links = ('<div class="nk-gr">Agentur</div>' + ''.join(vk(*v) for v in VORLAGEN if not v[4]) +
             f'<div class="nk-gr">Meine Vorlagen <span class="vl-nur">nur für Sie</span></div>' + ''.join(vk(*v) for v in VORLAGEN if v[4]) +
             f'<div class="vl-neu">{ic("plus")}<div><b>Neue Vorlage</b><small>leer oder aus einer Übersicht</small></div></div>')
    bl = ''
    for i, (t, an, ugs) in enumerate(VORLAGE_JF):
        rows = ''
        if an:
            for s, n, vor in ugs:
                vh = ''.join(f'<span class="vl-vs">{v}</span>' for v in vor)
                if n == 'Gesundheit':
                    sy = ''.join(f'<span class="{"on" if x == s else ""}">{ic(x)}</span>' for x in
                                 ['shield', 'home', 'car', 'activity', 'heart', 'umbrella', 'plane', 'paw', 'briefcase', 'baby', 'key', 'trend'])
                    rows += (f'<div class="vl-ug edit"><span class="es-grip">{ic("grip")}</span><span class="vl-sym on">{ic(s)}{ic("down")}</span>'
                             f'<div class="vl-ed"><div class="vl-ed-r"><div class="kk-input vl-n">{n}<span class="caret"></span></div><span class="vl-vor">{vh}<span class="vl-vs add">{ic("plus")}</span></span></div>'
                             f'<div class="vl-ed-r"><span class="es-lab">Symbol</span><span class="es-syms">{sy}</span></div></div></div>')
                    continue
                rows += (f'<div class="vl-ug"><span class="es-grip">{ic("grip")}</span><span class="vl-sym">{ic(s)}</span><b>{n}</b>'
                         f'<span class="vl-vor">{vh}</span><span class="es-akt">{ic("more")}</span></div>')
        bl += (f'<div class="vl-b {FARBE[t]}{"" if an else " off"}"><div class="vl-bk"><span class="chk">{ic("check") if an else ""}</span><b>{META[t][0]}</b>'
               f'{"" if an else "<span class=vl-aus>nicht in dieser Vorlage</span>"}<span class="spacer"></span>{"<span class=vl-addk>" + ic("plus") + " Untergruppe</span>" if an else "<span class=vl-addk>zuschalten</span>"}</div>{rows}</div>')
    inhalt = f'''<p class="kk-lead">Vorlagen legen Bereiche und Untergruppen mit Symbolen an. Vertragsnamen erscheinen beim Tippen als Vorschlag.</p>
  <div class="vl-grid">
   <div class="vl-links">{links}
    <div class="vl-auto"><div class="vl-auto-k">{ic("wand")} Autovervollständigung<span class="spacer"></span>{es_sw(True)}</div>
     <div class="vl-auto-t">Schlägt beim Tippen Vertragsnamen mit üblicher Zahlweise vor – aus Vorlagen und allen Kunden der Agentur.</div>
     <div class="vl-liste">{ic("file")} 148 Namen · <span class="ds-link">Liste bearbeiten …</span></div>
    </div>
   </div>
   <div class="vl-ed-box">
    <div class="vl-kopf"><span class="nk-vsym gross">{ic("baby")}</span><div class="kk-input vl-name">Junge Familie</div>
     <span class="vl-std">{es_sw(False)} Standard für neue Kunden</span></div>
    {bl}
   </div>
  </div>'''
    fuss = (f'<span class="kk-fuss">{ic("info")} Änderungen gelten nur für neue Kunden. Bestehende Übersichten bleiben unverändert.</span>'
            f'<span class="spacer"></span><button class="btn ghost">{ic("copy")} Duplizieren</button><button class="btn">Abbrechen</button><button class="btn primary">Speichern</button>')
    return einst_overlay_v1('Vorlagen', titel, inhalt, fuss)

def nk_editor_v1():
    """Editor direkt nach „Kunde anlegen“ mit Vorlage „Junge Familie“; Tippen „Haus“ in „Wohnen“ zeigt Vorschläge."""
    tb = (toolbar_v1().replace('avatar a1">FB', 'avatar a2">FH').replace('Familie Berger', 'Familie Hoffmann')
          .replace('Jahresgespräch 2026 <span class="avatar a2 live" title="Sabine K. arbeitet gerade ebenfalls in dieser Übersicht">SK</span>', 'Erstberatung 2026')
          .replace(' <span class="badge orange">1</span>', ''))
    leiste = bereichsleiste_v1(g=790).replace('bl-item darl"', 'bl-item darl off" title="Nicht in der Vorlage – Klick auf das Kästchen schaltet den Bereich zu"')
    leiste = leiste.replace('<span class="bl-item darl off"', '<span class="bl-item darl off"', 1)
    # Darlehen-Häkchen leer
    i0 = leiste.find('bl-item darl off')
    seg = leiste[i0:]
    seg = seg.replace(f'<span class="chk" title="Bereich an-/abwählen">{ic("check")}</span>', '<span class="chk" title="Bereich an-/abwählen"></span>', 1)
    leiste = leiste[:i0] + seg
    cg = colgroup_v1('VERS')
    def ug(sym, name, body, summe):
        return (f'<div class="ug v1"><div class="ug-kopf"><span class="grip">{ic("grip")}</span><span class="ug-icon">{ic(sym)}</span>'
                f'<span class="name">{name}</span><span class="ug-more">{ic("more")}</span></div>{body}'
                f'<div class="ug-fuss"><span class="add-v">{ic("plus")} Vertrag</span><span class="summe"><small>Beitrag / Monat</small> {summe}</span></div></div>')
    phv = (f'<table class="vt">{cg}<tbody><tr><td class="g grip">{ic("grip")}</td><td class="vname"><span class="edit-cell">Privathaftpflicht</span></td>'
           f'<td class="bem"><span class="edit-cell">Familientarif, Deckung 20 Mio. €</span></td><td class="num">7,90 €</td>'
           f'<td class="zw"><span class="zw-sel">monatlich{ic("down")}</span></td></tr></tbody></table>')
    vors = [('Hausrat', 'Wohnen · meist jährlich', '214×', True, ''),
            ('Haus- und Grundbesitzerhaftpflicht', 'gehört zu „Haftpflicht &amp; Recht“', '38×', False, f'<span class="ac-move">{ic("arrow")} wird dorthin verschoben</span>'),
            ('Haus- und Wohnungsschutzbrief', 'Wohnen · meist jährlich', '12×', False, '')]
    vh = ''.join(f'<div class="ac-i{" on" if on else ""}"><span class="ac-n"><b>Haus</b>{n[4:]}</span><span class="ac-m">{m}{mv}</span><span class="ac-z">{z}</span></div>' for n, m, z, on, mv in vors)
    menu = (f'<div class="ac-menu"><div class="ac-k">{ic("wand")} Vorschläge aus der Agentur</div>{vh}'
            f'<div class="ac-f"><span><kbd>↑</kbd><kbd>↓</kbd> auswählen</span><span><kbd>Enter</kbd> übernehmen</span><span><kbd>Esc</kbd> eigener Name „Haus“</span></div></div>')
    wohnen = (f'<table class="vt">{cg}<tbody><tr class="focus"><td class="g grip">{ic("grip")}</td>'
              f'<td class="vname ac-td"><span class="edit-cell active">Haus<span class="caret"></span><span class="ac-ghost">rat</span></span>{menu}</td>'
              f'<td class="bem"><span class="ph">Bemerkung</span></td><td class="num"><span class="ph">0,00 €</span></td>'
              f'<td class="zw"><span class="zw-sel ph">jährlich{ic("down")}</span></td></tr></tbody></table>')
    leer = '<div class="ug-leer">Noch keine Verträge – erscheint erst im PDF, wenn ein Vertrag eingetragen ist</div>'
    ugs = (ug('shield', 'Haftpflicht &amp; Recht', phv, '7,90 €') + ug('home', 'Wohnen', wohnen, '0,00 €') +
           ug('car', 'Kfz', leer, '0,00 €') + ug('activity', 'Gesundheit', leer, '0,00 €'))
    vers = (f'<section class="bereich v1 vers"><header class="bereich-kopf"><span class="nr">1</span><h2>Versicherungen</h2>'
            f'<span class="spacer"></span><button class="btn icon ghost">{ic("more")}</button></header>{spaltenkopf_v1("VERS")}'
            f'<div class="ugs">{ugs}<div class="add-ug v1">{ic("plus")} Untergruppe hinzufügen</div></div>'
            f'<footer class="bereich-summe v1"><span class="bs-label">Summe Versicherungen</span><span class="spacer"></span><div class="kv"><span>Beitrag / Monat</span><b>7,90 €</b></div></footer></section>')
    hinweis = (f'<div class="nk-band">{ic("tpl")}<span><b>Familie Hoffmann</b> wurde mit der Vorlage „Junge Familie“ angelegt · Darlehen ist aus und lässt sich oben jederzeit zuschalten.</span>'
               f'<span class="spacer"></span><span class="ds-link">Vorlage wechseln</span><span class="nk-x">{ic("x")}</span></div>')
    sb = sidebar('Familie Hoffmann', v2=True)
    sb = sb.replace('<ul class="nav">', '<ul class="nav"><li class="sel"><span class="avatar a2">FH</span>Familie Hoffmann<span class="nk-neu">neu</span></li>', 1)
    return sb + f'<main class="main">{tb}{leiste}<div class="content narrow">{hinweis}{vers}</div></main>'


def p_head(fassung):
    return f'<div class="p-head"><span class="t">Vertragsübersicht</span><span class="m"><b>Familie Berger</b><span class="p-fassung">{fassung}</span>02.11.2026</span></div>'
def p_bereich(b, i):
    t = b['typ']; title, sub = META[t]
    h = f'<div class="p-bereich"><h2><span class="nr">{i+1}</span>{title}{f" <small>{sub}</small>" if sub else ""}</h2>'
    for ug in b['ug']:
        h += f'<div class="p-ug"><div class="p-ug-kopf"><span class="ico">{ic(ug["icon"])}</span>{ug["name"]}<span class="s">{eur(ug_monat(t, ug))} <small>{ug_label(t)} / Monat</small></span></div>'
        h += table(t, ug, edit=False, cls='pt') + '</div>'
    return h + f'<div class="p-summe">{summen_html(b, pdf=True)}</div></div>'
def p_gesamt(f, label_extra=''):
    e = sum(b_summen(b)['einmal'] for b in f)
    return f'<div class="p-gesamt"><div><div class="l">Gesamtbetrag pro Monat</div><div class="w">{eur(gesamt(f))}</div></div><div class="r">Beiträge + Sparraten + Kreditraten<br>Einmalbeträge separat: {eur(e)}</div></div>'
def p_vorteile():
    li = ''.join(f'<li>{t}</li>' for t in VORTEILE)
    return (f'<div class="p-vorteile"><h3>Vorteile der Änderungen</h3><ul>{li}</ul><div class="ersparnis">'
            f'<div><span>Ersparnis pro Monat</span><b>{eur(-DIFF)}</b></div><div><span>Ersparnis pro Jahr</span><b>{eur(-DIFF*12)}</b></div></div></div>')
def p_vergleich():
    rows = ''
    for i, (a, n) in enumerate(zip(AKTUELL, NEU)):
        sa, sn = b_summen(a), b_summen(n)
        d = sn['monat'] - sa['monat']
        rows += f'<tr><td>{i+1} · {META[a["typ"]][0]} <span style="color:var(--muted)">({ug_label(a["typ"])} / Monat)</span></td><td class="num">{eur(sa["monat"])}</td><td class="num">{eur(sn["monat"])}</td><td class="num" style="color:{"var(--green)" if d < 0 else "inherit"}">{eur(d, True) if d else "±0,00 €"}</td></tr>'
    rows += f'<tr class="sum"><td>Gesamtbetrag pro Monat</td><td class="num">{eur(GA)}</td><td class="num">{eur(GN)}</td><td class="num" style="color:var(--green)">{eur(DIFF, True)}</td></tr>'
    rows += f'<tr class="sub"><td>Pro Jahr</td><td class="num">{eur(GA*12)}</td><td class="num">{eur(GN*12)}</td><td class="num">{eur(DIFF*12, True)}</td></tr>'
    ea = sum(b_summen(b)['einmal'] for b in AKTUELL); en = sum(b_summen(b)['einmal'] for b in NEU)
    rows2 = (f'<tr><td>Einmalbeträge</td><td class="num">{eur(ea)}</td><td class="num">{eur(en)}</td><td class="num">±0,00 €</td></tr>'
             f'<tr><td>Gesamtvermögen (Sparen & Investieren)</td><td class="num">{eur(b_summen(AKTUELL[1])["vermoegen"])}</td><td class="num">{eur(b_summen(NEU[1])["vermoegen"])}</td><td class="num">±0,00 €</td></tr>'
             f'<tr><td>Gesamtrestschuld (Darlehen)</td><td class="num">{eur(b_summen(AKTUELL[2])["restschuld"])}</td><td class="num">{eur(b_summen(NEU[2])["restschuld"])}</td><td class="num">±0,00 €</td></tr>')
    th = '<thead><tr><th>Bereich</th><th>Aktuell</th><th>Neu</th><th>Differenz</th></tr></thead>'
    return (f'<div class="p-bereich"><h2>Vergleich Aktuell und Neu</h2><table class="vgl">{th}<tbody>{rows}</tbody></table></div>'
            f'<div class="p-bereich" style="margin-top:8mm"><h2>Weitere Werte</h2><table class="vgl">{th}<tbody>{rows2}</tbody></table></div>'
            f'<div style="margin-top:8mm">{p_vorteile()}</div>')

def pdf_page():
    pages = [
      (p_head('Aktuell') + p_bereich(AKTUELL[0], 0) + p_bereich(AKTUELL[1], 1), 'Aktuell · Seite 1'),
      (p_head('Aktuell') + p_bereich(AKTUELL[2], 2) + p_bereich(AKTUELL[3], 3) + p_gesamt(AKTUELL), 'Aktuell · Seite 2'),
      (p_head('Neu') + p_bereich(NEU[0], 0) + p_bereich(NEU[1], 1), 'Neu · Seite 3'),
      (p_head('Neu') + p_bereich(NEU[2], 2) + p_bereich(NEU[3], 3) + p_gesamt(NEU) + p_vorteile(), 'Neu · Seite 4'),
      (p_head('Vergleich') + p_vergleich(), 'Vergleichsseite (optional) · Seite 5'),
    ]
    ph = ''.join(f'<div class="page">{c}<span class="page-label">{l}</span></div>' for c, l in pages)
    return f'''<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>PDF-Vorschau – Mockup</title><link rel="stylesheet" href="style.css"></head>
<body class="pdf"><div class="pdf-bar">{ic("pdf")}<b>PDF-Vorschau</b><span style="color:var(--muted)">Beide + Vergleichsseite · 5 Seiten A4 · grau: nur Seitenbeschriftung der Vorschau</span><span class="spacer"></span><a class="btn" href="index.html" style="text-decoration:none">Zur Übersicht</a></div>
<div class="pages">{ph}</div></body></html>'''

# ---------------- Bild 7 v1 (Sitzung 12): PDF im freigegebenen Design aus Bild 2/3/5 ----------------
# Bereichsfarben, Spaltenkopf einmal je Bereich, Untergruppen als getönte Karten mit Summe im Kartenfuß,
# Bereichsfuß „Summe <Bereich>“, Gesamtbalken „Gesamtbetrag monatlich“. Optionen aus dem PDF-Dialog (Bild 5):
# titel = Übersichtstitel im Kopf (Standard aus), ersparnis = Differenzen/Ersparnis (gleicher Schalter wie in „Neu“).
def p_head_v1(fassung, titel=False):
    t = '<span class="p-titel">Jahresgespräch 2026</span>' if titel else ''
    return (f'<div class="p-head v1"><span class="t">Vertragsübersicht{t}</span>'
            f'<span class="m"><b>Familie Berger</b><span class="p-fassung">{fassung}</span>02.11.2026</span></div>')

P_COLS = {**{t: [c[1] for c in COLS[t]] for t in COLS},  # PDF: eigene Spaltenbreiten (A4), Spaltennamen wie in der App
 'SPAR': ['15%', '', '10%', '10%', '11%', '12%', '11%'],
 'AV':   ['23.5%', '', '9%', '11%', '10%', '15.5%', '11%']}
def p_cg(t): return '<colgroup>' + ''.join(f'<col style="width:{w}">' if w else '<col>' for w in P_COLS[t]) + '</colgroup>'

def p_bereich_v1(b, i, other=None):
    t = b['typ']; title = META[t][0]
    th = ''.join(f'<th class="{"num" if len(c) > 2 else ""}">{c[0]}</th>' for c in COLS[t])
    h = (f'<div class="p-bereich v1 {FARBE[t]}"><div class="p-bk"><span class="nr">{i+1}</span>{title}</div>'
         f'<table class="pt v1 p-sk">{p_cg(t)}<thead><tr>{th}</tr></thead></table><div class="p-ugs">')
    for ug in b['ug']:
        rows = ''
        for v in ug['v']:
            rows += f'<tr><td class="vname">{v["n"]}</td><td class="bem">{v["b"]}</td>'
            rows += ''.join(f'<td class="{"num" if len(c) > 2 else "zw"}">{val}</td>' for c, val in zip(COLS[t][2:], cells(t, v, False, False)))
            rows += '</tr>'
        h += (f'<div class="p-ug v1"><div class="p-ug-kopf"><span class="ico">{ic(ug["icon"])}</span>{ug["name"]}</div>'
              f'<table class="pt v1">{p_cg(t)}<tbody>{rows}</tbody></table>'
              f'<div class="p-ug-fuss"><small>{ug_label(t)} / Monat</small>{eur(ug_monat(t, ug))}</div></div>')
    h += (f'</div><div class="p-summe v1"><span class="bs-label">Summe {title}</span><span class="spacer"></span>'
          f'{summen_html(b, other) if other else summen_html(b, pdf=True)}</div></div>')
    return h

def p_gesamt_v1(f, ersparnis=False):
    neben = (f'<div class="neben">Aktuell {eur(GA)}<br><b>{eur(DIFF, True)} pro Monat</b></div>' if ersparnis else '')
    return f'<div class="p-gesamt v1"><span class="l">Gesamtbetrag monatlich</span><span class="spacer"></span>{neben}<b class="w">{eur(gesamt(f))}</b></div>'

def p_vorteile_v1(ersparnis=True):
    li = ''.join(f'<li>{ic("check")}<span>{t}</span></li>' for t in VORTEILE)
    e = (f'<div class="ersparnis"><div><span>Ersparnis pro Monat</span><b>{eur(-DIFF)}</b></div>'
         f'<div><span>Ersparnis pro Jahr</span><b>{eur(-DIFF*12)}</b></div></div>') if ersparnis else ''
    return f'<div class="p-vorteile v1"><h3>Vorteile der Änderungen</h3><ul>{li}</ul>{e}</div>'

def p_vergleich_v1(ersparnis=True):
    def row(label, a, n, cls='', nr=None, farbe=''):
        d = n - a
        dz = (f'<td class="num{" gruen" if d < 0 else ""}">{eur(d, True) if d else "±0,00 €"}</td>') if ersparnis else ''
        lab = f'<span class="vnr {farbe}">{nr}</span>{label}' if nr else label
        return f'<tr class="{cls}"><td>{lab}</td><td class="num">{eur(a)}</td><td class="num">{eur(n)}</td>{dz}</tr>'
    rows = ''
    for i, (a, n) in enumerate(zip(AKTUELL, NEU)):
        t = a['typ']
        rows += row(f'{META[t][0]} <small>{ug_label(t)} / Monat</small>', b_summen(a)['monat'], b_summen(n)['monat'], nr=i+1, farbe=FARBE[t])
    rows += row('Gesamtbetrag monatlich', GA, GN, 'sum')
    rows += row('Gesamtbetrag jährlich', GA*12, GN*12, 'sub')
    ea = sum(b_summen(b)['einmal'] for b in AKTUELL); en = sum(b_summen(b)['einmal'] for b in NEU)
    rows2 = (row('Einmalbeträge', ea, en) +
             row('Gesamtvermögen <small>Sparen & Investieren</small>', b_summen(AKTUELL[1])['vermoegen'], b_summen(NEU[1])['vermoegen']) +
             row('Gesamtrestschuld <small>Darlehen</small>', b_summen(AKTUELL[2])['restschuld'], b_summen(NEU[2])['restschuld']))
    th = '<thead><tr><th></th><th>Aktuell</th><th>Neu</th>' + ('<th>Differenz</th>' if ersparnis else '') + '</tr></thead>'
    cg = '<colgroup><col><col style="width:16%"><col style="width:16%">' + ('<col style="width:14%">' if ersparnis else '') + '</colgroup>'
    return (f'<div class="p-vgl"><h2>Monatliche Beträge</h2><table class="vgl v1">{cg}{th}<tbody>{rows}</tbody></table></div>'
            f'<div class="p-vgl"><h2>Weitere Werte</h2><table class="vgl v1">{cg}{th}<tbody>{rows2}</tbody></table></div>'
            f'{p_vorteile_v1(ersparnis)}')

def pdf_page_v1(titel=False, ersparnis=True):
    o = (lambda i: AKTUELL[i]) if ersparnis else (lambda i: None)
    H = lambda f: p_head_v1(f, titel)
    pages = [
      (H('Aktuell') + p_bereich_v1(AKTUELL[0], 0) + p_bereich_v1(AKTUELL[1], 1), 'Aktuell · Seite 1 von 5'),
      (H('Aktuell') + p_bereich_v1(AKTUELL[2], 2) + p_bereich_v1(AKTUELL[3], 3) + p_gesamt_v1(AKTUELL), 'Aktuell · Seite 2 von 5'),
      (H('Neu') + p_bereich_v1(NEU[0], 0, o(0)) + p_bereich_v1(NEU[1], 1, o(1)), 'Neu · Seite 3 von 5'),
      (H('Neu') + p_bereich_v1(NEU[2], 2, o(2)) + p_bereich_v1(NEU[3], 3, o(3)) + p_gesamt_v1(NEU, ersparnis), 'Neu · Seite 4 von 5'),
      (H('Vergleich') + p_vergleich_v1(ersparnis), 'Vergleichsseite (optional) · Seite 5 von 5'),
    ]
    ph = ''.join(f'<div class="page v1">{c}<span class="page-label">{l}</span></div>' for c, l in pages)
    var = ('Titel im Kopf an' if titel else 'Titel im Kopf aus') + ' · ' + ('Ersparnis an' if ersparnis else 'Ersparnis aus')
    return f'''<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>PDF-Vorschau – Mockup</title><link rel="stylesheet" href="style.css"></head>
<body class="pdf"><div class="pdf-bar">{ic("pdf")}<b>PDF-Vorschau</b><span style="color:var(--muted)">Beide + Vergleichsseite · 5 Seiten A4 · {var} · grau: nur Seitenbeschriftung der Vorschau</span><span class="spacer"></span><a class="btn" href="index.html" style="text-decoration:none">Zur Übersicht</a></div>
<div class="pages">{ph}</div></body></html>'''

# ---------------- Bild 12 v1 (Sitzung 17): Untergruppe / Vertrag bearbeiten ----------------
# Fehlender Screen aus Abschnitt 2. Vier Zustände im Editor „Aktuell“ (Bild 2):
# (a) Menü „…“ einer Untergruppe + Seitenfeld „Name & Symbol“, (b) Untergruppe per Drag & Drop verschieben,
# (c) Untergruppe mit Verträgen löschen (Rückfrage), (d) Vertragsdetails (Zahlweise, AV-Leistung + Art, Laufzeit-Enddatum,
# umbenennen, in andere Untergruppe verschieben, löschen).
P.update({
 'up': '<path d="m18 15-6-6-6 6"/>',
 'pencil': '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
 'move': '<path d="M12 2v20"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><path d="M2 12h20"/><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/>',
 'undo': '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
 'alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
 'gift': '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
 'bike': '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
 'tooth': '<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7.5.4 2.4 1 6 2.5 6s1.8-3 2.3-5c.3-1 .9-1.5 2.2-1.5s1.9.5 2.2 1.5c.5 2 .8 5 2.3 5s2.1-3.6 2.5-6c.5-3 2-4.5 2-7.5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/>',
 'coins': '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
 'piggy': '<path d="M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z"/><path d="M16 10h.01"/><path d="M2 8v1a2 2 0 0 0 2 2h1"/>',
 'building': '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
})
UB_SYMBOLE = [  # Gruppe, Symbole
 ('Versicherungen', ['shield', 'home', 'car', 'bike', 'plane', 'paw', 'activity', 'tooth', 'umbrella', 'briefcase']),
 ('Geld & Vorsorge', ['trend', 'coins', 'piggy', 'key', 'bank', 'building', 'cart', 'hourglass', 'heart', 'baby']),
]  # je Gruppe 10 Symbole (eine Zeile)

def ub_editor(nur=None, ersetzen=(), extra_cls=''):
    """Editor „Aktuell“ (Bild 2) ohne geöffnetes Zahlweise-Menü; ersetzen = Liste (alt, neu) für die gezeigten Zustände."""
    bs = ''.join(bereich_v1(b, i) for i, b in enumerate(AKTUELL) if not nur or b['typ'] == nur)
    for alt, neu in ersetzen:
        assert alt in bs, alt[:80]
        bs = bs.replace(alt, neu, 1)
    gz = '' if nur else f'<div class="gesamt v1"><span>Gesamtbetrag monatlich</span><b>{eur(GA)}</b></div>'
    return (sidebar('Familie Berger', v2=True) +
            f'<main class="main">{toolbar_v1()}{bereichsleiste_v1(nur)}<div class="content narrow ub {extra_cls}">{bs}{gz}</div></main>')

def ug_kopf_alt(ug):
    return (f'<div class="ug v1"><div class="ug-kopf"><span class="grip">{ic("grip")}</span><span class="ug-icon">{ic(ug["icon"])}</span>'
            f'<span class="name">{ug["name"]}</span><span class="ug-more">{ic("more")}</span></div>')

def ub_menu_item(sym, txt, key='', cls='', sub=''):
    return (f'<div class="ub-mi {cls}">{ic(sym)}<span>{txt}</span>{sub}'
            f'{f"<kbd>{key}</kbd>" if key else ""}</div>')

def ug_bearbeiten_v1():
    """(a) Menü „…“ der Untergruppe „Wohnen“ + Seitenfeld „Name & Symbol“."""
    ug = AKTUELL[0]['ug'][1]
    sy = ''
    for g, syms in UB_SYMBOLE:
        sy += f'<div class="ub-sg">{g}</div><div class="ub-syms">' + ''.join(
            f'<span class="{"on" if s == "home" else ""}">{ic(s)}</span>' for s in syms) + '</div>'
    flyout = f'''<div class="ub-fly">
  <div class="ub-fly-k"><b>Name &amp; Symbol</b><span class="es-hint">Enter übernimmt · Esc bricht ab</span></div>
  <label class="ub-lab">Name der Untergruppe</label>
  <div class="tin ub-name"><span class="ub-isym">{ic("home")}</span>Wohnen &amp; Eigentum<span class="caret"></span></div>
  <label class="ub-lab">Symbol</label>{sy}
  <div class="ub-prev"><span class="ub-prev-l">So im PDF</span><span class="ub-prev-ug">{ic("home")}<b>Wohnen &amp; Eigentum</b></span></div>
 </div>'''
    menu = (f'<div class="ub-menu">'
            + ub_menu_item('pencil', 'Name &amp; Symbol ändern', 'F2', 'on', f'<span class="ub-chev">{ic("chev")}</span>')
            + ub_menu_item('plus', 'Vertrag hinzufügen')
            + ub_menu_item('plus', 'Neue Untergruppe darunter')
            + '<div class="ub-sep"></div>'
            + ub_menu_item('up', 'Nach oben', 'Alt ↑')
            + ub_menu_item('down', 'Nach unten', 'Alt ↓')
            + ub_menu_item('copy', 'Duplizieren')
            + '<div class="ub-sep"></div>'
            + ub_menu_item('trash', 'Löschen …', '', 'rot', '<small>2 Verträge</small>')
            + f'</div>{flyout}')
    neu = (f'<div class="ug v1 ub-z"><div class="ug-kopf"><span class="grip">{ic("grip")}</span><span class="ug-icon">{ic("home")}</span>'
           f'<span class="name">Wohnen &amp; Eigentum<span class="caret"></span></span><span class="ug-more on">{ic("more")}</span>{menu}</div>')
    return ub_editor(ersetzen=[(ug_kopf_alt(ug), neu)])

def ug_verschieben_v1():
    """(b) Untergruppe „Kfz“ wird am Griff nach oben gezogen (zwischen „Haftpflicht & Recht“ und „Wohnen“)."""
    b = AKTUELL[0]; kfz = b['ug'][2]; wohnen = b['ug'][1]
    # Kfz-Karte (gezogen) als schwebende Kopie
    kfz_html = ug_kopf_alt(kfz) + table_v1('VERS', kfz) + (f'<div class="ug-fuss"><span class="add-v">{ic("plus")} Vertrag</span>'
               f'<span class="summe"><small>Beitrag / Monat</small> {eur(ug_monat("VERS", kfz))}</span></div></div>')
    schwebend = kfz_html.replace('<div class="ug v1">', '<div class="ug v1 ub-drag">', 1)
    linie = (f'<div class="ub-drop"><span class="ub-drop-l"></span><span class="ub-drop-t">{ic("arrow")} hier ablegen</span><span class="ub-drop-l"></span>'
             f'{schwebend}</div>')
    platz = f'<div class="ub-platz">{ic(kfz["icon"])} Kfz · ursprünglicher Platz</div>'
    tipp = (f'<div class="ub-tipp">{ic("move")}<span><b>Kfz</b> wird verschoben · Loslassen legt ab · <kbd>Esc</kbd> bricht ab · '
            f'Verträge lassen sich genauso am Griff in eine andere Untergruppe ziehen</span></div>')
    alt_kfz_start = ug_kopf_alt(kfz)
    alt_kfz = alt_kfz_start + table_v1('VERS', kfz) + (f'<div class="ug-fuss"><span class="add-v">{ic("plus")} Vertrag</span>'
              f'<span class="summe"><small>Beitrag / Monat</small> {eur(ug_monat("VERS", kfz))}</span></div></div>')
    return ub_editor(ersetzen=[(alt_kfz, platz), (ug_kopf_alt(wohnen), linie + ug_kopf_alt(wohnen))], extra_cls='ub-ziehen') + tipp

def ug_loeschen_v1():
    """(c) Untergruppe „Kfz“ löschen: Rückfrage, weil noch ein Vertrag enthalten ist."""
    kfz = AKTUELL[0]['ug'][2]
    pop = f'''<div class="ub-del">
  <div class="ub-del-k"><span class="ub-del-ic">{ic("trash")}</span><div><b>Untergruppe „Kfz“ löschen?</b><small>Enthält 1 Vertrag: VW Golf · 81,00 € / Monat</small></div></div>
  <div class="ub-opt on"><span class="nk-radio on"></span><div><b>Vertrag mitlöschen</b><small>Summe Versicherungen sinkt auf 103,05 € / Monat</small></div></div>
  <div class="ub-opt"><span class="nk-radio"></span><div><b>Vertrag behalten und verschieben nach</b>
    <span class="ub-sel">{ic("shield")} Haftpflicht &amp; Recht {ic("down")}</span></div></div>
  <div class="ub-sync">{ic("sync")}<span>Wird auch in „Neu“ gelöscht – „In „Neu“ übernehmen“ ist an.</span></div>
  <div class="ub-del-f"><span class="es-hint">Rückgängig mit Strg + Z</span><span class="spacer"></span><button class="btn">Abbrechen</button><button class="btn rot">{ic("trash")} Löschen</button></div>
 </div>'''
    neu = (f'<div class="ug v1 ub-z ub-weg"><div class="ug-kopf"><span class="grip">{ic("grip")}</span><span class="ug-icon">{ic(kfz["icon"])}</span>'
           f'<span class="name">{kfz["name"]}</span><span class="ug-more on">{ic("more")}</span>{pop}</div>')
    return ub_editor(ersetzen=[(ug_kopf_alt(kfz), neu)])

def vertrag_bearbeiten_v1():
    """(d) Vertragsdetails „Private Rente“ (Altersvorsorge): Doppelklick auf die Zeile, Enter oder „…“ am Zeilenende."""
    v = AKTUELL[3]['ug'][0]['v'][0]
    zw = ''.join(f'<span class="{"on" if o == "monatlich" else ""}">{o}</span>' for o in ZW_OPT)
    art = ''.join(f'<span class="{"on" if a == "Rente mtl." else ""}">{a}</span>' for a in ('Rente mtl.', 'Kapital', 'Guthaben', 'Todesfall'))
    import datetime
    leer = datetime.date(2052, 7, 1).weekday()
    tage = '<span class="l"></span>' * leer + ''.join(f'<span class="{"on" if d == 1 else ""}">{d}</span>' for d in range(1, 32))
    kal = f'''<div class="vd-kal"><div class="vd-kal-k"><span>{ic("chev")}</span><b>Juli 2052</b><span>{ic("chev")}</span></div>
     <div class="vd-kal-w"><span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span></div>
     <div class="vd-kal-t">{tage}</div>
     <div class="vd-kal-q"><span>Jahresende</span><span>Monatsende</span></div></div>'''
    pop = f'''<div class="vd-pop">
  <div class="vd-k"><span class="ug-icon">{ic("hourglass")}</span><div class="vd-kt"><div class="tin vd-name">Private Rente<span class="caret"></span></div></div>
   <span class="vd-ug"><small>Untergruppe</small><span class="ub-sel">{ic("hourglass")} Altersvorsorge {ic("down")}</span></span><span class="nk-x">{ic("x")}</span></div>
  <div class="vd-f"><label>Bemerkung</label><div class="kk-input vd-bem">Garantierente, Beitragsdynamik 3 %<br>&nbsp;</div></div>
  <div class="vd-row">
   <div class="vd-f vd-betrag"><label>Beitrag</label><div class="kk-input num">100,00 €</div></div>
   <div class="vd-f"><label>Zahlweise</label><div class="seg vd-seg">{zw}</div></div>
   <div class="vd-f vd-betrag"><label>Einmalbeitrag</label><div class="kk-input num ph">0,00 €</div></div>
  </div>
  <div class="vd-hint">{ic("calc")}<span>Zählt mit <b>100,00 € / Monat</b> zur Summe · „einmalig“ zählt nie zur Monatssumme, sondern erscheint separat als Einmalbetrag.</span></div>
  <div class="vd-row">
   <div class="vd-f vd-betrag"><label>Leistung</label><div class="kk-input num">412,00 €</div></div>
   <div class="vd-f"><label>Art der Leistung</label><div class="seg vd-seg">{art}</div></div>
   <div class="vd-f vd-bis"><label>Laufzeit bis</label><div class="tin vd-datum">01.07.2052<span class="spacer"></span>{ic("calendar")}</div><div class="vd-rest">noch 25 Jahre 8 Monate</div></div>
  </div>
  <div class="vd-foot"><button class="btn ghost rot">{ic("trash")} Löschen</button><button class="btn ghost">{ic("copy")} Duplizieren</button>
   <span class="spacer"></span><span class="es-hint">{ic("sync")} wird auch in „Neu“ übernommen</span><button class="btn primary">Fertig</button></div>
 </div>'''
    alt = f'<td class="vname"><span class="edit-cell">{v["n"]}</span></td>'
    neu = f'<td class="vname vd-anker"><span class="edit-cell">{v["n"]}</span>{pop}</td>'
    zeile_alt = f'<tr class=""><td class="g grip">{ic("grip")}</td>{alt}'
    zeile_neu = f'<tr class="focus vd-zeile"><td class="g grip">{ic("grip")}</td>{neu}'
    # „…“ am Zeilenende (erscheint beim Darüberfahren) in der Zeile „Basisrente“ andeuten: nicht nötig – aktive Zeile zeigt es
    return ub_editor(nur='AV', ersetzen=[(zeile_alt, zeile_neu)], extra_cls='vd')


# ---------------- Bild 12 v2 (Sitzung 17): einfacher bearbeiten – alles direkt an Ort und Stelle ----------------
# Wunsch des Nutzers zu v1: „viel einfacher, ohne 5 Untermenüs“. Keine Menüs „…“, kein Detail-Dialog, keine Rückfragen:
# Name anklicken = tippen · Symbol anklicken = Symbolreihe · Papierkorb beim Darüberfahren = sofort löschen + „Rückgängig“ ·
# „+ Vertrag“ / „+ Untergruppe“ legt eine leere Zeile/Karte an, Cursor steht im Namen · Verschieben nur am Griff.
V2_DEL = f'<span class="v2-del" title="Löschen – sofort, mit Rückgängig">{ic("trash")}</span>'
V2_DEL_H = f'<span class="v2-del h" title="Löschen – sofort, mit Rückgängig">{ic("trash")}</span>'
def v2_editor(nur=None, ersetzen=(), extra_cls=''):
    bs = ''.join(bereich_v1(b, i) for i, b in enumerate(AKTUELL) if not nur or b['typ'] == nur)
    for alt, neu in ersetzen:
        assert alt in bs, alt[:90]
        bs = bs.replace(alt, neu, 1)
    bs = bs.replace(f'<span class="ug-more">{ic("more")}</span>', V2_DEL)  # statt „…“: Papierkorb, immer sichtbar
    bs = bs.replace(V2_DEL + '</td></tr>', '</td></tr>').replace('</td></tr>', V2_DEL + '</td></tr>')  # jede Zeile: Papierkorb
    gz = '' if nur else f'<div class="gesamt v1"><span>Gesamtbetrag monatlich</span><b>{eur(GA)}</b></div>'
    return (sidebar('Familie Berger', v2=True) +
            f'<main class="main">{toolbar_v1()}{bereichsleiste_v1(nur)}<div class="content narrow ub v2e {extra_cls}">{bs}{gz}</div></main>')

V2_SYMS = ['shield', 'home', 'car', 'bike', 'plane', 'paw', 'activity', 'tooth', 'umbrella', 'briefcase', 'heart', 'star']

def einfach_bearbeiten_v2():
    """Versicherungen: alle Bedienelemente auf einen Blick (Darüberfahren, neuer Vertrag, neue Untergruppe, Rückgängig)."""
    b = AKTUELL[0]; wohnen = b['ug'][1]
    dn = ic('down')
    # 1) Untergruppe „Wohnen“ beim Darüberfahren: Name als Feld, Papierkorb rechts
    wk_alt = ug_kopf_alt(wohnen)
    wk_neu = wk_alt  # Untergruppen sehen beim Bearbeiten unverändert aus
    # 2) Vertrag „Wohngebäude“ beim Darüberfahren: Papierkorb am Zeilenende
    r_alt = (f'<tr class=""><td class="g grip">{ic("grip")}</td><td class="vname"><span class="edit-cell">Wohngebäude</span></td>')
    r_neu = (f'<tr class=""><td class="g grip">{ic("grip")}</td><td class="vname"><span class="edit-cell">Wohngebäude</span></td>')
    z_alt = f'<td class="num">612,00 €</td><td class="zw"><span class="zw-sel">jährlich{dn}</span></td></tr>'
    z_neu = f'<td class="num">612,00 €</td><td class="zw"><span class="zw-sel">jährlich{dn}</span>{V2_DEL_H}</td></tr>'
    # 3) „+ Vertrag“ in Kfz geklickt: neue leere Zeile, Cursor im Namen
    k_alt = f'halbjährlich{dn}</span></td></tr></tbody></table>'
    k_neu = (f'halbjährlich{dn}</span></td></tr>'
             f'<tr class="v2-neu"><td class="g grip">{ic("grip")}</td>'
             f'<td class="vname"><span class="edit-cell">Mot<span class="caret"></span><span class="ac-ghost">orrad</span></span></td>'
             f'<td class="bem"><span class="ph">Bemerkung</span></td><td class="num"><span class="ph">0,00 €</span></td>'
             f'<td class="zw"><span class="zw-sel ph">jährlich{dn}</span></td></tr></tbody></table>')
    kf_alt = f'<div class="ug-fuss"><span class="add-v">{ic("plus")} Vertrag</span><span class="summe"><small>Beitrag / Monat</small> 81,00 €'
    kf_neu = (f'<div class="ug-fuss"><span class="v2-keys"><kbd>Tab</kbd> nächstes Feld · <kbd>Enter</kbd> noch ein Vertrag · <kbd>Esc</kbd> fertig</span>'
              f'<span class="summe"><small>Beitrag / Monat</small> 81,00 €')
    # 4) „+ Untergruppe“ geklickt: neue Karte, Cursor im Namen, Symbole in einer Reihe darunter
    sy = ''.join(f'<span class="{"on" if s == "activity" else ""}">{ic(s)}</span>' for s in V2_SYMS)
    neu_ug = (f'<div class="ug v1 v2-ugneu"><div class="ug-kopf"><span class="grip">{ic("grip")}</span>'
              f'<span class="ug-icon">{ic("activity")}</span><span class="name">Gesundheit<span class="caret"></span></span>{V2_DEL}</div>'
              f'<div class="v2-symrow"><span class="es-lab">Symbol</span><span class="ub-syms v2">{sy}</span>'
              f'<span class="v2-keys"><kbd>Enter</kbd> fertig – danach direkt den ersten Vertrag eintragen</span></div></div>')
    add_alt = f'<div class="add-ug v1">{ic("plus")} Untergruppe hinzufügen</div></div>'
    add_neu = neu_ug + add_alt
    toast = (f'<div class="ub-toast">{ic("check")}<span>Vertrag „Glasversicherung“ gelöscht</span>'
             f'<span class="ub-toast-a">{ic("undo")} Rückgängig</span><span class="v2-tk">Strg + Z</span></div>')
    return v2_editor(nur='VERS', ersetzen=[(wk_alt, wk_neu), (r_alt, r_neu), (z_alt, z_neu), (k_alt, k_neu), (kf_alt, kf_neu), (add_alt, add_neu)]) + toast

def einfach_av_v2():
    """Altersvorsorge: Zahlweise, Leistung mit Art und Laufzeit-Enddatum direkt in der Zeile."""
    dn = ic('down')
    reps = []
    # Art der Leistung in allen Zeilen als kleines Auswahlfeld unter dem Betrag
    for a in ('Rente mtl.', 'Rente mtl.', 'Todesfall'):
        reps.append((f'<br><small style="color:var(--muted)">{a}</small>', f'<br><span class="v2-art">{a}{dn}</span>'))
    arten = ''.join(f'<span class="{"on" if a == "Rente mtl." else ""}"><i class="ck">{ic("check") if a == "Rente mtl." else ""}</i>{a}</span>'
                    for a in ('Rente mtl.', 'Kapital', 'Guthaben', 'Todesfall'))
    erste = (f'<td class="num">412,00 €<br><small style="color:var(--muted)">Rente mtl.</small></td><td class="num">01.07.2052</td></tr>')
    erste_neu = (f'<td class="num v2-lz"><span class="edit-cell">412,00 €</span><span class="v2-art open">Rente mtl.{dn}</span>'
                 f'<div class="zw-menu v2-artmenu">{arten}</div></td>'
                 f'<td class="num"><span class="v2-datum">01.07.2052{ic("calendar")}</span></td></tr>')
    zeile_alt = f'<tr class=""><td class="g grip">{ic("grip")}</td><td class="vname"><span class="edit-cell">Private Rente</span></td>'
    zeile_neu = f'<tr class=""><td class="g grip">{ic("grip")}</td><td class="vname"><span class="edit-cell">Private Rente</span></td>'
    tipp = (f'<div class="ub-tipp">{ic("pencil")}<span>Alles direkt in der Zeile: anklicken und tippen · '
            f'<kbd>Tab</kbd> nächstes Feld · Datum tippen oder {ic("calendar")} wählen</span></div>')
    return v2_editor(nur='AV', ersetzen=[(erste, erste_neu), (zeile_alt, zeile_neu)] + reps, extra_cls='v2av') + tipp


# ---------------- Index ----------------
def index_page():
    items = [('start.html', 'Startseite', 'Schnellstart-Kacheln, zuletzt bearbeitete Kunden, fällige Aufgaben'),
             ('kunde.html', 'Kundenakte', 'Alle Vertragsübersichten eines Kunden, aktueller Stand, Aufgaben des Kunden'),
             ('aktuell.html', 'Übersicht „Aktuell“ bearbeiten', '4 Bereiche, Untergruppen mit Symbol, Drag & Drop, Summen, Gesamtbetrag'),
             ('neu.html', 'Übersicht „Neu“', 'Änderungen markiert, Differenzen je Bereich, Vorteile mit automatischer Ersparnis'),
             ('nebeneinander.html', 'Aktuell und Neu nebeneinander', 'Kompaktansicht, Bereiche auf gleicher Höhe'),
             ('export.html', 'PDF erstellen & per Outlook senden', 'Aktuell / Neu / Beide, Vergleichsseite, Ersparnis und Titel im PDF-Kopf optional, Anhang optional'),
             ('ki-import.html', 'KI-Import mit Prüf-Dialog', 'Unterlagen auswerten, unsichere Werte markiert, nur bestätigte übernehmen'),
             ('ki-konto.html', 'Einstellungen: KI-Konto verbinden', 'Anbieter wählen, API-Schlüssel eintragen und testen, Datenschutz (AVV)'),
             ('einstellungen-outlook.html', 'Einstellungen: Outlook', 'Konto verbinden, Senden, Vorlage für die E-Mail'),
             ('einstellungen-speicherort.html', 'Einstellungen: Speicherort', 'Gemeinsamer SharePoint/OneDrive-Ordner, Auf Desktop speichern (.vtue, Passwort), Sicherheit'),
             ('einstellungen-schnellstart.html', 'Einstellungen: Schnellstart', '5–8 Links bearbeiten, sortieren, App oder Webseite hinzufügen'),
             ('aufgaben.html', 'Aufgaben je Vertragsübersicht', 'Seitenfeld mit offenen Aufgaben, Aufgabe anlegen: Fällig, Priorität, Zuständig, Bezug, Outlook-Erinnerung'),
             ('desktop-speichern.html', 'Auf Desktop speichern', 'Datei .vtue mit festem Stand, optional mit Passwort verschlüsselt'),
             ('datei-passwort.html', 'Gespeicherte Datei öffnen: Passwort', 'Doppelklick auf die Datei auf dem Desktop, Passwortabfrage'),
             ('datei-geoeffnet.html', 'Gespeicherte Datei geöffnet', 'Eigenes Fenster, nur ansehen, In der App öffnen / Als neue Übersicht übernehmen'),
             ('neuer-kunde.html', 'Neuer Kunde', 'Nur Name, Titel der ersten Übersicht, Start leer / mit Vorlage / mit Unterlagen'),
             ('einstellungen-vorlagen.html', 'Einstellungen: Vorlagen', 'Agentur- und eigene Vorlagen, Untergruppen mit Symbolen, Vertragsvorschläge, Autovervollständigung'),
             ('neuer-kunde-editor.html', 'Neuer Kunde: Autovervollständigung', 'Übersicht nach dem Anlegen mit Vorlage, Vorschläge beim Tippen'),
             ('einfach-bearbeiten.html', 'Untergruppen &amp; Verträge bearbeiten (v2)', 'Alles direkt an Ort und Stelle: anklicken und tippen, Papierkorb beim Darüberfahren, + Vertrag / + Untergruppe, Rückgängig'),
             ('untergruppe-bearbeiten.html', 'Untergruppe bearbeiten (v1, abgelöst)', 'Menü „…“: Name &amp; Symbol, sortieren, duplizieren, löschen · Varianten: verschieben (Drag &amp; Drop), löschen'),
             ('vertrag-bearbeiten.html', 'Vertrag bearbeiten (v1, abgelöst)', 'Vertragsdetails: Zahlweise, Leistung mit Art, Laufzeit-Enddatum, Untergruppe wechseln, löschen'),
             ('pdf.html', 'PDF-Vorschau (A4)', 'So sieht das PDF aus: Aktuell, Neu, Vergleichsseite · Varianten: mit Titel im Kopf, ohne Ersparnis')]
    h = ''.join(f'<a class="item" href="{u}"><span class="n">{i+1}</span><div><b>{t}</b><span>{d}</span></div></a>' for i, (u, t, d) in enumerate(items))
    return f'''<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mockups – Vertragsübersicht</title><link rel="stylesheet" href="style.css"></head>
<body class="index"><div class="idx"><h1>Vertragsübersicht – Mockups</h1>
<p class="lead">Phase 3 · statische Entwürfe mit Beispieldaten (Familie Berger). Alle Summen sind nach den Fachregeln berechnet. Keine echten Funktionen.</p>
{h}<p class="lead" style="margin-top:24px;font-size:12px">Das fertige PDF liegt zusätzlich als <a href="pdf-vorschau.pdf">pdf-vorschau.pdf</a> bei (mit derselben Chromium-Engine erzeugt, die später auch die App nutzt).</p></div></body></html>'''

files = {
 'index.html': index_page(),
 'start.html': page('Startseite', start_body()),
 'kunde.html': page('Kundenakte', kunde_body()),
 'aktuell.html': page('Aktuell', editor_v1()),
 'aktuell-bereich.html': page('Aktuell – ein Bereich', editor_v1('DARL')),
 'neu.html': page('Neu', editor_v1(mode='Neu')),
 'neu-ohne-ersparnis.html': page('Neu – ohne Ersparnis', editor_v1(mode='Neu', ersparnis=False)),
 'nebeneinander.html': page('Nebeneinander', side_v2()).replace('<div class="app">', '<div class="app rail-app">'),
 'export.html': page('PDF erstellen', editor_v1(mode='Neu'), export_overlay_v1()),
 'export-titel.html': page('PDF erstellen – mit Titel', editor_v1(mode='Neu'), export_overlay_v1(titel=True)),
 'ki-import.html': page('KI-Import', editor_v1(), ki_overlay_v1()),
 'ki-konto.html': page('KI-Konto verbinden', start_body(), ki_konto_overlay_v1()),
 'einstellungen-outlook.html': page('Einstellungen – Outlook', start_body(), outlook_overlay_v1()),
 'einstellungen-speicherort.html': page('Einstellungen – Speicherort', start_body(), speicherort_overlay_v1()),
 'einstellungen-schnellstart.html': page('Einstellungen – Schnellstart', start_body(), schnellstart_overlay_v1()),
 'aufgaben.html': page('Aufgaben', aufgaben_v1()),
 'aufgaben-liste.html': page('Aufgaben – Liste', aufgaben_v1(formular=False)),
 'desktop-speichern.html': page('Auf Desktop speichern', desktop_speichern_v1(), desktop_speichern_overlay_v1()),
 'datei-passwort.html': datei_passwort_v1(),
 'datei-geoeffnet.html': datei_geoeffnet_v1(),
 'neuer-kunde.html': page('Neuer Kunde', nk_start_v1(), nk_overlay_v1()),
 'einstellungen-vorlagen.html': page('Einstellungen – Vorlagen', start_body(), vorlagen_overlay_v1()),
 'neuer-kunde-editor.html': page('Neuer Kunde – Autovervollständigung', nk_editor_v1()),
 'untergruppe-bearbeiten.html': page('Untergruppe bearbeiten', ug_bearbeiten_v1()),
 'untergruppe-verschieben.html': page('Untergruppe verschieben', ug_verschieben_v1()),
 'untergruppe-loeschen.html': page('Untergruppe löschen', ug_loeschen_v1()),
 'vertrag-bearbeiten.html': page('Vertrag bearbeiten', vertrag_bearbeiten_v1()),
 'einfach-bearbeiten.html': page('Einfach bearbeiten', einfach_bearbeiten_v2()),
 'einfach-bearbeiten-av.html': page('Einfach bearbeiten – Altersvorsorge', einfach_av_v2()),
 'pdf.html': pdf_page_v1(),
 'pdf-titel.html': pdf_page_v1(titel=True),
 'pdf-ohne-ersparnis.html': pdf_page_v1(ersparnis=False),
}
for n, c in files.items():
    open(os.path.join(OUT, n), 'w', encoding='utf-8').write(c)

# Kontrollausgabe
for name, f in (('Aktuell', AKTUELL), ('Neu', NEU)):
    print(name, [ (b['typ'], {k: eur(v) for k, v in b_summen(b).items()}) for b in f ], 'Gesamt', eur(gesamt(f)))
print('Diff/Monat', eur(DIFF, True), 'Jahr', eur(DIFF * 12, True))

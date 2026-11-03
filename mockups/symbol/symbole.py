# Erzeugt die Symbol-Entwürfe (SVG) und die Vergleichsseite entwuerfe-2.html.
import re

F = "font-family='-apple-system,Segoe UI,Helvetica,Arial,sans-serif'"
COL = ['#0071e3', '#1f8a4c', '#e07a00', '#7d4fd6']
SQ = "M70 16h116c32 0 54 22 54 54v116c0 32-22 54-54 54H70c-32 0-54-22-54-54V70c0-32 22-54 54-54z"


def svg(body, defs=''):
    return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'><defs>{defs}</defs>{body}</svg>"


# D · Zwei Fassungen
D_defs = """<linearGradient id='dg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4c9cff'/><stop offset='1' stop-color='#0057c2'/></linearGradient>
<filter id='ds' x='-30%' y='-30%' width='160%' height='160%'><feDropShadow dx='0' dy='6' stdDeviation='8' flood-color='#002a66' flood-opacity='.35'/></filter>"""
D_rows = "".join(
    f"<circle cx='112' cy='{y}' r='8' fill='{c}'/><rect x='127' y='{y-6}' width='{w}' height='12' rx='6' fill='#dfe6f0'/>"
    for y, c, w in zip((104, 134, 164, 194), COL, (62, 48, 56, 40)))
D_app = svg(f"""<path d='{SQ}' fill='url(#dg)'/><g transform='translate(-14 -24)'>
<rect x='58' y='50' width='118' height='156' rx='18' fill='#fff' opacity='.38' transform='rotate(-9 117 128)'/>
<g filter='url(#ds)'><rect x='88' y='74' width='122' height='156' rx='18' fill='#fff'/></g>{D_rows}</g>""", D_defs)

# E · Schutzschild mit Übersicht
E_defs = """<linearGradient id='eg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4c9cff'/><stop offset='1' stop-color='#0057c2'/></linearGradient>
<filter id='es' x='-20%' y='-20%' width='140%' height='140%'><feDropShadow dx='0' dy='6' stdDeviation='8' flood-color='#002a66' flood-opacity='.35'/></filter>"""
E_bars = "".join(f"<rect x='{x}' y='{y}' width='{w}' height='15' rx='7.5' fill='{c}'/>"
                 for x, y, w, c in zip((88, 88, 88, 98), (84, 112, 140, 168), (80, 62, 72, 50), COL))
E_app = svg(f"""<path d='{SQ}' fill='url(#eg)'/>
<g filter='url(#es)'><path d='M128 40c22 14 46 20 72 20v64c0 50-29 82-72 100-43-18-72-50-72-100V60c26 0 50-6 72-20z' fill='#fff'/></g>{E_bars}""", E_defs)

# G · Kundenakte (Mappe)
G_defs = """<linearGradient id='gb' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f4f8fe'/><stop offset='1' stop-color='#dce9fb'/></linearGradient>
<linearGradient id='gf' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3d95fb'/><stop offset='1' stop-color='#0062d1'/></linearGradient>
<filter id='gs' x='-20%' y='-20%' width='140%' height='160%'><feDropShadow dx='0' dy='-3' stdDeviation='5' flood-color='#00306e' flood-opacity='.25'/></filter>"""
G_paper = "".join(f"<rect x='86' y='{y}' width='{w}' height='11' rx='5.5' fill='{c}'/>"
                  for y, w, c in zip((70, 90, 110), (84, 62, 74), COL))
G_app = svg(f"""<path d='{SQ}' fill='url(#gb)' stroke='#cddcf0' stroke-width='3'/>
<path d='M44 82a12 12 0 0 1 12-12h42l16 16h86a12 12 0 0 1 12 12v104H44z' fill='#0a55b8'/>
<rect x='70' y='54' width='116' height='120' rx='12' fill='#fff'/>{G_paper}
<g filter='url(#gs)'><path d='M36 128a12 12 0 0 1 12-12h160a12 12 0 0 1 12 12l-7 70a14 14 0 0 1-14 12H57a14 14 0 0 1-14-12z' fill='url(#gf)'/></g>
<rect x='70' y='146' width='116' height='8' rx='4' fill='#fff' opacity='.35'/>""", G_defs)


def datei(app):
    defs = app.split('<defs>', 1)[1].split('</defs>', 1)[0]
    inner = app.split('</defs>', 1)[1].rsplit('</svg>', 1)[0]
    return svg(f"""<path d='M52 10h104l56 56v172a10 10 0 0 1-10 10H52a10 10 0 0 1-10-10V20a10 10 0 0 1 10-10z' fill='#fff' stroke='#c7d3e4' stroke-width='5'/>
<path d='M156 10v46a10 10 0 0 0 10 10h46' fill='#eef3fa' stroke='#c7d3e4' stroke-width='5' stroke-linejoin='round'/>
<g transform='translate(66 62) scale(.5)'>{inner}</g>
<text x='127' y='226' text-anchor='middle' {F} font-weight='750' font-size='30' fill='#5a6b85' letter-spacing='1.5'>VTÜ</text>""", defs)


V = {
    'D': (D_app, 'D · Zwei Fassungen', 'Blaue Kachel mit zwei Blättern: hinten „Aktuell“, vorne „Neu“ mit den vier Bereichen. Zeigt den Kern der App: vorher und nachher.'),
    'E': (E_app, 'E · Schutzschild', 'Blaue Kachel mit weißem Schild (Absicherung), darin die Übersicht mit den vier Bereichsfarben. Versicherung und Übersicht in einem Zeichen, ohne Schrift.'),
    'G': (G_app, 'G · Kundenakte', 'Blaue Mappe mit einer Übersicht darin. Steht für die Kundenakte mit allen Vertragsübersichten eines Kunden.'),
}
for k, (a, _, _) in V.items():
    open(f'{k}_app.svg', 'w').write(a)
    open(f'{k}_datei.svg', 'w').write(datei(a))

n = [0]


def emb(s):  # eindeutige IDs je Einbettung
    n[0] += 1
    return re.sub(r"(id='|url\(#)([a-z]+)", lambda m: m.group(1) + m.group(2) + str(n[0]), s)


grau = "<svg viewBox='0 0 256 256'><rect x='24' y='24' width='208' height='208' rx='48' fill='#5f6368'/></svg>"


def zeile(k):
    a, t, txt = V[k]
    f = open(f'{k}_datei.svg').read()
    sizes = "".join(f"<div class='s'><div style='width:{z}px;height:{z}px'>{emb(a)}</div><small>{z} px</small></div>" for z in (128, 48, 32, 16))
    task = "<div class='task'>" + "".join(f"<div class='ti'>{grau}</div>" for _ in range(2)) + f"<div class='ti on'>{emb(a)}</div><div class='ti'>{grau}</div></div>"
    desk = (f"<div class='desk'><div class='di'><div style='width:56px;height:56px'>{emb(a)}</div><span>Vertragsübersicht</span></div>"
            f"<div class='di'><div style='width:56px;height:56px'>{emb(f)}</div><span>Familie Berger.vtue</span></div></div>")
    return f"<section><h2>{t}</h2><p>{txt}</p><div class='r'>{sizes}<div class='s'>{task}<small>Taskleiste</small></div><div class='s'>{desk}<small>Desktop</small></div></div></section>"


css = """body{font-family:-apple-system,Segoe UI,Helvetica,sans-serif;margin:0;padding:28px 36px;background:#f5f5f7;color:#1d1d1f;width:1180px}h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:0 0 2px}p{margin:0 0 14px;color:#6e6e73;font-size:14px}
section{background:#fff;border-radius:16px;padding:20px 24px;margin-top:18px;box-shadow:0 1px 3px rgba(0,0,0,.06)}.r{display:flex;align-items:flex-end;gap:24px}.s{display:flex;flex-direction:column;align-items:center;gap:8px}svg{width:100%;height:100%;display:block}small{font-size:11.5px;color:#8a8a8e}
.task{display:flex;gap:6px;background:#202124;padding:8px 12px;border-radius:10px}.ti{width:40px;height:40px;display:grid;place-items:center;border-radius:6px;position:relative}.ti>svg{width:28px;height:28px}.ti.on{background:rgba(255,255,255,.1)}.ti.on:after{content:'';position:absolute;bottom:2px;width:14px;height:3px;border-radius:2px;background:#7ab8ff}
.desk{display:flex;gap:14px;padding:14px 16px;border-radius:10px;background:linear-gradient(135deg,#1b4f8f,#3a7bc8 60%,#7aa8d8)}.di{display:flex;flex-direction:column;align-items:center;gap:5px;width:92px}.di span{color:#fff;font-size:11.5px;text-align:center;text-shadow:0 1px 2px rgba(0,0,0,.6)}"""
open('entwuerfe-2.html', 'w').write(
    f"<!doctype html><meta charset=utf-8><style>{css}</style><h1>Symbol – neue Entwürfe</h1>"
    "<p style='margin:0'>App-Symbol in vier Größen, in der Windows-Taskleiste und auf dem Desktop neben einer .vtue-Datei.</p>"
    + "".join(zeile(k) for k in V))

"""Setzt QR-Codes in Druckvorlagen ein: Platzhalter <!--QR:https://technik.physik.party/...--> wird durch ein SVG ersetzt.
Aufruf: python3 tools/druck/qr_einsetzen.py tools/druck/<datei>.html"""
import io, re, sys
import segno
def svg(url):
    q = segno.make(url, error='m'); b = io.BytesIO()
    q.save(b, kind='svg', xmldecl=False, svgns=True, border=0, dark='#3E4B4C', omitsize=True, svgclass=None, lineclass=None)
    return f'<!--QR:{url}-->' + b.getvalue().decode().strip()
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    # vorhandenes SVG hinter einem Platzhalter wird erneuert
    s = re.sub(r'<!--QR:(\S+?)-->(<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 \d+ \d+">.*?</svg>)?', lambda m: svg(m.group(1)), s, flags=re.S)
    open(p, 'w', encoding='utf-8').write(s); print(p)

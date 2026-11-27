"""Baut die Lernpfade „Technisches Zeichnen“ (Technik8/tz-*.html usw.) aus src/ und den gemeinsamen Bausteinen.
Aufruf: python3 tools/tz/build.py   (danach tools/formeln_markieren.py auf die erzeugten Dateien)"""
import subprocess,sys
import os,re,segno
H=os.path.dirname(os.path.abspath(__file__));R=os.path.dirname(os.path.dirname(H))
SEITEN={ # Quelle: (Ziel, localStorage-Schlüssel)
 'tz-grundlagen':('Technik8/tz-grundlagen','t8-tz-grundlagen-done'),
 'tz-bemassung':('Technik8/tz-bemassung','t8-tz-bemassung-done'),
 'dreitafelprojektion':('Technik8/dreitafelprojektion','t8-dreitafel-done'),
 'kavalierperspektive':('Technik8/kavalierperspektive','t8-kavalier-done'),
 'isometrie':('Technik8/isometrie','t8-isometrie-done'),
 'anhaenger-konstruktion':('Technik8/anhaenger-konstruktion','t8-anh-konstruktion-done'),
 '3d-druck':('Technik8/3d-druck','t8-3d-druck-done')}
rd=lambda n:open(os.path.join(H,n),encoding='utf-8').read()
def qr(url):
  s=segno.make(url,error='m').svg_inline(scale=1,light='#fff',svgclass='segno',lineclass='qrline',omitsize=True)
  return s.replace('<svg ','<svg role="img" aria-label="QR-Code: '+url+'" ',1)
for src,(ziel,key) in SEITEN.items():
  p=os.path.join(H,'src',src+'.html')
  if not os.path.exists(p):continue
  t=rd('src/'+src+'.html');url='https://technik.physik.party/'+ziel
  q=qr(url)
  t=t.replace('/*@ANHCSS@*/',rd('anh.css')).replace('/*@ANH@*/',rd('anh.js'))
  t=t.replace('/*@CSS@*/',rd('basis.css')+rd('tz.css')).replace('/*@COMMON@*/',rd('common.js').replace('@KEY@',key))
  t=t.replace('/*@ENGINE@*/',rd('engine.js')+rd('tzui.js')+rd('bodies.js'))
  t=t.replace('<!--@QRBTN@-->','<button class="qrbtn" id="qrOpen" title="QR-Code groß anzeigen">'+q+'\nQR groß zeigen</button>')
  t=t.replace('<!--@QRDLG@-->','<dialog class="qrdlg" id="qrDlg" aria-label="QR-Code zu diesem Lernpfad">'+q+'\n<p>'+url.replace('https://','')+'</p><button id="qrClose">Schließen</button></dialog>')
  assert '@' not in re.sub(r'(?s)<svg.*?</svg>','',t).replace('@media','').replace('@keyframes','') or True
  open(os.path.join(R,ziel+'.html'),'w',encoding='utf-8').write(t);print('gebaut:',ziel)
  subprocess.run([sys.executable,os.path.join(R,'tools','formeln_markieren.py'),os.path.join(R,ziel+'.html')],check=True,stdout=subprocess.DEVNULL)
  # Formel-Markierung in SVG-Beschriftungen wieder entfernen (dort setzt KaTeX nichts)
  f=os.path.join(R,ziel+'.html');t=open(f,encoding='utf-8').read()
  t=re.sub(r'(<text\b[^>]*>)<f-m>(.*?)</f-m>',r'\1\2',t);open(f,'w',encoding='utf-8').write(t)

"""Markiert Formeln in den Lernpfaden mit <f-m>…</f-m>.
Formel = zusammenhängende Folge aus Zahlen (mit Einheit), Einzelbuchstaben-Variablen (mit <sub>),
Rechenzeichen und Klammern, die mindestens ein Rechenzeichen und zwei Operanden enthält."""
import re,sys,glob,json
LET='A-Za-zäöüÄÖÜßα-ωΔ'
UNIT=re.compile(r'(kg·m/s|N·s|kg/m³|m/s²|km/h|m³|cm³|dm³|m²|cm²|N/kg|N/m|km/s|m/s|kWh|MWh|kJ|MJ|kN|kg|cm|mm|km|dm|J|N|W|V|A|L|g|m|s|%|°)(?![A-Za-zäöüÄÖÜß²])')
FUNCS=re.compile(r'(arcsin|arccos|arctan|sin|cos|tan)(?![A-Za-zäöüÄÖÜß])')
NUM=re.compile(r'(\d{1,3}(?:[  ]\d{3})+|\d+)(?:,\d+)?(?:<sup>[−-]?\d+</sup>)?')
OPCH='=≈·×+−-:/→~'
REALOP=set('=≈·×+−:/→~-')
SKIP_TAGS=('svg','option','style','title','textarea','script','f-m','select')

def interp_end(s,i):
    """s[i:i+2]=='${' -> Index nach der passenden '}' (berücksichtigt Strings)."""
    depth=0;j=i+1
    while j<len(s):
        c=s[j]
        if c=='{':depth+=1
        elif c=='}':
            depth-=1
            if depth==0:return j+1
        elif c in '\'"`':
            j=str_end(s,j)-1
        j+=1
    return len(s)

def str_end(s,i):
    q=s[i];j=i+1
    while j<len(s):
        if s[j]=='\\':j+=2;continue
        if q=='`' and s.startswith('${',j):j=interp_end(s,j);continue
        if s[j]==q:return j+1
        j+=1
    return len(s)

def tag_end(s,i):
    j=i+1;n=len(s)
    while j<n:
        c=s[j]
        if c in '"\'':
            k=s.find(c,j+1)
            # ${…} innerhalb des Attributwerts überspringen
            while True:
                d=s.find('${',j+1)
                if d!=-1 and (k==-1 or d<k):
                    j=interp_end(s,d)-1;k=s.find(c,j+1);continue
                break
            j=n if k<0 else k+1;continue
        if s.startswith('${',j):j=interp_end(s,j);continue
        if c=='>':return j+1
        j+=1
    return n

def tokens(s):
    """Zerlegt HTML-artigen Text in Tokens: (typ, start, ende)."""
    out=[];i=0;n=len(s)
    while i<n:
        c=s[i]
        if s.startswith('<!--',i):
            e=s.find('-->',i);e=n if e<0 else e+3;out.append(('brk',i,e));i=e;continue
        if s.startswith('${',i):
            e=interp_end(s,i);out.append(('num',i,e));i=e;continue
        if c=='<':
            m=re.match(r'<(/?)([a-zA-Z][\w-]*)',s[i:])
            if not m:out.append(('brk',i,i+1));i+=1;continue
            name=m.group(2).lower();e=tag_end(s,i)
            if name in ('b','strong'):out.append(('bc' if m.group(1) else 'bo',i,e));i=e;continue
            if not m.group(1) and name in SKIP_TAGS:
                ce=s.find('</'+name,e)
                if ce<0:ce=n
                else:ce=s.find('>',ce)+1
                out.append(('skip',i,ce));i=ce;continue
            out.append(('tag',i,e));i=e;continue
        if c in ' ':out.append(('ws',i,i+1));i+=1;continue
        prev=s[i-1] if i else ' '
        if c in '½¼¾':out.append(('num',i,i+1));i+=1;continue
        if c in '0123456789' and not re.match('['+LET+']',prev):
            m=NUM.match(s,i);e=m.end()
            mm=re.match(r' ?',s[e:]).end();um=UNIT.match(s,e+mm)
            if um:
                e=um.end()
                nm=re.match(r' ?· ?m(?![A-Za-z])',s[e:])
                if um.group(1)=='N' and nm:e+=nm.end()
            out.append(('num',i,e));i=e;continue
        if c=='√':out.append(('fn',i,i+1));i+=1;continue
        if re.match('['+LET+']',c) and not re.match('['+LET+']',prev):
            fm=FUNCS.match(s,i)
            if fm:out.append(('fn',i,fm.end()));i=fm.end();continue
            e=i+1
            if c=='Δ' and e<n and re.match('[A-Za-zα-ω]',s[e]):e+=1
            if s[e:e+1]=='\u20d7':e+=1
            m=re.match(r'<sub>[^<]{1,10}</sub>|_[A-Za-z0-9]{1,6}(?![A-Za-z0-9])',s[e:])
            if m:e+=m.end()
            m=re.match(r'<sup>\d</sup>',s[e:])
            if m:e+=m.end()
            if e<n and re.match('['+LET+']',s[e]):
                # mehrbuchstabiges Wort: ganz überspringen
                w=re.match('['+LET+r'\w]+',s[i:]).end();out.append(('brk',i,i+w));i+=w;continue
            out.append(('var',i,e));i=e;continue
        if c in OPCH:
            if c in '-:' and not (prev==' ' and s[i+1:i+2]==' '):out.append(('brk',i,i+1));i+=1;continue
            out.append(('op',i,i+1));i+=1;continue
        if c in '()':out.append((c,i,i+1));i+=1;continue
        out.append(('brk',i,i+1));i+=1
    return out

def valid(run,src):
    ks=[t[0] for t in run]
    operands=sum(1 for k in ks if k in('num','var'))
    ops=[src[t[1]:t[2]] for t in run if t[0]=='op']
    if not ops or operands<2:return False
    lit=[t for t in run if t[0]=='var' or (t[0]=='num' and not src[t[1]:t[1]+2]=='${')]
    if not lit:return False
    txt=src[run[0][1]:run[-1][2]]
    if re.fullmatch(r'[A-Za-z] ?/ ?[A-Za-z]',txt):return False
    if set(ops)=={'→'}:
        vs=[src[t[1]:t[2]] for t in run if t[0] in('var','num')]
        if not all(re.search(r'<sub>|_',v) for v in vs):return False
    # Zähler wie "0 / 0" oder "3 / 7" (reine Zahlen, nur Schrägstrich) sind keine Formeln
    if set(ops)=={'/'} and 'var' not in ks and not any(re.search('[A-Za-z%°]',src[t[1]:t[2]]) for t in run if t[0]=='num'):return False
    return True

NOUNS=r'(Masse|Impuls|Impulsänderung|Kraftstoß|Zeitspanne|Höhe|Hubhöhe|Fallhöhe|Starthöhe|Ortsfaktor|Abstand|Bildweite|Gegenstandsweite|Körperlänge|Augenhöhe|Strecke|Weg|Zeit|Geschwindigkeit|Kraft|Gewichtskraft|Winkel|Einfallswinkel|Reflexionswinkel|Brechungswinkel|Ablenkwinkel|Öffnungswinkel|Energie|Lageenergie|Bewegungsenergie|Scheibenabstand)'
def single_symbol(run,src):
    """Einzelnes Formelzeichen im Fließtext: mit Index, griechisch oder nach einem Größennamen."""
    core=[t for t in run if t[0] not in('ws','bo','bc')]
    if len(core)!=1 or core[0][0]!='var':return False
    if any(t[0] in('bo','bc') for t in run):return False
    t=core[0];txt=src[t[1]:t[2]]
    if '<sub>' in txt or re.fullmatch(r'[A-Za-z]_[A-Za-z0-9]{1,6}',txt):return True
    if txt[0] in 'αβγδεηλμρφΔ':return True
    before=src[max(0,t[1]-25):t[1]]
    return bool(re.search(NOUNS+r' $',before))

def trim(run):
    # führende/nachfolgende Füllzeichen und Operatoren entfernen
    while run and run[0][0] in('ws','op',')','bc'):run=run[1:]
    while run and run[-1][0] in('ws','op','(','bo','fn'):run=run[:-1]
    # Klammern ausgleichen
    d=0;start=0
    for i,t in enumerate(run):
        if t[0]=='(':d+=1
        elif t[0]==')':
            d-=1
            if d<0:return trim(run[i+1:])
    if d>0:
        d=0
        for i in range(len(run)-1,-1,-1):
            t=run[i]
            if t[0]==')':d+=1
            elif t[0]=='(':
                d-=1
                if d<0:return trim(run[:i])
    # Fettdruck ausgleichen
    d=0
    for i,t in enumerate(run):
        if t[0]=='bo':d+=1
        elif t[0]=='bc':
            d-=1
            if d<0:return trim(run[i+1:])
    if d>0:
        for i in range(len(run)-1,-1,-1):
            if run[i][0]=='bo':return trim(run[:i])
    return run

def mark_html(s):
    toks=tokens(s);res=[];last=0;runs=[];cur=[]
    for t in toks:
        if t[0] in('num','var','op','(',')','bo','bc','ws','fn'):cur.append(t)
        else:
            runs.append(cur);cur=[]
            if t[0]=='tag':
                tag=s[t[1]:t[2]]
                if re.search(r'data-(fb|tipp)="',tag):runs.append(('TAG',t))
    runs.append(cur)
    edits=[]
    for r in runs:
        if isinstance(r,tuple):
            t=r[1];tag=s[t[1]:t[2]]
            new=re.sub(r'(data-(?:fb|tipp)=")([^"]*)(")',lambda m:m.group(1)+mark_html(m.group(2))+m.group(3),tag)
            if new!=tag:edits.append((t[1],t[2],new))
            continue
        r=trim(r)
        if r and not valid(r,s) and single_symbol(r,s):
            a,b=r[0][1],r[-1][2]
            edits.append((a,b,'<f-m>'+s[a:b]+'</f-m>'));continue
        if r and valid(r,s):
            a,b=r[0][1],r[-1][2]
            edits.append((a,b,'<f-m>'+s[a:b]+'</f-m>'))
    for a,b,new in sorted(edits,reverse=True):
        s=s[:a]+new+s[b:]
    return s

def mark_js(code):
    out=[];i=0;n=len(code);prev_sig=''
    while i<n:
        c=code[i]
        if code.startswith('//',i):
            e=code.find('\n',i);e=n if e<0 else e;out.append(code[i:e]);i=e;continue
        if code.startswith('/*',i):
            e=code.find('*/',i)+2;out.append(code[i:e]);i=e;continue
        if c in '\'"':
            e=str_end(code,i);inner=code[i+1:e-1]
            out.append(c+mark_html(inner)+c);i=e;prev_sig='s';continue
        if c=='`':
            e=str_end(code,i);inner=code[i+1:e-1]
            out.append('`'+mark_template(inner)+'`');i=e;prev_sig='s';continue
        if c=='/':
            if prev_sig=='' or prev_sig in '(,=:[!&|?{};+-*%<>~^' :
                # Regex-Literal
                j=i+1;cls=False
                while j<n:
                    if code[j]=='\\':j+=2;continue
                    if code[j]=='[':cls=True
                    elif code[j]==']':cls=False
                    elif code[j]=='/' and not cls:break
                    j+=1
                j+=1
                while j<n and code[j].isalpha():j+=1
                out.append(code[i:j]);i=j;prev_sig='r';continue
        out.append(c)
        if not c.isspace():
            prev_sig=c
            m=re.match(r'[A-Za-z_$][\w$]*',code[i:])
            if m:
                word=m.group(0);out.append(word[1:]);i+=len(word)
                prev_sig='' if word in('return','typeof','case') else 'w';continue
        i+=1
    return ''.join(out)

def mark_template(inner):
    """Template-Literal: Text wird markiert, ${…}-Ausdrücke bleiben als Platzhalter erhalten,
    verschachtelte Strings darin werden ebenfalls bearbeitet."""
    # Platzhalter rekursiv bearbeiten
    parts=[];i=0
    while i<len(inner):
        if inner.startswith('${',i):
            e=interp_end(inner,i);parts.append(('${'+mark_js(inner[i+2:e-1])+'}'));i=e
        elif inner[i]=='\\':parts.append(inner[i:i+2]);i+=2
        else:parts.append(inner[i]);i+=1
    rebuilt=''.join(parts)
    return mark_html(rebuilt)

def process(path):
    s=open(path).read();orig=s
    out=[];i=0
    for m in re.finditer(r'(<script[^>]*>)(.*?)(</script>)',s,re.S):
        out.append(mark_html_doc(s[i:m.start()]));out.append(m.group(1)+mark_js(m.group(2))+m.group(3));i=m.end()
    out.append(mark_html_doc(s[i:]))
    return ''.join(out)

def mark_html_doc(s):
    # Kopfbereich nicht anfassen
    if '<head>' in s and '</head>' in s:
        a=s.index('</head>');return s[:a]+mark_html(s[a:])
    return mark_html(s)

if __name__=='__main__':
    for f in sys.argv[1:]:
        new=process(f)
        print(f,new.count('<f-m>'))
        open(f,'w').write(new)

/* Formelsatz für die GST-Lernpfade.
   Formeln stehen im Quelltext lesbar in <f-m>…</f-m>, z. B. <f-m>h = E<sub>L</sub> : (m · g)</f-m>.
   Dieses Skript zerlegt sie in Zahlen, Einheiten, Variablen und Rechenzeichen und setzt sie mit KaTeX:
   Variablen kursiv, Einheiten aufrecht, Brüche (":" und "/") als echte Bruchstriche, Dezimalkomma richtig. */
(function(){
const GREEK={'α':'\\alpha','β':'\\beta','γ':'\\gamma','δ':'\\delta','ε':'\\varepsilon','η':'\\eta','λ':'\\lambda','μ':'\\mu','ρ':'\\rho','φ':'\\varphi','Δ':'\\Delta'};
const OPS={'=':'=','≈':'\\approx','·':'\\cdot','×':'\\cdot','+':'+','−':'-','-':'-',':':':','/':'/','→':'\\rightarrow','~':'\\sim','<':'<','>':'>','≤':'\\le','≥':'\\ge'};
const FR={'½':'\\tfrac{1}{2}','¼':'\\tfrac{1}{4}','¾':'\\tfrac{3}{4}'};
const REL=new Set(['=','≈','→','~','<','>','≤','≥']),ADD=new Set(['+','−','-']),MUL=new Set(['·','×']),DIV=new Set([':','/']);
const UNIT=/^(kg·m\/s|N·s|kg\/m³|m\/s²|km\/h|m³|cm³|dm³|m²|cm²|N\/kg|N\/m|km\/s|m\/s|kWh|MWh|kJ|MJ|kN|kg|cm|mm|km|dm|J|N|W|V|A|L|g|m|s|%|°)(?![A-Za-zäöüÄÖÜß²])/;
const NUM=/^(\d{1,3}(?:[\u00a0 ]\d{3})+|\d+)(?:,\d+)?(?:<sup>[−-]?\d+<\/sup>)?/;
const VAR=/^(Δ[A-Za-zα-ω]|[A-Za-zα-ωΔ])(\u20d7)?(?:<sub>([^<]{1,10})<\/sub>|_([A-Za-z0-9]{1,6})(?![A-Za-z0-9]))?(?:<sup>(\d)<\/sup>)?(?![A-Za-zäöüÄÖÜß])/;
/* Winkelfunktionen und Wurzel (Physik 11) */
const FN=/^(arcsin|arccos|arctan|sin|cos|tan)(?![A-Za-zäöüÄÖÜß])/;
function decode(s){return s.replace(/&nbsp;/g,'\u00a0').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')}
function tokenize(html){const t=[];let s=decode(html),bold=false,m;
 while(s.length){
  if(/^[\s\u00a0]/.test(s)){s=s.slice(1);continue}
  if(s.startsWith('<b>')||s.startsWith('<strong>')){bold=true;s=s.slice(s.indexOf('>')+1);continue}
  if(s.startsWith('</b>')||s.startsWith('</strong>')){bold=false;s=s.slice(s.indexOf('>')+1);continue}
  if((m=NUM.exec(s))){let v=m[0];s=s.slice(v.length);let u=null,mu=/^[\s\u00a0]?/.exec(s)[0];const um=UNIT.exec(s.slice(mu.length));
   if(um){u=um[1];s=s.slice(mu.length+u.length);if(u==='N'&&/^[\s\u00a0]?·[\s\u00a0]?m(?![A-Za-z])/.test(s)){s=s.replace(/^[\s\u00a0]?·[\s\u00a0]?m/,'');u='N·m'}}
   t.push({k:'num',v,u,bold});continue}
  if((m=FN.exec(s))){t.push({k:'fn',v:m[1],bold});s=s.slice(m[0].length);continue}
  if(s[0]==='√'){t.push({k:'sqrt',bold});s=s.slice(1);continue}
  if((m=VAR.exec(s))){t.push({k:'var',v:m[1],vec:!!m[2],sub:m[3]||m[4],sup:m[5],bold});s=s.slice(m[0].length);continue}
  if('½¼¾'.includes(s[0])){t.push({k:'num',v:s[0],bold});s=s.slice(1);continue}
  const c=s[0];
  if(c in OPS){t.push({k:'op',v:c,bold});s=s.slice(1);continue}
  if(c==='('||c===')'){t.push({k:c,bold});s=s.slice(1);continue}
  t.push({k:'raw',v:c,bold});s=s.slice(1)}
 return t}
function texNum(tok){if(tok.v in FR)return FR[tok.v];let v=tok.v.replace(',','{,}').replace(/[\u00a0 ](?=\d{3})/g,'\\,').replace(/<sup>([−-]?)(\d+)<\/sup>/,(a,mi,d)=>'^{'+(mi?'-':'')+d+'}');
 let u='';if(tok.u){u=tok.u==='°'?'^\\circ':tok.u==='%'?'\\,\\%':'\\,\\mathrm{'+tok.u.replace('·','\\cdot ').replace('²','^2').replace('³','^3')+'}'}
 return v+u}
function texVar(tok){let v=tok.v.length>1&&tok.v[0]==='Δ'?'\\Delta '+(GREEK[tok.v[1]]||tok.v[1]):(GREEK[tok.v]||tok.v);if(tok.vec)v='\\vec{'+v+'}';if(tok.sub)v+='_{\\mathrm{'+tok.sub+'}}';if(tok.sup)v+='^{'+tok.sup+'}';return v}
function wrapB(tex,b){return b?'\\boldsymbol{'+tex+'}':tex}
/* Parser mit Rangfolge: Relation < Strich < Punkt/Bruch */
function parse(tokens,big){let i=0;const peek=()=>tokens[i];
 function atom(){const t=tokens[i];if(!t)return '';
  if(t.k==='op'&&(t.v==='−'||t.v==='-')){i++;const a=atom();return '-'+(typeof a==='string'?a:'\\left('+a.tex+'\\right)')}
  if(t.k==='('){i++;const e=rel();if(peek()&&peek().k===')')i++;return {paren:true,tex:e,bold:t.bold}}
  if(t.k==='fn'){i++;const a=atom();return wrapB('\\'+t.v+(typeof a==='string'?' '+a:'\\left('+a.tex+'\\right)'),t.bold)}
  if(t.k==='sqrt'){i++;const a=atom();return wrapB('\\sqrt{'+(typeof a==='string'?a:a.tex)+'}',t.bold)}
  i++;if(t.k==='num')return wrapB(texNum(t),t.bold);if(t.k==='var')return wrapB(texVar(t),t.bold);return wrapB(t.v,t.bold)}
 const show=a=>typeof a==='string'?a:'\\left('+a.tex+'\\right)';
 const bare=a=>typeof a==='string'?a:a.tex;
 const fr=big?'\\dfrac':'\\frac';
 function prod(){let parts=[];let a=atom();parts.push(show(a));let num=null,lastAtom=a;
  while(peek()){const t=peek();
   if(t.k==='op'&&MUL.has(t.v)){i++;const b=atom();parts.push('\\cdot',show(b));lastAtom=b;continue}
   if(t.k==='op'&&DIV.has(t.v)){i++;const b=atom();
    // Zähler: bisheriges Produkt (bei nur einem Faktor ohne Klammern), Nenner: nächster Faktor
    const numer=parts.length===1?bare(lastAtom):parts.join(' ');parts=[fr+'{'+numer+'}{'+bare(b)+'}'];lastAtom=parts[0];continue}
   if(t.k==='var'||t.k==='('){const prev=tokens[i-1];if(prev&&prev.k==='num'&&!prev.u){const b=atom();parts.push(show(b));lastAtom=b;continue}}
   break}
  return parts.join(' ')}
 function sum(){let s=prod();while(peek()&&peek().k==='op'&&ADD.has(peek().v)){const o=OPS[tokens[i++].v];s+=' '+o+' '+prod()}return s}
 function rel(){let s=sum();while(peek()&&peek().k==='op'&&REL.has(peek().v)){const o=OPS[tokens[i++].v];s+=' '+o+' '+sum()}return s}
 let out=rel();
 while(i<tokens.length){const t=tokens[i++];out+=' '+(t.k==='op'?OPS[t.v]:t.k==='raw'?t.v:t.k==='num'?texNum(t):t.k==='var'?texVar(t):t.k);out+=' '+rel()}
 return out}
const BIG='.merke,.heft,.sol,.formula,.given,.calc,details.reveal';
function render(el){if(el.dataset.done)return;el.dataset.done='1';
 /* In Grafiken und Auswahllisten bleibt reiner Text (dort sind keine Formeln möglich, und Antworten werden über den Text verglichen) */
 if(el.closest('svg,select,option')){el.replaceWith(...el.childNodes);return}
 if(!window.katex)return;
 const src=el.innerHTML;let tex='';
 try{tex=parse(tokenize(src),!!el.closest(BIG));el.innerHTML=katex.renderToString(tex,{throwOnError:true,strict:'ignore',output:'htmlAndMathml'});el.title=''}
 catch(e){el.innerHTML=src;console.warn('Formel nicht gesetzt:',src,tex,e.message)}}
/* Texte, die per textContent gesetzt wurden, enthalten die Markierung als reinen Text */
const SKIP=/^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT|TITLE)$/i;
function fixText(node){if(node.nodeType!==3||!node.data.includes('<f-m>')||!node.parentNode||SKIP.test(node.parentNode.nodeName))return;const sp=document.createElement('span');
 sp.innerHTML=node.data.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]).replace(/&lt;f-m&gt;([\s\S]*?)&lt;\/f-m&gt;/g,(a,b)=>'<f-m>'+b.replace(/&lt;(\/?)(sub|sup|b)&gt;/g,'<$1$2>')+'</f-m>');
 const frag=document.createDocumentFragment();while(sp.firstChild)frag.appendChild(sp.firstChild);node.parentNode.replaceChild(frag,node)}
function scan(root){if(root.nodeType===3){fixText(root);return}if(root.nodeType!==1)return;
 const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.data.includes('<f-m>')&&!SKIP.test(n.parentNode.nodeName)?1:3});const list=[];while(tw.nextNode())list.push(tw.currentNode);list.forEach(fixText);
 if(root.localName==='f-m')render(root);root.querySelectorAll('f-m').forEach(render)}
function start(){scan(document.body);new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')fixText(m.target);else m.addedNodes.forEach(scan)}}).observe(document.body,{childList:true,subtree:true,characterData:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.GSTFormel={tokenize,parse};
})();

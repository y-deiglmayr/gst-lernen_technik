/* ---------- Zeichenaufgabe mit Werkzeugleiste, Prüfen, Fehler zeigen, Lösung (für Kavalier und Isometrie) ---------- */
TZ.task=function(root,o){
 const id=o.id,lbl=o.mode==='iso'?'Linien laufen entlang der Isometrie-Linien (senkrecht oder 30° schräg).':'Linien rasten in 15°-Schritten und ganzen Millimetern ein. Die Länge siehst du beim Ziehen.';
 root.innerHTML=`<div class="tz-tools" data-fest><button data-t="draw" aria-pressed="true">✏ Zeichnen</button><button data-t="erase" aria-pressed="false">⌫ Radieren</button><span class="sep"></span><button data-l="v" aria-pressed="true"><svg class="ls" viewBox="0 0 30 10"><line x1="2" y1="5" x2="28" y2="5" stroke="currentColor" stroke-width="3"/></svg>sichtbar</button><button data-l="h" aria-pressed="false"><svg class="ls" viewBox="0 0 30 10"><line x1="2" y1="5" x2="28" y2="5" stroke="currentColor" stroke-width="1.6" stroke-dasharray="5 3"/></svg>verdeckt</button><span class="sep"></span><button data-a="undo">↶ Zurück</button><button data-a="clear">Alles löschen</button></div>
<div class="vt"><div class="fig" style="padding:4px"><button class="vt-max">⤢ Groß</button><svg aria-label="Zeichenbrett"></svg></div></div>
<p class="caption">${lbl} Auf einen Punkt drücken, ziehen, loslassen.</p>
<div class="row"><button class="primary" data-a="check">Prüfen</button><button data-a="diff" disabled>Fehler zeigen</button><button data-a="sol" disabled>Lösung zeigen</button></div>
<div class="tz-res" aria-live="polite"></div>
<div class="tz-legend" hidden><span><i style="background:var(--gst-mark)"></i>fehlt</span><span><i style="background:var(--wrongc)"></i>falscher Linientyp</span><span><i style="background:var(--bad)"></i>zu viel oder falsche Stelle</span></div>
<div class="sol" hidden></div>`;
 const q=s=>root.querySelector(s),svg=q('.vt svg'),res=q('.tz-res'),leg=q('.tz-legend'),solB=q('.sol'),k=KEY+'-zb-'+id;
 const bd=TZ.board(svg,{w:o.w,h:o.h,mode:o.mode,step:o.step||5,onchange:()=>{try{localStorage.setItem(k,JSON.stringify(bd.segs))}catch(e){}}});
 try{bd.load(JSON.parse(localStorage.getItem(k)||'[]'))}catch(e){}
 const set=(sel,attr,val)=>root.querySelectorAll(sel).forEach(b=>b.setAttribute('aria-pressed',b.getAttribute(attr)===val));
 root.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{bd.setTool(b.dataset.t);set('[data-t]','data-t',b.dataset.t)});
 root.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{bd.setType(b.dataset.l);set('[data-l]','data-l',b.dataset.l);bd.setTool('draw');set('[data-t]','data-t','draw')});
 let last=null;
 const exp=()=>o.expected();
 q('[data-a=undo]').onclick=()=>bd.undoStep();q('[data-a=clear]').onclick=()=>bd.clear();
 q('[data-a=check]').onclick=()=>{const E=exp(),r=TZ.compareFree(E,bd.segs,{tol:o.tol||.9,ignoreHidden:o.ignoreHidden});last=r;
  let t=[];
  if(!bd.segs.length)t.push('Du hast noch nichts gezeichnet.');
  else if(r.ok){res.innerHTML=`<p class="fb ok">${o.okText||'Richtig gezeichnet!'}</p>`;q('[data-a=diff]').disabled=true;q('[data-a=sol]').disabled=false;bd.clearOvl();leg.hidden=true;o.onok&&o.onok();return}
  else{if(r.nMiss)t.push(r.nMiss+(r.nMiss===1?' Linie fehlt oder ist zu kurz.':' Linien fehlen oder sind zu kurz.'));
   if(r.nWrong)t.push(r.nWrong+(r.nWrong===1?' Linie hat den falschen Linientyp (sichtbar ↔ verdeckt).':' Linien haben den falschen Linientyp (sichtbar ↔ verdeckt).'));
   if(r.nExtra)t.push(r.nExtra+(r.nExtra===1?' Linie ist zu viel, zu lang oder liegt falsch.':' Linien sind zu viel, zu lang oder liegen falsch.'));
   if(o.hint){const h=o.hint(bd.segs,E);if(h)t.push(h)}}
  res.innerHTML='<ul>'+t.map(x=>`<li class="bad">${x}</li>`).join('')+'</ul>';q('[data-a=diff]').disabled=!bd.segs.length;q('[data-a=sol]').disabled=false;bd.clearOvl();leg.hidden=true};
 q('[data-a=diff]').onclick=()=>{if(!last)return;bd.overlay(TZ.diffSVG(last));leg.hidden=false};
 q('[data-a=sol]').onclick=()=>{solB.hidden=!solB.hidden;q('[data-a=sol]').textContent=solB.hidden?'Lösung zeigen':'Lösung ausblenden';
  if(!solB.hidden){const E=exp(),bb=TZ.bbox(E),p=6;solB.innerHTML=`<p><b>Lösung:</b> ${o.solText||''}</p><svg class="tz-sp" viewBox="${bb[0]-p} ${bb[1]-p} ${bb[2]-bb[0]+2*p} ${bb[3]-bb[1]+2*p}" style="display:block;width:100%;max-width:${Math.round((bb[2]-bb[0]+2*p)*3.2)}px;height:auto" role="img" aria-label="Lösungszeichnung">${TZ.segSVG(E)}</svg>`}};
 const mx=q('.vt-max');mx.onclick=()=>{const vt=mx.closest('.vt'),on=!vt.classList.contains('vtmax'),tools=q('.tz-tools');vt.classList.toggle('vtmax',on);document.documentElement.classList.toggle('noscroll',on);mx.textContent=on?'✕ Schließen':'⤢ Groß';
  if(on)vt.prepend(tools);else vt.before(tools)};
 return bd};

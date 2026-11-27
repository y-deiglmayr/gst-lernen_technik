const KEY='@KEY@';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const fmt=(v,n=2)=>(+v).toFixed(n).replace('.',',').replace('-','−');
const fmtS=(v,n=2)=>fmt(v,n).replace(/(,\d*?)0+$/,'$1').replace(/,$/,'');
const num=v=>parseFloat(String(v).replace(/[\s ]/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.').replace('−','-'));
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const RAD=Math.PI/180,g=9.81;
const sind=a=>Math.sin(a*RAD),cosd=a=>Math.cos(a*RAD),tand=a=>Math.tan(a*RAD);
/* Fortschritt (nur in diesem Browser) */
let done=new Set();
try{done=new Set(JSON.parse(localStorage.getItem(KEY)||'[]'))}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify([...done]))}catch(e){}}
function updProg(){const tasks=[...new Set($$('[data-task]').map(e=>e.dataset.task))];const n=tasks.filter(t=>done.has(t)).length;$('#progtxt').textContent=n+' / '+tasks.length+' gelöst';$('#progbar').style.width=(100*n/Math.max(1,tasks.length))+'%';
 $$('[data-task]').forEach(e=>e.classList.toggle('done',done.has(e.dataset.task)));$$('.tabs button[data-for]').forEach(b=>b.classList.toggle('solved',done.has(b.dataset.for)))}
function mark(id){if(!id)return;done.add(id);save();updProg()}
function svgPt(svg,ev){const p=svg.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
function animate(ms,step,end){if(reduce){step(1);end&&end();return}const t0=performance.now();function f(t){const k=Math.min(1,(t-t0)/ms);step(k);if(k<1)requestAnimationFrame(f);else end&&end()}requestAnimationFrame(f)}
/* Formelzeichen in SVG: "F|res" -> F mit Index res */
function lab(n){const [b,s]=String(n).split('|');return s?`${b}<tspan dy="5" font-size="75%">${s}</tspan><tspan dy="-5"> </tspan>`:b}
function labH(n){const [b,s]=String(n).split('|');return s?`${b}<sub>${s}</sub>`:b}
const COL={f1:'var(--f1)',f2:'var(--f2)',f3:'var(--f3)',fr:'var(--fr)',fg:'var(--fg)',fh:'var(--fh)',fn:'var(--fnn)',ink:'var(--ink)',mut:'var(--muted)',acc:'var(--acc)'};
const col=c=>COL[c]||c;
/* ===== Bausteine ===== */
const hints={};
function initCommon(){
 $$('.hintsrc').forEach(d=>{hints[d.dataset.for]=[...d.children].map(p=>p.innerHTML)});
 $$('[data-hint]').forEach(b=>{let h=0;b.onclick=()=>{const id=b.dataset.hint,arr=hints[id]||[],el=$('#'+id+'Tip');if(!arr.length||!el)return;el.className='fb hint tip';el.innerHTML='Tipp '+(h%arr.length+1)+' von '+arr.length+': '+arr[h%arr.length];h++}});
 $$('[data-sol]').forEach(b=>b.onclick=()=>{const el=$('#'+b.dataset.sol);el.hidden=!el.hidden;b.textContent=el.hidden?'Lösung zeigen':'Lösung ausblenden'});
 /* Multiple Choice: nach einem Fehlversuch Hinweis und kurze Denkpause */
 $$('.mc[data-correct]').forEach(box=>{const fb=box.querySelector('.fb'),btns=[...box.querySelectorAll('button[data-k]')];
  btns.forEach(b=>b.onclick=()=>{const ok=b.dataset.k===box.dataset.correct;
   if(ok){btns.forEach(x=>x.classList.remove('bad'));b.classList.add('ok');fb.className='fb ok';fb.innerHTML=b.dataset.fb||'Richtig!';mark(box.dataset.task);return}
   b.classList.add('bad');b.disabled=true;fb.className='fb hint';
   fb.innerHTML=(b.dataset.fb||'Das stimmt nicht.')+(box.dataset.tipp?' <b>Hinweis:</b> '+box.dataset.tipp:' Lies die Frage noch einmal genau und denk nach, bevor du weiterklickst.');
   const free=btns.filter(x=>!x.classList.contains('bad'));free.forEach(x=>x.disabled=true);setTimeout(()=>free.forEach(x=>x.disabled=false),reduce?0:2500)})});
 /* Mehrfachauswahl */
 $$('.multi').forEach(box=>{const fb=box.querySelector('.fb');box.querySelector('.multi-check').onclick=()=>{const ls=[...box.querySelectorAll('label')];let bad=0;ls.forEach(l=>{const i=l.querySelector('input'),should=l.dataset.ok==='1';const r=i.checked===should;l.className=i.checked||!r?(r?'ok':'bad'):'';if(!r)bad++});
  if(!bad){fb.className='fb ok';fb.innerHTML=box.dataset.fb||'Richtig!';mark(box.dataset.task)}else{fb.className='fb hint';fb.innerHTML=bad+(bad===1?' Auswahl stimmt':' Auswahlen stimmen')+' noch nicht. '+(box.dataset.tipp||'')}}});
 /* Textfelder */
 $$('textarea[data-store]').forEach(t=>{const k=KEY+'-txt-'+t.dataset.store;try{t.value=localStorage.getItem(k)||''}catch(e){}t.addEventListener('input',()=>{try{localStorage.setItem(k,t.value)}catch(e){}})});
 /* Begründe-Aufträge */
 $$('.why').forEach(w=>{const t=w.querySelector('textarea'),cb=w.querySelector('input[type=checkbox]'),show=w.querySelector('.why-show'),sol=w.querySelector('.sol'),okb=w.querySelector('.why-ok');
  const upd=()=>{show.disabled=!((t&&t.value.trim().length>=15)||(cb&&cb.checked))};if(t)t.addEventListener('input',upd);if(cb)cb.addEventListener('change',upd);upd();
  show.onclick=()=>{sol.hidden=false;show.hidden=true};okb.onclick=()=>{mark(w.dataset.task);okb.textContent='✓ Abgehakt'}});
 /* Zahlen-Aufgaben */
 $$('.numbox').forEach(box=>{const fb=box.querySelector('.nfb');box.querySelector('.num-check').onclick=()=>{const ins=[...box.querySelectorAll('input[data-a]')];let ok=0;
  ins.forEach(i=>{const v=num(i.value),a=+i.dataset.a,tol=+(i.dataset.tol||0.01),gd=!isNaN(v)&&Math.abs(v-a)<=Math.max(Math.abs(a)*tol,1e-9);i.className=i.value===''?'':(gd?'ok':'bad');if(gd)ok++});
  if(ok===ins.length){fb.className='fb ok nfb';fb.innerHTML=box.dataset.fb||'Alles richtig!';mark(box.dataset.task)}else{fb.className='fb bad nfb';fb.textContent=ok+' von '+ins.length+' richtig. Prüfe Rechnung, Einheiten und Rundung – oder hol dir einen Tipp.'}}});
 /* Auswahlfelder (Lückentext, Zuordnung) */
 $$('.selbox').forEach(box=>{const fb=box.querySelector('.sfb');box.querySelector('.sel-check').onclick=()=>{const s=[...box.querySelectorAll('select')];let ok=0;s.forEach(x=>{const gd=x.value===x.dataset.a;x.className=x.value===''?'':(gd?'ok':'bad');if(gd)ok++});
  if(ok===s.length){fb.className='fb ok sfb';fb.innerHTML=box.dataset.fb||'Alles richtig!';mark(box.dataset.task)}else{fb.className='fb bad sfb';fb.textContent=ok+' von '+s.length+' richtig. Prüfe die rot markierten Felder.'}}});
 /* Richtig/Falsch */
 $$('.tf').forEach(box=>{const rows=[...box.querySelectorAll('.item')],solved=new Set();rows.forEach((row,i)=>{const ex=row.querySelector('.ex'),fb=row.querySelector('.fb');row.querySelectorAll('button').forEach(b=>b.onclick=()=>{const ok=b.dataset.v===row.dataset.v;
  row.querySelectorAll('button').forEach(x=>x.classList.remove('ok','bad'));b.classList.add(ok?'ok':'bad');fb.className='fb '+(ok?'ok':'bad');fb.innerHTML=(ok?'Stimmt. ':'Nein. ')+ex.innerHTML;if(ok)solved.add(i);if(solved.size===rows.length)mark(box.dataset.task)})})});
 /* Reiter */
 $$('.tabs[data-group]').forEach(tb=>{const bs=[...tb.querySelectorAll('button')];bs.forEach(b=>b.onclick=()=>{bs.forEach(x=>{x.setAttribute('aria-pressed',x===b);const p=$('#'+x.dataset.panel);if(p)p.hidden=x!==b});const p=$('#'+b.dataset.panel);p&&p.dispatchEvent(new Event('show'))})});
 {const d=$('#qrDlg');$('#qrOpen').onclick=()=>d.showModal();$('#qrClose').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close()})}
 $('#resetAll').onclick=()=>{done.clear();save();location.reload()};
 updProg()}


/* Heftaufschrieb übernommen */
$$('.hb-done').forEach(b=>{if(done.has(b.dataset.task))b.textContent='✓ Im Heft';b.onclick=()=>{mark(b.dataset.task);b.textContent='✓ Im Heft'}});
/* Schritt-für-Schritt */
$$('.stepper').forEach(st=>{const boxes=[...st.querySelectorAll('.stepbox')],nx=st.querySelector('.st-next'),bk=st.querySelector('.st-back'),dots=st.querySelector('.steps');let i=0;
 const show=()=>{boxes.forEach((b,k)=>b.hidden=k>i);if(dots)dots.innerHTML=boxes.map((b,k)=>`<i class="${k<=i?'on':''}">${k+1}</i>`).join('');nx.disabled=i>=boxes.length-1;bk.disabled=i===0;if(i>=boxes.length-1&&st.dataset.task)mark(st.dataset.task)};
 nx.onclick=()=>{i=Math.min(boxes.length-1,i+1);show()};bk.onclick=()=>{i=Math.max(0,i-1);show()};show()});

/* ===== Anhänger-Werkstatt (Projekt Schlüsselanhänger): Grundplatte (Quader) + Schrift (Text) − Bohrung (Zylinder) =====
   Maße in mm. Platte: x = Länge (nach rechts), y = Breite (nach hinten), z = Höhe. Loch-Mitte bei (hx, B/2).
   Drehbare 3D-Ansicht als SVG (Maler-Verfahren), Druckbarkeits-Check nach der Checkliste aus dem Unterricht.
   Modellannahmen: Schrift liegt mittig im Platz rechts vom Loch; die Bohrung ist 2 mm höher als die Platte. */
const ANH=(()=>{
const RAD=Math.PI/180;
const DEF={L:50,B:20,t:3,r:4,d:5,hx:6,hole:'bohrung',grp:true,txt:'MAX',sz:10,h:1,z:3};
const FONT='700 1px Lexend,"Atkinson Hyperlegible",sans-serif';
const f1=v=>(Math.round(v*10)/10).toString().replace('.',',');
function outline(L,B,r){r=Math.max(0,Math.min(r,B/2,L/2));if(r<.05)return [[0,0],[L,0],[L,B],[0,B]];const p=[];
 for(const [cx,cy,a0] of [[L-r,r,-90],[L-r,B-r,0],[r,B-r,90],[r,r,180]])for(let i=0;i<=8;i++){const a=(a0+i*90/8)*RAD;p.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}
 return p}
function circle(cx,cy,R,n=36){const p=[];for(let i=0;i<n;i++){const a=i/n*2*Math.PI;p.push([cx+R*Math.cos(a),cy+R*Math.sin(a)])}return p}
let ctx=null;
function textW(s,sz){if(!s)return 0;if(!ctx)ctx=document.createElement('canvas').getContext('2d');ctx.font=FONT.replace('1px','100px');return ctx.measureText(s).width/100*sz/.72}
/* Kennwerte des Entwurfs */
function info(m){const capH=m.sz,fs=m.sz/.72,w=textW(m.txt,m.sz),x0=m.hole==='bohrung'?m.hx+m.d/2+1:1,tx=(x0+m.L)/2;
 const fits=!m.txt||(tx-w/2>=x0-1e-6&&tx+w/2<=m.L-1+1e-6&&capH<=m.B-2+1e-6);
 const rim=Math.min(m.hx-m.d/2,(m.B-m.d)/2),top=m.txt?m.z+m.h:0,total=Math.max(m.t,top);
 return {capH,fs,w,tx,fits,rim,total,relief:top-m.t,float:!!m.txt&&m.z>m.t+1e-6,hidden:!!m.txt&&top<=m.t+1e-6}}
/* Checkliste „Ist mein Anhänger druckbar?“ */
function checks(m){const I=info(m),r=[];
 r.push({k:'L',t:'Länge: 40 bis 60 mm',ok:m.L>=40&&m.L<=60,w:m.L<40?`Mit ${m.L} mm ist der Anhänger zu kurz.`:`Mit ${m.L} mm ist der Anhänger zu lang.`});
 r.push({k:'D',t:'Dicke: 3 bis 5 mm',ok:m.t>=3&&I.total<=5,w:m.t<3?`Die Platte ist nur ${f1(m.t)} mm dünn – sie bricht leicht.`:`Gesamtdicke ${f1(I.total)} mm – das ist zu dick.`});
 r.push({k:'d',t:'Loch: mindestens 4 mm Durchmesser',ok:m.hole==='bohrung'&&m.d>=4,w:m.hole==='none'?'Es gibt noch kein Loch für den Schlüsselring.':m.hole!=='bohrung'?'Der Zylinder ist ein Körper, keine Bohrung – es entsteht kein Loch.':`Ø ${f1(m.d)} mm ist zu klein für den Schlüsselring.`});
 r.push({k:'rim',t:'Rand ums Loch: mindestens 2 mm Material',ok:m.hole!=='bohrung'||I.rim>=2-1e-6,w:I.rim<=0?'Das Loch schneidet den Rand an.':`Nur ${f1(I.rim)} mm Material neben dem Loch – es reißt aus.`});
 r.push({k:'txt',t:'Schrift: mind. 1 mm hoch, auf der Platte',ok:!!m.txt&&!I.float&&I.relief>=1-1e-6&&I.fits,
  w:!m.txt?'Es gibt noch keine Schrift.':I.float?'Die Schrift schwebt über der Platte – sie fällt nach dem Druck ab.':I.hidden?'Die Schrift steckt ganz in der Platte – man sieht sie nicht.':I.relief<1-1e-6?`Die Schrift steht nur ${f1(I.relief)} mm über die Platte.`:'Die Schrift passt nicht auf die Platte (zu lang, zu groß oder zu nah am Loch).'});
 r.push({k:'grp',t:'Gruppiert: alles ist fest verbunden',ok:m.grp,w:'Noch nicht gruppiert: Die Bohrung schneidet nichts aus, die Teile sind nicht verbunden.'});
 return r}
/* ---------- 3D-Ansicht ---------- */
function view(svg,o={}){
 let m={...DEF,...(o.m||{})},yaw=o.yaw??-28,pitch=o.pitch??40,dims=!!o.dims,anim=null;
 const st={};
 function draw(){
  const cy=Math.cos(yaw*RAD),sy=Math.sin(yaw*RAD),cp=Math.cos(pitch*RAD),sp=Math.sin(pitch*RAD);
  const cx0=m.L/2,cy0=m.B/2,I=info(m);
  const P=(x,y,z)=>{x-=cx0;y-=cy0;const x1=x*cy-y*sy,y1=x*sy+y*cy;return [x1,-(z*cp+y1*sp),y1*cp-z*sp]};
  const v=[sy*cp,cy*cp,-sp],Ld=[-.35,-.55,.76];
  const shade=(n,base,k0=.62)=>{const l=Math.max(0,n[0]*Ld[0]+n[1]*Ld[1]+n[2]*Ld[2]);return `color-mix(in srgb,var(${base}) ${Math.round((k0+(1-k0)*l)*100)}%,#000)`};
  const M=c=>`matrix(${cy},${-sp*sy},${sy},${sp*cy},${-cx0*cy+cy0*sy},${-c*cp+sp*(sy*cx0+cy*cy0)})`;
  const pts=a=>a.map(q=>q[0].toFixed(3)+' '+q[1].toFixed(3)).join('L');
  const cut=m.grp&&m.hole==='bohrung';
  const out=outline(m.L,m.B,m.r),hole=circle(m.hx,m.B/2,m.d/2);
  let s='';
  /* Arbeitsebene (Raster 5 mm) */
  {let g='';const x0=-10,x1=Math.ceil((m.L+10)/5)*5,y0=-10,y1=Math.ceil((m.B+10)/5)*5;
   for(let x=x0;x<=x1;x+=5)g+=`M${x} ${-y0}V${-y1}`;for(let y=y0;y<=y1;y+=5)g+=`M${x0} ${-y}H${x1}`;
   s+=`<g transform="${M(0)}"><rect x="${x0}" y="${-y1}" width="${x1-x0}" height="${y1-y0}" class="anh-plane"/><path d="${g}" class="anh-grid"/></g>`}
  /* Innenwände der Bohrung (nur wenn sie ausschneidet) */
  const walls=(poly,z0,z1,base,inner)=>{const r=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;
   let n=[dy/L,-dx/L,0];if(inner)n=[-n[0],-n[1],0];if(n[0]*v[0]+n[1]*v[1]>=-1e-9)continue;
   const q=[P(a[0],a[1],z0),P(b[0],b[1],z0),P(b[0],b[1],z1),P(a[0],a[1],z1)],dep=(q[0][2]+q[1][2])/2,c=shade(n,base);
   r.push({dep,s:`<path d="M${pts(q)}Z" style="fill:${c};stroke:${c}" class="anh-w"/>`})}return r.sort((p,q)=>q.dep-p.dep).map(x=>x.s).join('')};
  if(cut)s+=walls(hole,0,m.t,'--anh-p',true);
  s+=walls(out,0,m.t,'--anh-p',false);
  /* Oberseite der Platte */
  const topP=out.map(q=>P(q[0],q[1],m.t));let d='M'+pts(topP)+'Z';
  if(cut)d+='M'+pts(hole.slice().reverse().map(q=>P(q[0],q[1],m.t)))+'Z';
  s+=`<path d="${d}" fill-rule="evenodd" style="fill:${shade([0,0,1],'--anh-p')}" class="anh-top"/>`;
  /* Teile über der Platte: Schrift und Zylinder, nach Tiefe sortiert */
  const items=[];
  if(m.txt){const z0=I.hidden?null:Math.max(m.z,m.t),z1=m.z+m.h,c=P(I.tx,m.B/2,(m.z+z1)/2);
   if(z0!=null){let t='';const base=-(m.B/2-I.capH/2);
    if(sp<.05){const a=P(I.tx-I.w/2,m.B/2,z0),b=P(I.tx+I.w/2,m.B/2,z1);t=`<path d="M${a[0]} ${a[1]}H${b[0]}V${b[1]}H${a[0]}Z" class="anh-tside"/>`}
    else{const n=Math.max(1,Math.min(30,Math.round((z1-z0)*cp*6)));
     for(let k=0;k<n;k++){const z=z0+(z1-z0)*k/n;t+=`<text transform="${M(z)}" x="${I.tx}" y="${base}" font-size="${I.fs}" text-anchor="middle" class="anh-tside">${esc(m.txt)}</text>`}
     t+=`<text transform="${M(z1)}" x="${I.tx}" y="${base}" font-size="${I.fs}" text-anchor="middle" class="anh-ttop">${esc(m.txt)}</text>`}
    items.push({dep:c[2],s:`<g class="anh-txt">${t}</g>`})}}
  if(!cut&&m.hole!=='none'){const H=m.t+(o.cylH??2),z0=m.hole==='bohrung'?0:(m.hx>=m.d/2?m.t:0),c=P(m.hx,m.B/2,H/2),isH=m.hole==='bohrung';
   let t=walls(hole,isH?0:z0,H,isH?'--anh-h':'--anh-p',false);
   t+=`<path d="M${pts(hole.map(q=>P(q[0],q[1],H)))}Z" style="fill:${shade([0,0,1],isH?'--anh-h':'--anh-p')}" class="anh-ctop"/>`;
   items.push({dep:c[2]-.5,s:`<g class="${isH?'anh-bohr':'anh-cyl'}">${t}</g>`})}
  items.sort((p,q)=>q.dep-p.dep);s+=items.map(i=>i.s).join('');
  /* Bemaßung in der Ebene z = 0 */
  if(dims){const a=3.2,y=-6,x=m.L+6,ar=(x1,y1,x2,y2)=>{const L=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/L,uy=(y2-y1)/L,h=2,w=.7;
    return `M${x1} ${y1}L${x2} ${y2}M${x1} ${y1}l${ux*h-uy*w} ${uy*h+ux*w}l${2*uy*w} ${-2*ux*w}zM${x2} ${y2}l${-ux*h-uy*w} ${-uy*h+ux*w}l${2*uy*w} ${-2*ux*w}z`};
   let g=`<path d="M0 ${-0}V${-y+2}M${m.L} 0V${-y+2}M${m.L} 0H${x+2}M${m.L} ${-m.B}H${x+2}" class="anh-dl"/>`;
   g+=`<path d="${ar(0,-y,m.L,-y)}${ar(x,0,x,-m.B)}" class="anh-da"/>`;
   g+=`<text x="${m.L/2}" y="${-y-1}" font-size="${a}" text-anchor="middle" class="anh-dt">${f1(m.L)}</text><text transform="translate(${x-1} ${-m.B/2}) rotate(-90)" font-size="${a}" text-anchor="middle" class="anh-dt">${f1(m.B)}</text>`;
   if(m.hole==='bohrung'){const hx=m.hx,hy=-m.B/2,R=m.d/2,lx=hx+R*.7,ly=hy-R*.7;g+=`<path d="M${hx-R*.7} ${hy+R*.7}L${lx+5} ${ly-6}h6" class="anh-dl"/><text x="${lx+5.3}" y="${ly-6.8}" font-size="${a}" class="anh-dt">Ø ${f1(m.d)}</text>`}
   s+=`<g transform="${M(m.t+.01)}">${g}</g>`}
  const R=o.fit?.5*Math.hypot(m.L+6,m.B+6)+1:.5*Math.hypot(Math.max(m.L,50)+14,Math.max(m.B,20)+14);
  svg.setAttribute('viewBox',o.fit?`${-R} ${-R*.8} ${2*R} ${1.6*R}`:`${-R} ${-R*.64} ${2*R} ${1.28*R}`);svg.innerHTML=s;st.onview&&st.onview()}
 const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 function to(y,p,ms=600){if(anim)cancelAnimationFrame(anim);const y0=yaw,p0=pitch,t0=performance.now();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){yaw=y;pitch=p;draw();return}
  const f=t=>{const k=Math.min(1,(t-t0)/ms),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;yaw=y0+(y-y0)*e;pitch=p0+(p-p0)*e;draw();if(k<1)anim=requestAnimationFrame(f)};anim=requestAnimationFrame(f)}
 if(o.drag!==false){let dr=null;
  svg.addEventListener('pointerdown',e=>{dr={x:e.clientX,y:e.clientY,yaw,pitch};svg.setPointerCapture(e.pointerId);if(anim)cancelAnimationFrame(anim)});
  svg.addEventListener('pointermove',e=>{if(!dr)return;yaw=dr.yaw-(e.clientX-dr.x)*.5;pitch=Math.max(0,Math.min(90,dr.pitch+(e.clientY-dr.y)*.5));draw()});
  const end=()=>{dr=null};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
  svg.addEventListener('keydown',e=>{const k={ArrowLeft:[8,0],ArrowRight:[-8,0],ArrowUp:[0,-6],ArrowDown:[0,6]}[e.key];if(!k)return;e.preventDefault();yaw+=k[0];pitch=Math.max(0,Math.min(90,pitch+k[1]));draw()});
  svg.tabIndex=0}
 Object.assign(st,{draw,to,set:nm=>{m={...m,...nm};draw()},get m(){return m},dims:on=>{dims=on;draw()}});
 draw();if(document.fonts)document.fonts.ready.then(draw);return st}
/* ---------- Werkstatt mit Reglern und Checkliste ---------- */
const ROWS=[['Grundplatte (Quader)','--anh-p',[['L','Länge',20,80,1],['B','Breite',10,40,1],['t','Dicke',1,6,.5],['r','Eckenradius',0,20,1]]],
 ['Loch (Zylinder)','--anh-h',[['d','Durchmesser Ø',2,12,.5],['hx','Mitte vom linken Rand',2,30,.5]]],
 ['Schrift (Text)','--anh-t',[['sz','Buchstabenhöhe',4,20,1],['h','Dicke der Schrift',.5,3,.5],['z','Unterkante über der Arbeitsebene',0,6,.5]]]];
function lab(root,o={}){
 const k=o.store?KEY+'-anh-'+o.store:null;let m={...DEF,...(o.m||{})};
 if(k){try{const s=JSON.parse(localStorage.getItem(k)||'null');if(s)m={...m,...s}}catch(e){}}
 let h=`<div class="anh"><div class="anh-view"><div class="fig"><svg class="anh-svg" role="img" aria-label="Drehbares 3D-Modell des Schlüsselanhängers"></svg></div>
<div class="vbtns" data-fest><button data-v="s">schräg</button><button data-v="o">Draufsicht</button><button data-v="v">Vorderansicht</button><label class="anh-dimt"><input type="checkbox" class="anh-dims"> Maße zeigen</label></div>
<p class="caption">Drehen: mit der Maus oder dem Finger ziehen. Ein Kästchen der Arbeitsebene ist 5 mm groß.</p>
<div class="anh-chk"><h4>Ist mein Anhänger druckbar?</h4><ul></ul><p class="anh-sum"></p></div></div><div class="anh-ctl">`;
 for(const [t,c,rows] of ROWS){h+=`<fieldset style="--fc:var(${c})"><legend>${t}</legend>`;
  if(c==='--anh-h')h+=`<div class="anh-seg" data-fest role="group" aria-label="Zylinder ist"><button data-hole="koerper">Körper</button><button data-hole="bohrung">Bohrung</button></div>`;
  if(c==='--anh-t')h+=`<label class="anh-r"><span>Text</span><input type="text" class="anh-txt" maxlength="8" autocomplete="off" spellcheck="false" aria-label="Text auf dem Anhänger"></label>`;
  for(const [id,n,a,b,s] of rows)h+=`<label class="anh-r"><span>${n}</span><input type="range" data-k="${id}" min="${a}" max="${b}" step="${s}" aria-label="${n}"><output data-o="${id}"></output></label>`;
  h+='</fieldset>'}
 h+=`<label class="anh-grp"><input type="checkbox" class="anh-g"> <span><b>Alles markieren und gruppieren</b> (Strg + G)</span></label></div></div>`;
 root.innerHTML=h;const q=s=>root.querySelector(s),qa=s=>[...root.querySelectorAll(s)];
 const v=view(q('.anh-svg'),{m});
 const sync=()=>{qa('[data-k]').forEach(i=>{i.value=m[i.dataset.k];q("[data-o=\""+i.dataset.k+"\"]").textContent=f1(m[i.dataset.k])+' mm'});
  q('.anh-txt').value=m.txt;q('.anh-g').checked=m.grp;qa('[data-hole]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.hole===m.hole))};
 const upd=()=>{v.set(m);const c=checks(m);q('.anh-chk ul').innerHTML=c.map(x=>`<li class="${x.ok?'ok':'bad'}" data-c="${x.k}"><b>${x.ok?'✓':'✗'}</b> ${x.t}${x.ok?'':`<small>${x.w}</small>`}</li>`).join('');
  const n=c.filter(x=>x.ok).length;q('.anh-sum').innerHTML=n===c.length?'<b>Druckbar!</b> Jetzt als STL exportieren.':`${n} von ${c.length} Punkten erfüllt.`;
  q('.anh-sum').className='anh-sum '+(n===c.length?'ok':'');
  if(k){try{localStorage.setItem(k,JSON.stringify(m))}catch(e){}}st.onchange&&st.onchange(m,c)};
 qa('[data-k]').forEach(i=>i.addEventListener('input',()=>{m[i.dataset.k]=+i.value;q("[data-o=\""+i.dataset.k+"\"]").textContent=f1(+i.value)+' mm';upd()}));
 q('.anh-txt').addEventListener('input',e=>{m.txt=e.target.value.slice(0,8);upd()});
 q('.anh-g').addEventListener('change',e=>{m.grp=e.target.checked;upd()});
 qa('[data-hole]').forEach(b=>b.onclick=()=>{m.hole=b.dataset.hole;sync();upd()});
 const V={s:[-28,40],o:[0,90],v:[0,0]};qa('[data-v]').forEach(b=>b.onclick=()=>v.to(...V[b.dataset.v]));
 q('.anh-dims').addEventListener('change',e=>v.dims(e.target.checked));
 const st={get m(){return m},load:nm=>{m={...DEF,...nm};sync();upd()},view:v,checks:()=>checks(m)};
 sync();setTimeout(upd);if(document.fonts)document.fonts.ready.then(upd);return st}
return {DEF,view,lab,checks,info,f1}})();

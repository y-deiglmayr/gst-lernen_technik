/* ===== TZ-Baukasten (Technisches Zeichnen): Körper aus Würfeln, Ansichten, drehbare 3D-Ansicht, Zeichenbrett mit Prüfung =====
   Koordinaten der Körper: x nach rechts, y nach oben, d nach hinten (d = 0 ist die Vorderseite). 1 Einheit = 1 Würfel.
   Ansichten (Projektionsmethode 1, wie im Unterricht): A von vorn, B von links (rechts neben A), C von oben (unter A).
   Sichtbarkeit: Ein Kantenstück ist verdeckt, wenn davor auf beiden Seiten der Kante Material liegt. */
const TZ=(()=>{
const C30=Math.cos(Math.PI/6),RAD=Math.PI/180;
/* ---------- Körper ---------- */
function body(def){
 const [W,H,D]=def.size,v=new Uint8Array(W*H*D);
 const fill=(b,val)=>{for(let x=b[0];x<b[3];x++)for(let y=b[1];y<b[4];y++)for(let d=b[2];d<b[5];d++)v[x+W*(y+H*d)]=val};
 def.boxes.forEach(b=>fill(b,1));(def.cut||[]).forEach(b=>fill(b,0));
 const get=(x,y,d)=>(x<0||y<0||d<0||x>=W||y>=H||d>=D)?0:v[x+W*(y+H*d)];
 const faces=[],edges=[],eset=new Set();
 const key=(a,b)=>{const s=a.join(','),t=b.join(',');return s<t?s+'|'+t:t+'|'+s};
 for(let x=0;x<W;x++)for(let y=0;y<H;y++)for(let d=0;d<D;d++){if(!get(x,y,d))continue;
  for(let k=0;k<3;k++)for(const s of [1,-1]){const n=[0,0,0];n[k]=s;if(get(x+n[0],y+n[1],d+n[2]))continue;
   const base=[x,y,d];if(s>0)base[k]+=1;const i=(k+1)%3,j=(k+2)%3;
   const c1=base.slice();c1[i]+=1;const c3=base.slice();c3[j]+=1;const c2=c1.slice();c2[j]+=1;
   faces.push({c:[base,c1,c2,c3],n,k})}}
 const dims=[W,H,D];
 for(let k=0;k<3;k++){const i=(k+1)%3,j=(k+2)%3;
  for(let t=0;t<dims[k];t++)for(let a=0;a<=dims[i];a++)for(let b=0;b<=dims[j];b++){
   const g=(da,db)=>{const p=[0,0,0];p[k]=t;p[i]=a+da;p[j]=b+db;return get(p[0],p[1],p[2])};
   const q=[g(-1,-1),g(0,-1),g(-1,0),g(0,0)],n=q[0]+q[1]+q[2]+q[3];
   if(n===1||n===3||(n===2&&q[0]===q[3])){const p0=[0,0,0];p0[k]=t;p0[i]=a;p0[j]=b;const p1=p0.slice();p1[k]+=1;edges.push([p0,p1]);eset.add(key(p0,p1))}}}
 return {W,H,D,get,faces,edges,isEdge:(a,b)=>eset.has(key(a,b)),def}}
/* ---------- Projektionen: p -> [x, y (nach oben), Tiefe]; .v = Blickrichtung in Körperkoordinaten ---------- */
function mk(f,v){f.v=v;return f}
const PROJ={
 front:mk(p=>[p[0],p[1],p[2]],[0,0,1]),
 left:mk(p=>[-p[2],p[1],p[0]],[1,0,0]),
 top:mk(p=>[p[0],p[2],-p[1]],[0,-1,0]),
 iso:mk(p=>[(p[0]+p[2])*C30,p[1]+(p[2]-p[0])*.5,(-p[0]-p[1]+p[2])/Math.sqrt(3)],[-1,-1,1]),
 cav:(k=.5,a=45)=>{const c=k*Math.cos(a*RAD),s=k*Math.sin(a*RAD);return mk(p=>[p[0]+c*p[2],p[1]+s*p[2],p[2]],[-c,-s,1])},
 rot:(yaw,pitch)=>{const cy=Math.cos(yaw*RAD),sy=Math.sin(yaw*RAD),cp=Math.cos(pitch*RAD),sp=Math.sin(pitch*RAD);
  const f=p=>{const X=p[0],Y=p[1],Z=-p[2],X1=X*cy+Z*sy,Z1=-X*sy+Z*cy,Y2=Y*cp-Z1*sp,Z2=Y*sp+Z1*cp;return [X1,Y2,-Z2]};
  const o=f([0,0,0]),g=e=>f(e)[2]-o[2];return mk(f,[g([1,0,0]),g([0,1,0]),g([0,0,1])])}};
/* ---------- Linien einer Ansicht (sichtbar/verdeckt) ---------- */
function lines(b,P){
 const fq=[];
 for(const f of b.faces){const c=f.c.map(P),ux=c[1][0]-c[0][0],uy=c[1][1]-c[0][1],vx=c[3][0]-c[0][0],vy=c[3][1]-c[0][1],det=ux*vy-uy*vx;
  if(Math.abs(det)<1e-9)continue;const xs=c.map(q=>q[0]),ys=c.map(q=>q[1]);
  fq.push({c,ux,uy,vx,vy,det,x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)})}
 const cov=(x,y,dep)=>fq.some(q=>{if(x<q.x0||x>q.x1||y<q.y0||y>q.y1)return false;const px=x-q.c[0][0],py=y-q.c[0][1],u=(px*q.vy-py*q.vx)/q.det,v=(q.ux*py-q.uy*px)/q.det;
  if(u<=1e-7||u>=1-1e-7||v<=1e-7||v>=1-1e-7)return false;return q.c[0][2]+u*(q.c[1][2]-q.c[0][2])+v*(q.c[3][2]-q.c[0][2])<dep-0.05});
 const m=new Map();
 for(const [p0,p1] of b.edges){const a=P(p0),c=P(p1),dx=c[0]-a[0],dy=c[1]-a[1],L=Math.hypot(dx,dy);if(L<1e-6)continue;
  const mx=(a[0]+c[0])/2,my=(a[1]+c[1])/2,md=(a[2]+c[2])/2,nx=-dy/L*.01,ny=dx/L*.01;
  const vis=!(cov(mx+nx,my+ny,md)&&cov(mx-nx,my-ny,md));
  const r=v=>Math.round(v*1e4)/1e4,A=[r(a[0]),r(a[1])],B=[r(c[0]),r(c[1])],k=A.join()<B.join()?A.join()+'|'+B.join():B.join()+'|'+A.join();
  const o=m.get(k);if(o)o.vis=o.vis||vis;else m.set(k,{a:A,b:B,vis})}
 return merge([...m.values()])}
function merge(pcs){
 const groups=new Map();
 for(const p of pcs){let a=p.a,b=p.b;let dx=b[0]-a[0],dy=b[1]-a[1];if(dx<-1e-9||(Math.abs(dx)<=1e-9&&dy<0)){[a,b]=[b,a];dx=-dx;dy=-dy}
  const L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,off=Math.round((a[0]*uy-a[1]*ux)*1e3),ang=Math.round(Math.atan2(uy,ux)*1e3);
  const k=ang+'|'+off+'|'+p.vis;if(!groups.has(k))groups.set(k,{ux,uy,vis:p.vis,list:[]});const g=groups.get(k);
  g.list.push([a[0]*ux+a[1]*uy,b[0]*ux+b[1]*uy,a,b])}
 const out=[];
 for(const g of groups.values()){g.list.sort((p,q)=>p[0]-q[0]);let cur=null;
  for(const it of g.list){if(cur&&it[0]<=cur[1]+1e-6){if(it[1]>cur[1]){cur[1]=it[1];cur[3]=it[3]}}else{if(cur)out.push({a:cur[2],b:cur[3],vis:g.vis});cur=it.slice()}}
  if(cur)out.push({a:cur[2],b:cur[3],vis:g.vis})}
 /* verdeckte Stücke, die auf sichtbaren liegen, entfernen */
 const visL=out.filter(s=>s.vis);
 const onVis=(p,dir)=>visL.some(s=>{const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],L=Math.hypot(dx,dy);if(Math.abs(dir[0]*dy/L-dir[1]*dx/L)>1e-3)return false;return segDist(p,s.a,s.b)<1e-4});
 const res=[];
 for(const s of out){if(s.vis){res.push(s);continue}
  const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],L=Math.hypot(dx,dy),dir=[dx/L,dy/L],n=Math.max(1,Math.round(L*8));let run=null;
  for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,mid=[s.a[0]+dx*(t0+t1)/2,s.a[1]+dy*(t0+t1)/2],hid=!onVis(mid,dir);
   if(hid){if(!run)run=[t0,t1];else run[1]=t1}else if(run){res.push(sub(s,run));run=null}}
  if(run)res.push(sub(s,run))}
 return res}
const sub=(s,[t0,t1])=>{const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1];return {a:[s.a[0]+dx*t0,s.a[1]+dy*t0],b:[s.a[0]+dx*t1,s.a[1]+dy*t1],vis:s.vis}};
function segDist(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy;let t=L2?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L2:0;t=Math.max(0,Math.min(1,t));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
/* ---------- Ansichten auf dem Blatt (mm, y nach unten) ---------- */
/* Achsenkreuz bei (AX, AY), Hilfslinien im Abstand g, Würfelgröße u (mm) */
function threeViews(b,o){const {AX,AY,g,u}=o,{W,D}=b,out={};
 const tr=(segs,f)=>segs.map(s=>({a:f(s.a),b:f(s.b),vis:s.vis}));
 out.A=tr(lines(b,PROJ.front),p=>[AX-g-(W-p[0])*u,AY-g-p[1]*u]);
 out.B=tr(lines(b,PROJ.left),p=>[AX+g+(p[0]+D)*u,AY-g-p[1]*u]);
 out.C=tr(lines(b,PROJ.top),p=>[AX-g-(W-p[0])*u,AY+g+(D-p[1])*u]);
 return out}
function axesSVG(o){const {AX,AY,g,w,h,m=10}=o;let s='';
 s+=`<line x1="${m}" y1="${AY}" x2="${w-m}" y2="${AY}" class="tz-ax"/><line x1="${AX}" y1="${m}" x2="${AX}" y2="${h-m}" class="tz-ax"/>`;
 for(const y of [AY-g,AY+g])s+=`<line x1="${m}" y1="${y}" x2="${w-m}" y2="${y}" class="tz-hl"/>`;
 for(const x of [AX-g,AX+g])s+=`<line x1="${x}" y1="${m}" x2="${x}" y2="${h-m}" class="tz-hl"/>`;
 const L=Math.min(w,h)-m-Math.max(AX,AY)-g;s+=`<line x1="${AX+g}" y1="${AY+g}" x2="${AX+g+L}" y2="${AY+g+L}" class="tz-hl"/>`;
 return s}
const segSVG=(segs,cls='')=>segs.map(s=>`<line x1="${+s.a[0].toFixed(3)}" y1="${+s.a[1].toFixed(3)}" x2="${+s.b[0].toFixed(3)}" y2="${+s.b[1].toFixed(3)}" class="${s.vis?'tz-v':'tz-h'} ${cls}"/>`).join('');
/* Linienbild einer Ansicht als eigenständiges SVG (Einheiten = Würfel) */
function viewSVG(segs,label,pad=.5){if(!segs.length)return '';const xs=segs.flatMap(s=>[s.a[0],s.b[0]]),ys=segs.flatMap(s=>[s.a[1],s.b[1]]);
 const x0=Math.min(...xs)-pad,x1=Math.max(...xs)+pad,y0=Math.min(...ys)-pad,y1=Math.max(...ys)+pad;
 const fl=segs.map(s=>({a:[s.a[0],-s.a[1]],b:[s.b[0],-s.b[1]],vis:s.vis}));
 return `<svg class="tz-mini" viewBox="${x0} ${-y1} ${x1-x0} ${y1-y0}" role="img" aria-label="${label||'Ansicht'}">${segSVG(fl)}</svg>`}
/* Dreitafelprojektion fertig gezeichnet (für Lösungen, Merke, Aufgaben) */
function threeViewSVG(b,o={}){const u=o.u||10,g=o.g||10,W=b.W*u,H=b.H*u,D=b.D*u,m=8;
 const AX=m+W+g+6,AY=m+H+g+6,w=AX+g+D+m+6,h=AY+g+D+m+6,v=threeViews(b,{AX,AY,g,u});
 let s=`<svg class="tz-dt" viewBox="0 0 ${w} ${h}" role="img" aria-label="${o.label||'Dreitafelprojektion'}">`+axesSVG({AX,AY,g,w,h,m:2});
 s+=segSVG([...v.A,...v.B,...v.C]);
 if(o.labels!==false){s+=`<text x="${AX-g-W/2}" y="${AY-g-H-2.5}" text-anchor="middle" class="tz-lbl">A</text><text x="${AX+g+D/2}" y="${AY-g-H-2.5}" text-anchor="middle" class="tz-lbl">B</text><text x="${AX-g-W-3}" y="${AY+g+D/2+1.5}" text-anchor="end" class="tz-lbl">C</text>`}
 return s+'</svg>'}
/* ---------- Drehbare 3D-Ansicht ---------- */
function viewer(svg,b0,o={}){
 let b=b0,yaw=o.yaw??32,pitch=o.pitch??24,mode=o.mode||'rot',cav=o.cav||{k:.5,a:45},anim=null,arrows=o.arrows!==false;
 const st={};
 function P(){return mode==='rot'?PROJ.rot(yaw,pitch):mode==='iso'?PROJ.iso:PROJ.cav(cav.k,cav.a)}
 function draw(){const p=P(),v=p.v,vl=Math.hypot(...v),{W,H,D}=b,cx=W/2,cy=H/2,cd=D/2,R=.5*Math.hypot(W,H,D)+(arrows?2.3:.6);
  const pc=q=>p([q[0]-cx,q[1]-cy,q[2]-cd]);
  const items=[];
  for(const f of b.faces){const dot=f.n[0]*v[0]+f.n[1]*v[1]+f.n[2]*v[2];if(dot>=-1e-9)continue;
   const c=f.c.map(pc),dep=(f.c.reduce((s,q)=>s+(q[0]-cx)*v[0]+(q[1]-cy)*v[1]+(q[2]-cd)*v[2],0))/4/vl;
   let e='';for(let i=0;i<4;i++){const A=f.c[i],B=f.c[(i+1)%4];if(b.isEdge(A,B)){const a=c[i],bb=c[(i+1)%4];e+=`M${a[0].toFixed(3)} ${(-a[1]).toFixed(3)}L${bb[0].toFixed(3)} ${(-bb[1]).toFixed(3)}`}}
   items.push({dep,s:`<path d="M${c.map(q=>q[0].toFixed(3)+' '+(-q[1]).toFixed(3)).join('L')}Z" class="tz-f${f.k}"/>`+(e?`<path d="${e}" class="tz-e"/>`:'')})}
  if(arrows){const L=1.6,sp=.55;
   const arr=[['A',[0,0,-1],[cx,cy,-sp]],['B',[-1,0,0],[-sp,cy,cd]],['C',[0,1,0],[cx,H+sp,cd]]];
   for(const [n,dir,tip] of arr){const tail=[tip[0]+dir[0]*L,tip[1]+dir[1]*L,tip[2]+dir[2]*L],t=pc(tip),a=pc(tail),
     dep=((tail[0]-cx)*v[0]+(tail[1]-cy)*v[1]+(tail[2]-cd)*v[2])/vl;
    const dx=t[0]-a[0],dy=t[1]-a[1],l=Math.hypot(dx,dy);let s='';
    if(l>.15){const ux=dx/l,uy=dy/l,h=.32;s+=`<path d="M${a[0]} ${-a[1]}L${t[0]-ux*h} ${-(t[1]-uy*h)}" class="tz-arr"/><path d="M${t[0]} ${-t[1]}L${t[0]-ux*h-uy*h*.6} ${-(t[1]-uy*h+ux*h*.6)}L${t[0]-ux*h+uy*h*.6} ${-(t[1]-uy*h-ux*h*.6)}Z" class="tz-arrh"/>`}
    s+=`<circle cx="${a[0]}" cy="${-a[1]}" r=".36" class="tz-arrc"/><text x="${a[0]}" y="${-a[1]+.15}" text-anchor="middle" class="tz-arrt">${n}</text>`;
    items.push({dep:dep+.3,s})}}
  items.sort((p,q)=>q.dep-p.dep);
  svg.setAttribute('viewBox',`${-R} ${-R} ${2*R} ${2*R}`);
  svg.innerHTML=items.map(i=>i.s).join('');
  st.onview&&st.onview()}
 function to(y,p,ms=700){if(anim)cancelAnimationFrame(anim);const y0=yaw,p0=pitch,t0=performance.now();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){yaw=y;pitch=p;draw();return}
  const f=t=>{const k=Math.min(1,(t-t0)/ms),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;yaw=y0+(y-y0)*e;pitch=p0+(p-p0)*e;draw();if(k<1)anim=requestAnimationFrame(f)};anim=requestAnimationFrame(f)}
 /* Ziehen dreht den Körper */
 let drag=null;
 svg.addEventListener('pointerdown',e=>{if(mode!=='rot')return;drag={x:e.clientX,y:e.clientY,yaw,pitch};svg.setPointerCapture(e.pointerId);if(anim)cancelAnimationFrame(anim)});
 svg.addEventListener('pointermove',e=>{if(!drag)return;yaw=drag.yaw-(e.clientX-drag.x)*.6;pitch=Math.max(-89.9,Math.min(89.9,drag.pitch+(e.clientY-drag.y)*.6));draw()});
 const end=()=>{drag=null};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
 svg.addEventListener('keydown',e=>{if(mode!=='rot')return;const m={ArrowLeft:[8,0],ArrowRight:[-8,0],ArrowUp:[0,-8],ArrowDown:[0,8]}[e.key];if(!m)return;e.preventDefault();yaw+=m[0];pitch=Math.max(-89.9,Math.min(89.9,pitch+m[1]));draw()});
 svg.tabIndex=0;
 Object.assign(st,{draw,to,set:nb=>{b=nb;draw()},mode:(m,c)=>{mode=m;if(c)cav=c;draw()},get yaw(){return yaw},get pitch(){return pitch},arrows:a=>{arrows=a;draw()}});
 draw();return st}
const VIEWS={A:[0,0],B:[90,0],C:[0,89.9],schraeg:[32,24],iso:[-45,35.264]};
/* ---------- Zeichenbrett ---------- */
/* o: {w,h (mm), mode:'karo'|'iso'|'frei', step (mm), under (SVG-Text unter den Linien), onchange} */
function board(svg,o){
 const st={segs:[],type:'v',tool:'draw',undo:[]};const step=o.step||5,w=o.w,h=o.h;
 svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.classList.add('tz-board');
 let bg='';
 if(o.mode==='iso'){const dx=step*C30;for(let x=0;x<=w+1e-6;x+=dx)bg+=`<line x1="${x}" y1="0" x2="${x}" y2="${h}" class="tz-g"/>`;
  const t=Math.tan(Math.PI/6);for(let c=-w*t-h;c<=h+w*t;c+=step){bg+=`<line x1="0" y1="${c}" x2="${w}" y2="${c+w*t}" class="tz-g"/><line x1="0" y1="${c+w*t}" x2="${w}" y2="${c}" class="tz-g"/>`}}
 else{for(let x=0;x<=w;x+=step)bg+=`<line x1="${x}" y1="0" x2="${x}" y2="${h}" class="tz-g"/>`;for(let y=0;y<=h;y+=step)bg+=`<line x1="0" y1="${y}" x2="${w}" y2="${y}" class="tz-g"/>`}
 svg.innerHTML=`<rect width="${w}" height="${h}" class="tz-paper"/><g>${bg}</g><g class="tz-under">${o.under||''}</g><g class="tz-segs"></g><g class="tz-ovl"></g><g class="tz-ui"></g>`;
 const gS=svg.querySelector('.tz-segs'),gO=svg.querySelector('.tz-ovl'),gU=svg.querySelector('.tz-ui');
 const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return [q.x,q.y]};
 const pxmm=()=>svg.getBoundingClientRect().width/w;
 const ends=()=>st.segs.flatMap(s=>[s.a,s.b]);
 function snapStart(p){
  if(o.mode==='iso'){const dx=step*C30,a=Math.round(p[0]/dx),b=Math.round(p[1]/step-a/2);return [a*dx,(b+a/2)*step]}
  if(o.mode==='frei'){const r=Math.max(2,10/pxmm());let best=null,bd=r;for(const q of ends()){const d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<bd){bd=d;best=q}}if(best)return best.slice()}
  return [Math.round(p[0]/step)*step,Math.round(p[1]/step)*step]}
 function snapEnd(s,p){const dx=p[0]-s[0],dy=p[1]-s[1];
  if(o.mode==='karo'){if(Math.abs(dx)>=Math.abs(dy))return {p:[s[0]+Math.round(dx/step)*step,s[1]]};return {p:[s[0],s[1]+Math.round(dy/step)*step]}}
  if(o.mode==='iso'){const dirs=[[0,1],[0,-1],[C30,.5],[C30,-.5],[-C30,.5],[-C30,-.5]];let best=dirs[0],bd=-1e9;for(const d of dirs){const v=d[0]*dx+d[1]*dy;if(v>bd){bd=v;best=d}}
   const n=Math.max(0,Math.round(bd/step));return {p:[s[0]+best[0]*n*step,s[1]+best[1]*n*step]}}
  /* frei: Winkel in 15°-Schritten, Länge in ganzen mm; nahe an einem Endpunkt einrasten */
  const r=Math.max(1.6,9/pxmm());for(const q of ends()){if(Math.hypot(q[0]-p[0],q[1]-p[1])<r&&(q[0]!==s[0]||q[1]!==s[1]))return {p:q.slice(),snap:true}}
  const ang=Math.round(Math.atan2(-dy,dx)/(15*RAD))*15,L=Math.max(0,Math.round(dx*Math.cos(ang*RAD)-dy*Math.sin(ang*RAD)));
  return {p:[s[0]+L*Math.cos(ang*RAD),s[1]-L*Math.sin(ang*RAD)],ang:(ang+360)%360,L}}
 function render(){gS.innerHTML=segSVG(st.segs.map(s=>({a:s.a,b:s.b,vis:s.t==='v'})));o.onchange&&o.onchange()}
 let cur=null;
 svg.addEventListener('pointerdown',e=>{if(e.button>0)return;const p=pt(e);
  if(st.tool==='erase'){const r=Math.max(2,12/pxmm());let bi=-1,bd=r;st.segs.forEach((s,i)=>{const d=segDist(p,s.a,s.b);if(d<bd){bd=d;bi=i}});
   if(bi>=0){st.undo.push(st.segs.slice());st.segs.splice(bi,1);render();clearOvl()}return}
  cur={s:snapStart(p),e:null};svg.setPointerCapture(e.pointerId);e.preventDefault();ui(p)});
 svg.addEventListener('pointermove',e=>{const p=pt(e);if(!cur){hover(p);return}cur.e=snapEnd(cur.s,p);ui(p)});
 svg.addEventListener('pointerup',e=>{if(!cur)return;const c=cur;cur=null;gU.innerHTML='';
  if(c.e){const a=c.s,b=c.e.p;if(Math.hypot(b[0]-a[0],b[1]-a[1])>.5){st.undo.push(st.segs.slice());st.segs.push({a:a.map(v=>+v.toFixed(4)),b:b.map(v=>+v.toFixed(4)),t:st.type});render();clearOvl()}}});
 svg.addEventListener('pointercancel',()=>{cur=null;gU.innerHTML=''});
 svg.addEventListener('pointerleave',()=>{if(!cur)gU.innerHTML=''});
 function hover(p){if(st.tool==='erase'||matchMedia('(pointer:coarse)').matches){gU.innerHTML='';return}const s=snapStart(p);gU.innerHTML=`<circle cx="${s[0]}" cy="${s[1]}" r="1.1" class="tz-snap"/>`}
 function ui(p){if(!cur)return;let s=`<circle cx="${cur.s[0]}" cy="${cur.s[1]}" r="1.1" class="tz-snap"/>`;
  if(cur.e){const a=cur.s,b=cur.e.p,L=Math.hypot(b[0]-a[0],b[1]-a[1]);
   s+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="${st.type==='v'?'tz-v':'tz-h'} tz-prev"/><circle cx="${b[0]}" cy="${b[1]}" r="1.1" class="tz-snap"/>`;
   let t=Math.round(L)+' mm';if(o.mode==='frei'&&!cur.e.snap)t+=' · '+cur.e.ang+'°';
   const tx=Math.min(w-2,Math.max(2,b[0]+3)),ty=Math.max(6,b[1]-4),fs=Math.max(4,13/pxmm());
   s+=`<text x="${tx}" y="${ty}" class="tz-len" style="font-size:${fs}px" ${tx>w-30?'text-anchor="end"':''}>${t}</text>`}
  gU.innerHTML=s}
 const clearOvl=()=>{gO.innerHTML=''};
 Object.assign(st,{render,clearOvl,
  setType:t=>{st.type=t},setTool:t=>{st.tool=t;svg.classList.toggle('erasing',t==='erase')},
  undoStep:()=>{if(st.undo.length){st.segs=st.undo.pop();render();clearOvl()}},
  clear:()=>{if(st.segs.length){st.undo.push(st.segs.slice());st.segs=[];render();clearOvl()}},
  overlay:s=>{gO.innerHTML=s},
  load:segs=>{st.segs=segs.map(s=>({a:s.a.slice(),b:s.b.slice(),t:s.t}));render()}});
 return st}
/* ---------- Vergleich: erwartete Linien <-> gezeichnete Linien (mm) ---------- */
function compare(exp,stu,o={}){const tol=o.tol||.7,ign=!!o.ignoreHidden;
 const E=exp.filter(e=>!(ign&&!e.vis)),S=stu.filter(s=>!(ign&&s.t==='h'));
 const dir=s=>{const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],L=Math.hypot(dx,dy)||1;return [dx/L,dy/L,L]};
 const par=(d1,d2)=>Math.abs(d1[0]*d2[1]-d1[1]*d2[0])<.06;
 const miss=[],wrong=[],extra=[];let nMiss=0,nWrong=0;
 for(const e of E){const de=dir(e),n=Math.max(2,Math.ceil(de[2]/1));let m=0,wr=0,runM=null,runW=null;
  const pushRun=(arr,r)=>arr.push({a:[e.a[0]+(e.b[0]-e.a[0])*r[0],e.a[1]+(e.b[1]-e.a[1])*r[0]],b:[e.a[0]+(e.b[0]-e.a[0])*r[1],e.a[1]+(e.b[1]-e.a[1])*r[1]],vis:e.vis});
  for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,t=(t0+t1)/2,p=[e.a[0]+(e.b[0]-e.a[0])*t,e.a[1]+(e.b[1]-e.a[1])*t];
   let same=false,other=false;for(const s of S){if(!par(de,dir(s)))continue;if(segDist(p,s.a,s.b)<=tol){if((s.t==='v')===e.vis)same=true;else other=true}}
   const isM=!same&&!other,isW=!same&&other;
   if(isM){m++;if(!runM)runM=[t0,t1];else runM[1]=t1}else if(runM){pushRun(miss,runM);runM=null}
   if(isW){wr++;if(!runW)runW=[t0,t1];else runW[1]=t1}else if(runW){pushRun(wrong,runW);runW=null}}
  if(runM)pushRun(miss,runM);if(runW)pushRun(wrong,runW);
  if(m*de[2]/n>tol*1.2)nMiss++;if(wr*de[2]/n>tol*1.2)nWrong++}
 let nExtra=0;
 for(const s of S){const ds=dir(s),n=Math.max(2,Math.ceil(ds[2]/1));let x=0,run=null;
  for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,t=(t0+t1)/2,p=[s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t];
   const ok=E.some(e=>par(ds,dir(e))&&segDist(p,e.a,e.b)<=tol)||(ign&&false);
   if(!ok){x++;if(!run)run=[t0,t1];else run[1]=t1}else if(run){extra.push({a:[s.a[0]+(s.b[0]-s.a[0])*run[0],s.a[1]+(s.b[1]-s.a[1])*run[0]],b:[s.a[0]+(s.b[0]-s.a[0])*run[1],s.a[1]+(s.b[1]-s.a[1])*run[1]]});run=null}}
  if(run)extra.push({a:[s.a[0]+(s.b[0]-s.a[0])*run[0],s.a[1]+(s.b[1]-s.a[1])*run[0]],b:[s.a[0]+(s.b[0]-s.a[0])*run[1],s.a[1]+(s.b[1]-s.a[1])*run[1]]});
  if(x*ds[2]/n>tol*1.5)nExtra++}
 return {ok:!nMiss&&!nWrong&&!nExtra,nMiss,nWrong,nExtra,miss,wrong,extra}}
function diffSVG(r){const L=(s,c)=>`<line x1="${s.a[0]}" y1="${s.a[1]}" x2="${s.b[0]}" y2="${s.b[1]}" class="${c}"/>`;
 return r.miss.map(s=>L(s,'tz-miss')).join('')+r.wrong.map(s=>L(s,'tz-wrong')).join('')+r.extra.map(s=>L(s,'tz-extra')).join('')}
function bbox(segs){const xs=segs.flatMap(s=>[s.a[0],s.b[0]]),ys=segs.flatMap(s=>[s.a[1],s.b[1]]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]}
const shift=(segs,dx,dy)=>segs.map(s=>({...s,a:[s.a[0]+dx,s.a[1]+dy],b:[s.b[0]+dx,s.b[1]+dy]}));
/* Räumliche Zeichnung (iso/cav) eines Körpers in mm, y nach unten */
function spatial(b,P,u){return lines(b,P).map(s=>({a:[s.a[0]*u,-s.a[1]*u],b:[s.b[0]*u,-s.b[1]*u],vis:s.vis}))}
/* gezeichnete Linien an der erwarteten Zeichnung ausrichten (Lage auf dem Blatt ist frei) */
function compareFree(exp,stu,o){const sv=stu.filter(s=>s.t==='v');if(!sv.length)return compare(exp,stu,o);
 const be=bbox(exp.filter(e=>e.vis)),bs=bbox(sv);return {...compare(shift(exp,bs[0]-be[0],bs[1]-be[1]),stu,o),dx:bs[0]-be[0],dy:bs[1]-be[1]}}
return {body,PROJ,lines,threeViews,axesSVG,segSVG,viewSVG,threeViewSVG,viewer,VIEWS,board,compare,compareFree,diffSVG,spatial,shift,bbox,C30}})();

/* Antwortreihenfolge bei jedem Laden zufällig mischen – für alle GST-Lernpfade.
   Damit die Reihenfolge der Auswahlmöglichkeiten nichts über die richtige Lösung verrät.
   Gemischt werden:
   - Auswahlfelder <select> in Aufgaben (mit data-a / data-ans, oder in .selbox, [data-task], [data-mischen]).
     Platzhalter (value="") bleiben oben, die gewählte Antwort bleibt gewählt.
     Gleiche Antwortlisten bekommen auf einer Seite dieselbe (zufällige) Reihenfolge – das bleibt übersichtlich.
     Reine Zahlenlisten (1, 2, 3 …) bleiben geordnet.
   - Multiple-Choice-Knöpfe: .mc button[data-k] bzw. [data-j]
   - Mehrfachauswahl: .multi label (Ankreuzfelder)
   - Kinder jedes Containers mit Attribut data-mischen (z. B. Wortbausteine)
   Ausnahme: Attribut data-fest am Element oder einem Vorfahren.
   Auch später per JavaScript erzeugte Aufgaben werden gemischt (MutationObserver).
   Die Prüf-Logik der Seiten arbeitet mit Werten/Kennungen (data-a, data-k, data-ok), nicht mit Positionen. */
(function(){
  'use strict';
  var done=new WeakSet(),perms=new Map();
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  /* Mischen, bis höchstens ein Drittel der Einträge auf dem alten Platz steht (sonst bliebe die Reihenfolge oft fast gleich) */
  function mix(a,same){var n=a.length,lim=Math.floor(n/3),best=null,bf=n+1;
    for(var t=0;t<30;t++){var r=shuffle(a.slice()),f=0;for(var i=0;i<n;i++)if(same(r[i],a[i]))f++;if(f<bf){best=r;bf=f}if(f<=lim)break}
    return best}
  function fest(el){return !!(el.closest&&el.closest('[data-fest]'))}
  function isNum(t){return /^\s*[−-]?\d+([.,]\d+)?\s*(°|%)?\s*$/.test(t)}
  /* Elemente auf ihren bisherigen Plätzen untereinander vertauschen (andere Geschwister bleiben stehen) */
  function swapInPlace(els){
    if(els.length<2)return;
    var order=mix(els,function(x,y){return x===y});
    var slots=els.map(function(e){var c=document.createComment('');e.parentNode.replaceChild(c,e);return c});
    slots.forEach(function(c,i){c.parentNode.replaceChild(order[i],c)});
  }
  function byParent(els){var m=new Map();els.forEach(function(e){var p=e.parentNode;if(!m.has(p))m.set(p,[]);m.get(p).push(e)});return m}
  function fresh(els){return els.some(function(e){return !done.has(e)})}
  function mark(els){els.forEach(function(e){done.add(e)})}

  function mixSelect(s){
    if(fest(s))return;
    if(!(s.matches('[data-a],[data-ans]')||s.closest('.selbox,[data-task],[data-mischen]')))return;
    var opts=[].slice.call(s.options),rest=opts.filter(function(o){return o.value!==''});
    if(rest.length<2||!fresh(rest))return;
    mark(rest);
    if(rest.every(function(o){return isNum(o.textContent)}))return;
    var key=function(o){return o.value+'\u0001'+o.textContent};
    var sig=rest.map(key).sort().join('\u0002'),order=perms.get(sig);
    if(!order){
      order=mix(rest.map(key),function(x,y){return x===y});
      perms.set(sig,order);
    }
    var v=s.value,sel=s.selectedIndex;
    rest.sort(function(a,b){return order.indexOf(key(a))-order.indexOf(key(b))});
    rest.forEach(function(o){s.appendChild(o)});
    if(sel>=0)s.value=v;
  }
  function mixGroup(els){
    els=els.filter(function(e){return !fest(e)});
    if(!fresh(els))return;
    mark(els);
    byParent(els).forEach(function(g){swapInPlace(g)});
  }
  function run(root){
    if(!root||!root.querySelectorAll)return;
    var q=function(sel){var r=[].slice.call(root.querySelectorAll(sel));if(root.matches&&root.matches(sel))r.unshift(root);return r};
    q('select').forEach(mixSelect);
    q('.mc').forEach(function(box){mixGroup([].slice.call(box.querySelectorAll('button[data-k],button[data-j]')))});
    q('.multi').forEach(function(box){mixGroup([].slice.call(box.querySelectorAll('label')))});
    q('[data-mischen]').forEach(function(box){if(box.tagName!=='SELECT')mixGroup([].slice.call(box.children))});
  }
  function start(){
    run(document.body);
    if(!window.MutationObserver)return;
    var obs=new MutationObserver(function(list){
      var roots=new Set();
      list.forEach(function(m){
        var t=m.target;
        if(t.nodeType!==1)return;
        var up=t.closest('select,.mc,.multi,[data-mischen]');
        roots.add(up||t);
      });
      roots.forEach(run);
      obs.takeRecords();
    });
    obs.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

/* Hell/Dunkel-Umschaltung für alle GST-Lernpfade.
   Wahl wird nur im Browser gespeichert (localStorage "gst-theme": "light" | "dark", fehlt = wie das Gerät).
   Früh im <head> laden (ohne defer), damit beim Seitenaufbau nichts aufblitzt. */
(function(){
  var KEY='gst-theme',root=document.documentElement;
  function get(){try{return localStorage.getItem(KEY)||'auto'}catch(e){return 'auto'}}
  function apply(m){if(m==='light'||m==='dark')root.setAttribute('data-theme',m);else root.removeAttribute('data-theme')}
  function isDark(){var m=get();return m==='dark'||(m==='auto'&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)}
  function set(m){try{if(m==='auto')localStorage.removeItem(KEY);else localStorage.setItem(KEY,m)}catch(e){}apply(m);update()}
  apply(get());
  var SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>';
  var MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  var AUTO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>';
  var btns=[],groups=[];
  function update(){
    var d=isDark(),m=get();
    btns.forEach(function(b){b.innerHTML=d?SUN:MOON;var t=d?'Hellen Modus einschalten':'Dunklen Modus einschalten';b.title=t;b.setAttribute('aria-label',t)});
    groups.forEach(function(g){g.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.mode===m?'true':'false')})});
  }
  if(window.matchMedia){var mq=matchMedia('(prefers-color-scheme: dark)');(mq.addEventListener?mq.addEventListener('change',update):mq.addListener(update))}
  window.addEventListener('storage',function(e){if(e.key===KEY){apply(get());update()}});
  function mount(){
    /* Startseite: Auswahl Automatisch / Hell / Dunkel in einem Platzhalter <div data-theme-switch></div> */
    document.querySelectorAll('[data-theme-switch]').forEach(function(box){
      var g=document.createElement('div');g.className='theme-switch';g.setAttribute('role','group');g.setAttribute('aria-label','Darstellung');
      [['auto',AUTO,'Automatisch'],['light',SUN,'Hell'],['dark',MOON,'Dunkel']].forEach(function(o){
        var b=document.createElement('button');b.type='button';b.className='theme-btn';b.dataset.mode=o[0];b.innerHTML=o[1]+'<span>'+o[2]+'</span>';
        b.title=o[0]==='auto'?'Wie am Gerät eingestellt':o[2]+'er Modus';b.setAttribute('aria-label',o[2]);
        b.addEventListener('click',function(){set(o[0])});g.appendChild(b)});
      box.appendChild(g);groups.push(g)});
    /* Lernpfade: kleiner Knopf rechts in der Navigation */
    var nav=document.querySelector('nav .wrap');
    if(nav&&!document.querySelector('[data-theme-switch]')){
      var b=document.createElement('button');b.type='button';b.className='theme-btn';
      b.addEventListener('click',function(){set(isDark()?'light':'dark')});nav.appendChild(b);btns.push(b)}
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

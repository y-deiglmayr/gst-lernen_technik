/* Feedback-Formular für alle GST-Lernpfade.
   Lernpfade: Knopf in der Navigation und im Fuß. Startseite: Knopf im Platzhalter <p data-feedback></p>
   (allgemeines Feedback). Gesendet wird nur, was selbst eingetragen wird
   (Seite, Stelle, Rolle Schüler/Lehrer, Art, Text, Vorschlag) – anonym, an /api/feedback (Cloudflare D1).
   Einbinden: <script defer src="/brand/feedback.js"></script> */
(function(){
  var START=!!document.querySelector('[data-theme-switch]');          // Startseite: allgemeines Feedback
  var nav=START?null:document.querySelector('nav .wrap'),platz=document.querySelector('[data-feedback]');
  if(!nav&&!platz)return;
  if(!document.querySelector('link[href="/brand/feedback.css"]')){var css=document.createElement('link');css.rel='stylesheet';css.href='/brand/feedback.css';document.head.appendChild(css)}
  var ALLGEMEIN=['Allgemein','Startseite und Übersicht','Bedienung und Darstellung (Handy, Hell/Dunkel …)','Wunsch: neuer Lernpfad oder neues Thema'];
  var MIN=40,LKEY='gst-feedback-tag';
  var ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5" stroke-linecap="round"/></svg>';
  var ARTEN=[
    ['fehler','Fehler','Etwas stimmt nicht oder funktioniert nicht.','Was genau ist falsch? Beispiel: „In Aufgabe 3b wird meine Antwort 12 J als falsch gewertet, obwohl 2 kg · 9,81 N/kg · 0,6 m ≈ 11,8 J sind.“'],
    ['unklar','Unklar','Ich verstehe etwas nicht.','Was genau verstehst du nicht? Beispiel: „Im Merkkasten Nullniveau verstehe ich nicht, warum die Lageenergie negativ werden kann.“'],
    ['idee','Idee','So könnte es besser werden.','Was soll anders werden und warum? Beispiel: „Bei der Simulation wäre eine Tabelle gut, weil man die Messwerte sonst vergisst.“'],
    ['lob','Lob','Das hat mir geholfen.','Was genau hat dir geholfen und warum? Beispiel: „Der Tipp mit dem Kräfteplan hat mir geholfen, weil ich so die Richtung sehe.“']];
  function txt(el){var c=el.cloneNode(true);c.querySelectorAll('.katex-mathml,.stars,svg,button').forEach(function(x){x.remove()});return c.textContent.replace(/\s+/g,' ').trim().slice(0,100)}
  function stellen(){
    var out=[],seen={};
    document.querySelectorAll('main section, body > section').forEach(function(sec){
      var h=sec.querySelector('h2');if(!h)return;var t=txt(h);if(!t||seen[t])return;seen[t]=1;out.push({t:t,el:sec,sub:false});
      sec.querySelectorAll('.card .tag, .card > h3, .wrap > h3').forEach(function(x){var s=txt(x);if(!s||seen[s])return;seen[s]=1;out.push({t:s,el:x.closest('.card')||x,sub:true})});
    });return out}
  function sichtbar(list){
    var mitte=innerHeight*0.4,best=-1;
    list.forEach(function(o,i){var r=o.el.getBoundingClientRect();if(r.top<=mitte&&r.bottom>0)best=i});
    return best}
  function heute(){var d=new Date().toISOString().slice(0,10);try{var v=JSON.parse(localStorage.getItem(LKEY)||'{}');return v.d===d?v:{d:d,n:0}}catch(e){return {d:d,n:0}}}
  function zaehle(){var v=heute();v.n++;try{localStorage.setItem(LKEY,JSON.stringify(v))}catch(e){}}

  var dlg,offen=0;
  function baue(){
    dlg=document.createElement('dialog');dlg.className='fbdlg';dlg.setAttribute('aria-labelledby','fbTitel');
    dlg.innerHTML='<form method="dialog" novalidate>'+
      '<h2 id="fbTitel">'+(START?'Feedback zu den Lernpfaden':'Feedback zu diesem Lernpfad')+'</h2>'+
      '<p class="fb-info">Dein Feedback hilft, die Lernpfade zu verbessern. Gute Rückmeldungen nennen die Stelle, beschreiben genau, was los ist, und sagen, warum.</p>'+
      '<fieldset class="fb-rolle"><legend>Ich bin …</legend><label><input type="radio" name="rolle" value="schueler"> Schüler/in</label><label><input type="radio" name="rolle" value="lehrer"> Lehrer/in</label></fieldset>'+
      '<fieldset class="fb-arten"><legend>Worum geht es?</legend>'+ARTEN.map(function(a){return '<label><input type="radio" name="art" value="'+a[0]+'"><b>'+a[1]+'</b><small>'+a[2]+'</small></label>'}).join('')+'</fieldset>'+
      '<label class="fb-feld">'+(START?'Worauf bezieht sich dein Feedback?':'Welche Stelle?')+'<select name="stelle"></select></label>'+
      '<label class="fb-feld">Was genau?<textarea name="text" rows="5" maxlength="1500" required placeholder="Beschreibe genau, was du meinst. Wähle oben zuerst aus, worum es geht."></textarea></label>'+
      '<p class="fb-zaehler" aria-live="polite"></p>'+
      '<label class="fb-feld"><span>Dein Vorschlag <small>(freiwillig)</small></span><textarea name="vorschlag" rows="3" maxlength="800" placeholder="Wie wäre es besser?"></textarea></label>'+
      '<label class="fb-falle" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>'+
      '<p class="fb-dsgvo">Schreib bitte <b>keine Namen</b> und keine persönlichen Daten. Gespeichert werden nur Seite, Stelle, Rolle und dein Text – ohne Namen und ohne IP-Adresse. <a href="/impressum#feedback">Mehr im Datenschutz</a></p>'+
      '<p class="fb-meldung" role="status"></p>'+
      '<div class="fb-knoepfe"><button type="button" class="fb-abbr">Abbrechen</button><button type="submit" class="primary fb-senden">Absenden</button></div>'+
      '</form>';
    document.body.appendChild(dlg);
    var f=dlg.querySelector('form'),ta=f.text,z=dlg.querySelector('.fb-zaehler'),m=dlg.querySelector('.fb-meldung');
    function art(){var r=f.querySelector('[name=art]:checked');return r?r.value:''}
    function rolle(){var r=f.querySelector('[name=rolle]:checked');return r?r.value:''}
    function zaehler(){var n=ta.value.trim().length;z.textContent=n<MIN?'Noch mindestens '+(MIN-n)+' Zeichen.':'✓ Genug Text. Danke!';z.classList.toggle('ok',n>=MIN)}
    f.addEventListener('change',function(e){if(e.target.name==='art'){var a=ARTEN.filter(function(x){return x[0]===art()})[0];ta.placeholder=a[3]}});
    ta.addEventListener('input',zaehler);
    dlg.querySelector('.fb-abbr').addEventListener('click',function(){dlg.close()});
    f.addEventListener('submit',function(e){
      e.preventDefault();m.className='fb-meldung';
      var fehl=!rolle()?'Bitte wähle aus, ob du Schüler/in oder Lehrer/in bist.':!art()?'Bitte wähle aus, worum es geht.':ta.value.trim().length<MIN?'Bitte beschreibe genauer, was du meinst.':heute().n>=5?'Du hast heute schon 5 Rückmeldungen geschickt. Danke! Morgen geht wieder mehr.':'';
      if(fehl){m.textContent=fehl;m.classList.add('err');return}
      var b=f.querySelector('.fb-senden');b.disabled=true;m.textContent='Wird gesendet …';
      fetch('/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
        seite:location.pathname,stelle:f.stelle.value,rolle:rolle(),art:art(),text:ta.value,vorschlag:f.vorschlag.value,website:f.website.value,
        dauer:Math.round((Date.now()-offen)/1000)})})
      .then(function(r){return r.json().catch(function(){return {ok:false,meldung:'Senden hat nicht geklappt. Bitte später noch einmal versuchen.'}})})
      .then(function(r){
        m.textContent=r.meldung||(r.ok?'Danke!':'Senden hat nicht geklappt.');m.classList.add(r.ok?'ok':'err');
        if(r.ok){zaehle();ta.value='';f.vorschlag.value='';zaehler();setTimeout(function(){if(dlg.open)dlg.close()},2200)}})
      .catch(function(){m.textContent='Keine Verbindung. Bitte später noch einmal versuchen.';m.classList.add('err')})
      .then(function(){b.disabled=false});
    });
    zaehler();
  }
  function oeffne(){
    if(!dlg)baue();
    var sel=dlg.querySelector('[name=stelle]');
    if(START)sel.innerHTML=ALLGEMEIN.map(function(t){return '<option>'+t+'</option>'}).join('');
    else{var list=stellen(),i=sichtbar(list);
    sel.innerHTML='<option>Ganze Seite</option>'+list.map(function(o){var t=o.t.replace(/[<&"]/g,'');return '<option value="'+t+'">'+(o.sub?'\u00a0\u00a0› ':'')+t+'</option>'}).join('');
    if(i>=0)sel.selectedIndex=i+1}
    var m=dlg.querySelector('.fb-meldung');m.textContent='';m.className='fb-meldung';
    offen=Date.now();dlg.showModal();
  }
  function knopf(t){var b=document.createElement('button');b.type='button';b.className='theme-btn fb-btn';b.innerHTML=ICON+'<span>'+t+'</span>';b.addEventListener('click',oeffne);return b}
  if(platz){platz.classList.add('fb-fuss');platz.textContent='Fehler gefunden, eine Idee oder ein Wunsch für einen neuen Lernpfad? ';platz.appendChild(knopf('Feedback geben'))}
  if(nav){var nb=knopf('Feedback');nb.title='Feedback geben';nb.setAttribute('aria-label','Feedback geben');nav.appendChild(nb)}
  var r=nav&&document.querySelector('footer .rechtl');
  if(r){var p=document.createElement('p');p.className='fb-fuss';p.innerHTML='Fehler gefunden, etwas unklar oder eine Idee? ';
    var fb=document.createElement('button');fb.type='button';fb.className='theme-btn fb-btn';fb.innerHTML=ICON+'<span>Feedback geben</span>';fb.addEventListener('click',oeffne);
    p.appendChild(fb);r.parentNode.insertBefore(p,r)}
})();

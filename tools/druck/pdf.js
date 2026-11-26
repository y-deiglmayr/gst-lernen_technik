// Erzeugt PDFs aus den Druckvorlagen in tools/druck/.
// Aufruf (im Repo-Hauptordner, Server läuft: python3 -m http.server 8123):
//   node tools/druck/pdf.js beispiel-arbeitsblatt Technik11/beispiel-arbeitsblatt.pdf "Technik 11 · Beispiel · Arbeitsblatt"
const {chromium}=require('playwright');
(async()=>{
 const [name,out,fuss]=process.argv.slice(2);
 const b=await chromium.launch();const p=await b.newPage();
 const fehler=[];p.on('console',m=>{if(m.type()!=='log')fehler.push(m.text())});p.on('pageerror',e=>fehler.push(e.message));
 await p.goto(`http://localhost:8123/tools/druck/${name}.html`,{waitUntil:'networkidle'});
 await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
 const roh=await p.evaluate(()=>[...document.querySelectorAll('f-m')].filter(e=>!e.querySelector('.katex')).length);
 await p.pdf({path:out,preferCSSPageSize:true,printBackground:true,displayHeaderFooter:true,headerTemplate:'<span></span>',
  footerTemplate:`<div style="width:100%;font:8px sans-serif;color:#5F6F74;padding:0 13mm;display:flex;justify-content:space-between"><span>${fuss} · technik.physik.party</span><span>Seite <span class="pageNumber"></span> von <span class="totalPages"></span></span></div>`});
 console.log('Formeln ungesetzt:',roh,'| Meldungen:',fehler.length?fehler:'keine');
 await b.close();
})();

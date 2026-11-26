/* Worker "lernapps": statische Lernpfade + Feedback-Annahme.
   POST /api/feedback  → prüft, bewertet vor und speichert in D1 (Binding DB).
   Es werden keine IP-Adressen, Namen oder Geräte-Kennungen gespeichert.
   Abrufen und Auswerten: siehe feedback/AUSWERTEN.md */

const PRAEFIX = '/technik';
const ERLAUBT = ['technik.physik.party', 'physik.party', 'www.physik.party', 'localhost', '127.0.0.1'];
const ARTEN = ['fehler', 'unklar', 'idee', 'lob'];
const ROLLEN = ['schueler', 'lehrer'];
const TAGES_LIMIT = 300;          // Schutz vor Überflutung: höchstens so viele Einträge pro Tag
const MIN_ZEICHEN = 40, MAX_ZEICHEN = 1500, MAX_VORSCHLAG = 800;

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
const fehler = (meldung, status = 400) => json({ ok: false, meldung }, status);

/* Wortfilter. Der Text wird vorher vereinheitlicht (klein, ä→ae, ß→ss, 0→o, 1→i, 3→e, 4→a, @→a, $→s,
   doppelte Buchstaben → einfach), damit „Kaaacke“, „H1tler“ oder „Scheiße“ auch erkannt werden.
   Die Muster stehen deshalb ohne Doppelbuchstaben (missgeburt → misgeburt). Ein Treffer muss am Wortanfang
   stehen, damit Fachwörter wie „Analyse“ oder „Kometenschweif“ nicht hängen bleiben. */
const WA = '(?<![a-z])';               // Wortanfang (nach dem Vereinheitlichen gibt es nur a–z)
const SCHIMPF = new RegExp(WA + '(scheis|kack|kaka\\b|fick|arsch|huren|hure\\b|wichs|spast|behindert|misgeburt|mistgeburt|fotze|opfer\\b|hs\\b|stfu|bitch|fuck|shit|wtf|pimel|schlampe|schwuchtel|homo\\b|schwul|lesbe|neger|nig(a|er)\\b|kanake|zigeuner|dep\\b|idiot|vollidiot|trotel|pener|lapen\\b|loser|verpis|halt.?s.?maul|frese)');
const UNANSTAENDIG = new RegExp(WA + '(pipi|popo|poloch|pups|furz|pinkel|pise|pis\\b|kot\\b|sex(\\b|y|uel)|porn|penis|vagina|muschi|titen|busen|schwanz\\b|hoden|orgasm|masturb|blowjob|wixe|kondom|erotik)');
const EXTREM = new RegExp(WA + '(hitler|adolf|nazi|neonazi|nsdap|gestapo|holocaust|shoah|hakenkreuz|sieg ?heil|heil ?hitler|reichsbuerger|jude\\b|juden|kz\\b|auschwitz|teror|atentat|islamis|dschihad|jihad|isis\\b|hamas|hisbol|taliban|al.?qaida|amok|umbringen|ermorden|erschies|genozid|voelkermord|rasis|afd\\b|npd\\b|maga\\b|make america|great again|trump|putin|biden|merz\\b|scholz|palest|palaest|from the river|israel|zionis|intifada|ukrain|rusland|krieg\\b)');
/* Lange, eindeutige Wörter zusätzlich ohne Leerzeichen und Satzzeichen suchen („H i t l e r“, „k.a.c.k.e“). */
const ZUSAMMEN = /(hitler|holocaust|hakenkreuz|hurenson|wichser|arschloch|misgeburt|scheise|kacke|terorist|atentat|nsdap)/;
const vereinheitlicht = t => String(t || '').toLowerCase().normalize('NFKC').replace(/[\u200B-\u200D\u00AD]/g, '')
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[0134@$]/g, z => ({ 0: 'o', 1: 'i', 3: 'e', 4: 'a', '@': 'a', $: 's' })[z])
  .replace(/([a-z])\1+/g, '$1');
/* Gibt zurück, welche Art unpassender Wörter vorkommt (oder null). Prüft alle Freitext-Felder. */
function unpassend(...felder) {
  const t = vereinheitlicht(felder.join(' \n '));
  if (EXTREM.test(t)) return 'extrem';
  if (SCHIMPF.test(t)) return 'schimpf';
  if (UNANSTAENDIG.test(t)) return 'unanstaendig';
  if (ZUSAMMEN.test(t.replace(/[^a-z]/g, ''))) return 'schimpf';
  return null;
}
/* Häufige kleine Wörter: Ein „Satz“ ganz ohne sie ist meist eine Wortliste (Test, Unsinn), kein Vorschlag. */
const FUNKTIONSWORT = /(?<![a-zäöüß])(der|die|das|den|dem|des|ein|eine|einen|einem|einer|und|oder|aber|ist|sind|war|wird|werden|kann|könnte|sollte|würde|man|ich|du|es|sie|wir|hier|da|zu|im|in|bei|mit|von|auf|für|nicht|noch|auch|als|wie|dass|wenn|weil|statt|besser|lieber|mehr|bitte)(?![a-zäöüß])/i;
const ABWERTEND = /\b(langweilig|doof|blöd|dumm|schlecht|sinnlos|nervig|kacke|mies|lame|cringe|egal)\b/i;
const BEGRUENDUNG = /\b(weil|da |denn|deshalb|daher|dadurch|sonst|obwohl|stattdessen|besser wäre|sollte|könnte|würde|vorschlag|zum beispiel|z\. ?b\.)/i;
const KONKRET = /\b(aufgabe|teilaufgabe|auftrag|lösung|tipp|hinweis|formel|einheit|rechnung|ergebnis|zahl|wert|pfeil|bild|grafik|simulation|regler|knopf|text|satz|wort|heft|merke|frage|antwort|schritt|beispiel|skizze|winkel|kraft|energie|impuls|masse|geschwindigkeit|spiegel|licht|strahl)\w*/gi;

/* Automatische Vorbewertung 0–100. Sie ersetzt nicht die Auswertung, sie sortiert nur vor. */
function bewerte(d) {
  const g = [];
  let s = 20;
  const alles = d.text + ' ' + (d.vorschlag || '');
  const woerter = alles.split(/\s+/).filter(w => /[a-zäöüß]{2,}/i.test(w));
  s += Math.min(25, Math.round(woerter.length * 0.8)); g.push(woerter.length + ' Wörter');
  if (d.rolle === 'lehrer') { s += 10; g.push('Lehrkraft'); }
  if (d.stelle && !['Ganze Seite', 'Allgemein'].includes(d.stelle)) { s += 15; g.push('Stelle genannt'); }
  if (d.vorschlag && d.vorschlag.length >= 15) {
    if (FUNKTIONSWORT.test(d.vorschlag)) { s += 15; g.push('Vorschlag'); }
    else { s -= 10; g.push('Vorschlag ohne ganzen Satz'); }
  }
  // Zweite Sicherung (falls die harte Prüfung einmal umgangen wird): unpassende Wörter → ganz nach unten.
  if (unpassend(d.text, d.vorschlag, d.stelle)) { s -= 80; g.push('unpassende Wörter'); }
  const konkret = new Set((alles.match(KONKRET) || []).map(w => w.toLowerCase())).size;
  if (konkret) { s += Math.min(10, konkret * 3); g.push('konkret'); }
  if (/\d/.test(alles)) { s += 5; g.push('Zahlen'); }
  if (BEGRUENDUNG.test(alles)) { s += 10; g.push('begründet'); }
  if (d.art === 'lob' && woerter.length < 25) { s -= 10; g.push('kurzes Lob'); }
  const gross = (alles.match(/[A-ZÄÖÜ]/g) || []).length, buchst = (alles.match(/[a-zäöüßA-ZÄÖÜ]/g) || []).length;
  if (buchst > 20 && gross / buchst > 0.5) { s -= 20; g.push('GROSSBUCHSTABEN'); }
  if (/[!?]{3,}/.test(alles)) { s -= 10; g.push('!!!/???'); }
  if (ABWERTEND.test(alles) && !BEGRUENDUNG.test(alles)) { s -= 20; g.push('abwertend ohne Begründung'); }
  const verschieden = new Set(woerter.map(w => w.toLowerCase())).size;
  if (woerter.length >= 10 && verschieden / woerter.length < 0.5) { s -= 15; g.push('viele Wiederholungen'); }
  return { qualitaet: Math.max(0, Math.min(100, s)), gruende: g.join(', ') };
}

/* Harte Prüfungen: offensichtlich Unbrauchbares wird gar nicht erst gespeichert. */
function pruefe(d) {
  if (!ROLLEN.includes(d.rolle)) return 'Bitte wähle aus, ob du Schüler/in oder Lehrer/in bist.';
  if (!ARTEN.includes(d.art)) return 'Bitte wähle aus, worum es geht.';
  if (!/^\/[A-Za-z0-9\/_-]{0,80}$/.test(d.seite)) return 'Unbekannte Seite.';
  if (d.text.length < MIN_ZEICHEN) return `Bitte beschreibe genauer, was du meinst (mindestens ${MIN_ZEICHEN} Zeichen).`;
  if (d.text.length > MAX_ZEICHEN || (d.vorschlag || '').length > MAX_VORSCHLAG) return 'Der Text ist zu lang.';
  const alles = d.text + ' ' + (d.vorschlag || '');
  if (alles.split(/\s+/).filter(w => /[a-zäöüß]{2,}/i.test(w)).length < 7) return 'Bitte schreibe ganze Sätze.';
  if (/(.)\1{5,}/.test(alles)) return 'Bitte schreibe normalen Text ohne lange Zeichenketten.';
  if (/https?:\/\/|www\./i.test(alles)) return 'Bitte keine Links einfügen.';
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(alles) || /(\+49|\b0)\d{2,5}[ \/-]?\d{4,}/.test(alles)) return 'Bitte keine E-Mail-Adressen oder Telefonnummern eintragen.';
  const u = unpassend(d.text, d.vorschlag, d.stelle);
  if (u === 'extrem') return 'Bitte bleib beim Lernpfad: Politische Parolen und Anspielungen auf Gewalt oder Nationalsozialismus werden nicht angenommen.';
  if (u) return 'Bitte formuliere sachlich – so kann dein Feedback ausgewertet werden.';
  const buchst = (alles.match(/[a-zäöüß]/gi) || []).length;
  if (buchst / alles.replace(/\s/g, '').length < 0.6) return 'Bitte schreibe normalen Text.';
  return null;
}

const sauber = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, max + 1);

async function nimmFeedback(request, env) {
  if (request.method !== 'POST') return fehler('Nur POST.', 405);
  const origin = request.headers.get('origin');
  // Erlaubt: gleiche Adresse wie die Seite (z. B. technik.physik.party, auch neue Domains) oder bekannte Adressen.
  try {
    const host = new URL(origin).hostname;
    if (host !== new URL(request.url).hostname && !ERLAUBT.includes(host)) return fehler('Nicht erlaubt.', 403);
  } catch { return fehler('Nicht erlaubt.', 403); }
  if (!(request.headers.get('content-type') || '').includes('application/json')) return fehler('Falsches Format.', 415);
  if (Number(request.headers.get('content-length') || 0) > 8000) return fehler('Zu groß.', 413);

  let roh;
  try { roh = await request.json(); } catch { return fehler('Falsches Format.'); }
  // Falle für Bots: unsichtbares Feld muss leer bleiben, Formular muss mind. 10 s offen gewesen sein.
  if (roh.website) return json({ ok: true });
  if (!(Number(roh.dauer) >= 10)) return fehler('Bitte nimm dir etwas Zeit zum Schreiben.');

  const d = {
    seite: sauber(roh.seite, 80).replace(/\.html$/, ''),
    stelle: sauber(roh.stelle, 120) || 'Ganze Seite',
    rolle: sauber(roh.rolle, 10),
    art: sauber(roh.art, 10),
    text: sauber(roh.text, MAX_ZEICHEN),
    vorschlag: sauber(roh.vorschlag, MAX_VORSCHLAG) || null,
  };
  const problem = pruefe(d);
  if (problem) return fehler(problem, 422);
  // Gemeinsame Datenbank mit physik.party: Technik-Seiten mit Präfix speichern (z. B. /technik/Technik11/…, Startseite /technik/).
  d.seite = PRAEFIX + d.seite;

  const heute = await env.DB.prepare("SELECT COUNT(*) AS n FROM feedback WHERE erstellt >= date('now')").first();
  if (heute && heute.n >= TAGES_LIMIT) return fehler('Heute sind schon sehr viele Rückmeldungen eingegangen. Bitte versuche es morgen noch einmal.', 429);
  const doppelt = await env.DB.prepare('SELECT id FROM feedback WHERE seite = ? AND text = ? LIMIT 1').bind(d.seite, d.text).first();
  if (doppelt) return json({ ok: true, meldung: 'Danke! Diese Rückmeldung ist schon angekommen.' });

  const { qualitaet, gruende } = bewerte(d);
  await env.DB.prepare('INSERT INTO feedback (seite, stelle, rolle, art, text, vorschlag, qualitaet, gruende) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(d.seite, d.stelle, d.rolle, d.art, d.text, d.vorschlag, qualitaet, gruende).run();
  return json({ ok: true, meldung: 'Danke! Dein Feedback ist angekommen.' });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/feedback') {
      try { return await nimmFeedback(request, env); }
      catch (e) { console.error('feedback', e); return fehler('Speichern hat nicht geklappt. Bitte später noch einmal versuchen.', 500); }
    }
    return env.ASSETS.fetch(request);
  },
  // Läuft nur, wenn in wrangler.jsonc ein Cron eingetragen ist. Für die gemeinsame Datenbank räumt der Physik-Worker „lernapps“ auf.
  async scheduled(event, env) {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM feedback WHERE erstellt < datetime('now', '-12 months')"),
      env.DB.prepare("DELETE FROM feedback WHERE status = 'verworfen' AND erstellt < datetime('now', '-30 days')"),
    ]);
  },
};

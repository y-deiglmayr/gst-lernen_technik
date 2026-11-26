# Projekt „Technik Unterricht“ – GST-Lernpfade Technik

Interaktive Lernpfade (je eine HTML-Datei, alles inline) für das Fach Technik am Technischen Gymnasium BW. Sprache: Deutsch, du-Ansprache.
Cloudflare (Worker „lernapps-technik“) veröffentlicht automatisch von `main`: https://technik.physik.party/. Adresse ohne `.html`. QR-Codes und Links immer mit technik.physik.party.
Details zu Aufbau, Branding und Formeln: `README.md`.

Schwesterprojekt: Physik-Lernpfade im öffentlichen Repo `y-deiglmayr/gst-lernen` (https://physik.party/). Gleiches Gerüst (brand/, fonts/, katex/, tools/).
Fertige Lernpfade und Druckvorlagen dort dienen als **Muster** (bei Bedarf nur lesend klonen: `git clone --depth 1 https://github.com/y-deiglmayr/gst-lernen`); keine Physik-Inhalte hierher übernehmen.
Ändert sich am gemeinsamen Gerüst etwas Grundsätzliches (z. B. brand.css), nach Absprache in beiden Repos nachziehen.

**Diese Regeln gelten zusätzlich zum Skill „gst-lernpfad“ und haben Vorrang, wo der Skill etwas anderes sagt**
(z. B. beschreibt der Skill noch einen „dunklen Labor-Kopf“ – gilt nicht mehr).

## Gestaltung (Schul-Branding)
- Nach dem `<style>`-Block jeder Lernpfad-Seite einbinden:
  ```html
  <link rel="stylesheet" href="/brand/brand.css">
  <link rel="stylesheet" href="/katex/katex.min.css">
  <script defer src="/katex/katex.min.js"></script>
  <script defer src="/katex/formel.js"></script>
  <script defer src="/brand/feedback.js"></script>
  <script defer src="/brand/mischen.js"></script>
  ```
- Schulfarben: Schiefer #3E4B4C, #5F6F74, Graugrün #76989D, #ACBDC3, #C9D2D3, Hellgrau #E4E7E9, Akzentgelb #FCBE00.
  Keine eigenen Dunkelblau-Töne für Kopf oder Vorschaubilder (Vorschaubild-Grund: #3E4B4C bzw. #2f393a).
- Fachliche Farben sind erlaubt und bleiben einheitlich (z. B. Werkstoffe, Kräfte/Lasten, Strom/Spannung, Bemaßung) – pro Thema einmal festlegen und in allen Lernpfaden gleich verwenden.
- Farbsystem und Darkmode stehen zentral in `brand/brand.css` (Grundflächen, Text, Linien hell/dunkel in Schiefer-Tönen; Bedienelemente, Merke, Heft-Überschriften in dunklem Graugrün `--gst-acc`; Akzentgelb `--gst-mark` nur als Markierung: Fortschritt, Fokus, kleine Quadrate). Keine eigenen Akzentfarben (Orange, Laserrot) für Navigation, Knöpfe, Merke oder Heft.
- Heftaufschriebe sind überall deutlich grün (`--gst-heft`, zentral in brand.css): `.heft`, Kästen `.heftbox` mit Kopf `.hb-head`, aufklappbare Musterlösung `details.reveal` mit `.heft` darin, `.insheft`, `a.heftlink`. Keine eigenen Farben dafür in den Seiten.
- Darkmode: `<script src="/brand/theme.js"></script>` direkt nach `/fonts/fonts.css` im `<head>` (ohne defer). Es setzt `data-theme` auf `<html>` (localStorage `gst-theme`) und fügt in Lernpfaden einen Hell/Dunkel-Knopf in `nav .wrap` ein; auf der Startseite steht die Auswahl Automatisch/Hell/Dunkel im Platzhalter `data-theme-switch`. Farben in Lernpfaden immer mit `light-dark(hell,dunkel)`, dunkle Werte in Schiefer-Tönen (z. B. #1b2122, #232b2d), kein Dunkelblau.
- Schriften nur lokal über `/fonts/fonts.css` (Überschriften Source Sans 3 kommt über brand.css), keine Google Fonts, keine externen Dienste.
- Im Fuß jedes Lernpfads (am Ende von `footer .wrap`): `<p class="rechtl"><a href="/impressum">Impressum · Datenschutz</a></p>`. Impressum, Datenschutz, KI-Hinweis und Haftung stehen zentral in `impressum.html`; neue externe Dienste nur nach Ergänzung dort.
- QR-Code der eigenen Live-Adresse im Kopf (Python `segno`), Startseite-Eintrag in `KURSE` + Vorschaubild in `BILDER`, README-Liste ergänzen.

## Piktogramme (Aufgaben und Quiz auflockern)
- Manche Aufgaben, Zuordnungen und Quizfragen bekommen kleine Piktogramme, damit keine großen Textblöcke entstehen (nicht jede Aufgabe, eher 5–10 pro Lernpfad).
- Symbole zentral in `brand/piktos.svg` (eigene SVGs, keine externen Bilder), Übersicht: `tools/piktos-katalog.html` (lokal über `python3 -m http.server`). Einbinden: `<svg class="pk" aria-hidden="true"><use href="/brand/piktos.svg#kerze"/></svg>`. Fehlt ein Symbol, neues `<symbol>` im gleichen Stil ergänzen (viewBox 48×48, Linien `currentColor` 2,2, Flächen nur über `style="fill:var(--pk-…)"`; im XML-Kommentar kein doppelter Bindestrich).
- Muster aus `brand/brand.css`: `.mitbild` (Bild neben Aufgabentext/`h4`), `.mitpk` (Bild vor einer Zuordnungszeile, Text in eigenem `<span>`), MC-Knopf `<button data-k="a"><svg class="pk">…</svg><span>Text</span></button>`, `.mc.bildwahl` (Kacheln), `.pk.breit` für kleine Szenen aus mehreren Symbolen. Farben/Darkmode kommen aus den `--pk-*`-Variablen.
- Piktogramme sind Schmuck (`aria-hidden`), der Text bleibt vollständig. Ein Bild darf die Lösung nicht verraten. Beispiele (im Physik-Repo): `Physik8/reflexion-spiegel`, `Physik9/energie-einfuehrung`, `Physik11/kraft-grundlagen`. Technik-Symbole (Bauteile, Werkzeuge, Schaltzeichen …) bei Bedarf in `brand/piktos.svg` ergänzen.

## Formeln
- Formeln normal schreiben, z. B. `h = E<sub>L</sub> : (m · g)`; Geteilt-Zeichen „ : “ mit Leerzeichen.
- Vor dem Veröffentlichen: `python3 tools/formeln_markieren.py <datei>` – markiert Formeln mit `<f-m>…</f-m>`, `katex/formel.js` setzt sie.
- Mit Playwright prüfen: keine Konsolen-Warnung „Formel nicht gesetzt“, kein sichtbares `<f-m>` im Text.

## Didaktik
- Phasen: Einstieg/Wiederholen → Entdecken → Festhalten → Üben (★/★★/★★★, Tipps, Lösungen).
- Antwortreihenfolge nie fest: `brand/mischen.js` mischt bei jedem Laden Dropdowns (`select` mit `data-a`/`data-ans` oder in `.selbox`/`[data-task]`, Platzhalter „…“ bleibt oben), Multiple-Choice-Knöpfe (`.mc button[data-k]`/`[data-j]`), Mehrfachauswahl (`.multi label`) und Kinder von `[data-mischen]` (z. B. Wortbausteine), auch per JS erzeugte. Prüfen-Logik daher immer über Werte/Kennungen, nie über Positionen. Reine Zahlenlisten bleiben geordnet; Ausnahme per `data-fest`.
- Multiple Choice: nach Fehlversuch Hinweis und kurze Denkpause (kein Durchraten).
- Pro Lernpfad 2–3 „Begründe“-Aufträge mit Musterbegründung (erst nach eigenem Satz sichtbar).
- Konstruktionen: „Erst im Heft konstruieren, dann hier prüfen.“
- Simulationen dürfen nichts „entdecken“ lassen, was fachlich/technisch nicht stimmt; Modellannahmen (z. B. ohne Reibung, ideale Bauteile) nennen.
- Normen und Fachsprache der Technik beachten (z. B. DIN-Schaltzeichen, Bemaßung nach Norm, Einheiten nach SI).
- Fortschritt nur im Browser (localStorage), keine Datenerhebung.

## Feedback
- Schüler-Feedback liegt anonym in Cloudflare D1 `gst-feedback` (ID 17e96367-7f67-4c99-b1f8-ff75f1f89423), gemeinsam mit physik.party. Technik-Einträge haben in `seite` das Präfix `/technik` – Abfragen immer mit `seite LIKE '/technik%'` filtern. Abrufen und Auswerten nach `feedback/AUSWERTEN.md`: nur Einträge mit Stellenbezug, die sich nachprüfen lassen und fachlich stimmen; dem Nutzer erst eine Liste vorlegen, dann ändern, danach `status` setzen.
- `wrangler.jsonc` + `feedback/worker.js` bilden den Worker „lernapps-technik“ (ohne Cron; das tägliche Aufräumen der gemeinsamen Datenbank macht der Physik-Worker „lernapps“); `.assetsignore` hält interne Dateien (CLAUDE.md, tools/, feedback/) aus der Auslieferung.

## Druckversionen (Heftaufschrieb + Übungsblatt)
Zu jedem Lernpfad (Kachel) schrittweise zwei PDFs; Vorlagen, Bausteine und Befehle in `tools/druck/` (LIESMICH.md, druck.css, pdf.js, qr_einsetzen.py). Muster (im Physik-Repo): `Physik11/schiefe-ebene`, `Physik9/energie*`, `Physik9/lageenergie` mit Vorlagen in `tools/druck/`.
- **Heftaufschrieb** (`<lernpfad>-heftaufschrieb.pdf`, max. 1–2 A4-Seiten, eher kurz): Lückentext mit nur dem Wichtigsten (nachschaubar), Lücken für Fachbegriffe/Formeln, damit Denkleistung bleibt. Erste Zeichnungen/Diagramme zeichnen die Schüler selbst: leeres Karo-Feld plus nummerierte Schrittliste.
- Der aufklappbare Heftaufschrieb im Lernpfad (`details.reveal .heft`) ist die Lösung: Wort für Wort gleich, Lückenwörter fett, mit Musterzeichnung (`figure.musterfig`, SVG mit CSS-Variablen, hell/dunkel). Lernpfad dafür bei Bedarf anpassen.
- **Übungsblatt** (`<lernpfad>-uebungsblatt.pdf`, 2–4 Seiten): Aufgaben gemischt AFB I–III (★/★★/★★★), gleiche Übungsnummern und Teilaufgaben-Buchstaben wie online, Karo-Felder für den Rechenweg, Ergebnisfelder, „online geprüft“ zum Abhaken. Nicht alle Übungen nötig. Begründe-Aufträge mit Schreibzeilen.
- Nicht auf die Blätter: Name/Klasse/Datum, „Das brauchst du“, Formel-Kasten.
- Formeln nie umbrechen (druck.css: `f-m` mit `nowrap`). Lücke + zugehöriges Formelzeichen und Klammerformeln wie `(E<sub>Aufwand</sub>)` in `<span class="nw">…</span>` zusammenhalten, zwischen Zahl und Einheit im Fließtext ein geschütztes Leerzeichen. Lange Formeln in eine eigene Zeile. PDF-Seiten auf getrennte Formeln prüfen.
- Kopf mit QR-Code und Fußzeile mit technik.physik.party; Konstruktionen mit Maßstab in echten mm („in 100 % drucken“). PDFs mit `node tools/druck/pdf.js` (keine ungesetzten Formeln), Seiten ansehen.
- PDFs neben den Lernpfad legen. Downloads nur im Lernpfad (`a.arbeitsblatt`: `.ablinks` im Kopf unter den Phasen, Heftaufschrieb vor dem `details.reveal` in „Festhalten“, Übungsblatt am Anfang von „Üben“). Auf der Kachel nur das Symbol: in `KURSE` `druck:'Heftaufschrieb und Übungsblatt zum Drucken'`. README-Liste ergänzen; PDFs mitsichern.

## Prüfen und Veröffentlichen
- Lokal mit `python3 -m http.server` + Playwright: keine JS-Fehler, Desktop 1280 px und Handy 390 px ohne seitliches Scrollen, Aufgaben durchklicken, Screenshots ansehen.
- Vor dem Push `git fetch` und auf neue Commits achten – auf dem PC des Nutzers (yannik-pc) kann es ungepushte Änderungen geben.
- Fertige Lernpfade direkt auf `main` pushen, danach Live-Adresse prüfen.
- Sicherung nach `D:\OneDrive\Unterricht WBS\Lernapps Technik`: alle HTML-Dateien **und** die Ordner `brand/`, `fonts/`, `katex/`.
  Aus einer Cloud-Session ohne verbundenen PC stattdessen ein ZIP schicken und sagen, dass die Sicherung nachgeholt werden muss.

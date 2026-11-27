# GST Lernpfade Technik

Interaktive HTML-Lerninhalte für den Technik-Unterricht am Technischen Gymnasium, veröffentlicht als Cloudflare Worker
„lernapps-technik“ unter **https://technik.physik.party/**. Schwesterprojekt zu den Physik-Lernpfaden
(Repo `y-deiglmayr/gst-lernen`, https://physik.party/) mit gleichem Aufbau, Branding und Werkzeugen.

## Struktur

```
index.html                  Startseite mit allen Lernpfaden (Liste KURSE)
impressum.html              Impressum, Datenschutz, Urheberrecht/KI, Haftung (Link im Fuß jeder Seite)
feedback/                   Feedback: Worker (worker.js), Datenbank-Aufbau (schema.sql), Anleitung AUSWERTEN.md
wrangler.jsonc              Cloudflare-Worker „lernapps-technik“ (statische Dateien + /api/feedback, D1 gst-feedback)
.assetsignore               Dateien, die nicht öffentlich ausgeliefert werden
brand/                      Schul-Branding (brand.css, theme.js, feedback.js, mischen.js, Logo, Mosaik, piktos.svg)
fonts/                      Schriften lokal (Lexend, Atkinson Hyperlegible, Source Sans 3, SIL OFL)
katex/                      Formelsatz lokal (KaTeX + formel.js)
tools/                      formeln_markieren.py, piktos-katalog.html, druck/ (Vorlagen-Bausteine für PDFs)
```

### Lernpfade

**Klasse 8** (`Technik8/`)
- Mikrocontroller: `led-blinken.html` – Eine LED blinken lassen (Blink-Labor: Arduino-Uno-Simulation im Browser, setup/loop, digitalWrite, delay, Vorwiderstand)
- Mikrocontroller: `led-blinken-wokwi.html` – LED blinken mit Wokwi (eingebetteter Online-Simulator Wokwi, lädt erst nach Klick)
- Technisches Zeichnen: `tz-grundlagen.html` – Grundlagen und Maßstab (Zeichnungsarten, Maßstab-Labor)
- Technisches Zeichnen: `tz-bemassung.html` – Linienarten und Bemaßung (Bausteine, Regeln, Fehlerdetektiv, R/Ø/t)
- Technisches Zeichnen: `dreitafelprojektion.html` – Dreitafelprojektion (3D-Labor mit Live-Ansichten, Zeichen-Werkstatt mit automatischer Prüfung)
- Technisches Zeichnen: `kavalierperspektive.html` – Kavalierperspektive (Kavalier-Labor, Körper zeichnen)
- Technisches Zeichnen: `isometrie.html` – Isometrie (Isometrie-Blick, Zeichnen auf Isometriepapier)
- Projekt Schlüsselanhänger: `anhaenger-konstruktion.html` – CAD-Konstruktion (Planen in 5 Schritten, Grundkörper, additiv/subtraktiv, Bohrung und Gruppieren, Anhänger-Werkstatt in 3D mit Druckbarkeits-Check, Fehlerdetektiv, Planungsblatt)
- Projekt Schlüsselanhänger: `3d-druck.html` – 3D-Druck (FDM-Drucker, Filament, STL/G-Code, Slicer-Labor, 45°-Regel, Haftung, Probleme, Sicherheit)

Die Lernpfade „Technisches Zeichnen“ werden aus `tools/tz/` erzeugt (gemeinsame 3D-/Zeichen-Engine `engine.js`, Quellseiten in `tools/tz/src/`). Auch die beiden Lernpfade „Projekt Schlüsselanhänger“ entstehen dort (Anhänger-Werkstatt `anh.js`/`anh.css`): Änderungen dort machen, dann `python3 tools/tz/build.py` (setzt auch die Formel-Markierung).

Jede Klasse bzw. jedes Fach bekommt einen eigenen Ordner, z. B. `Technik11/` (Eingangsklasse),
`Technik12/` (J1), `Technik13/` (J2). Die Adresse einer Seite ist der Pfad ohne `.html`, z. B. `/Technik11/beispiel`.
Groß- und Kleinschreibung der Ordner gehört zur Adresse.

## Neuen Lernpfad hinzufügen

1. HTML-Datei in den passenden Ordner legen (Ordner bei Bedarf neu anlegen).
2. In `index.html` in der Liste `KURSE` eintragen (Beispiel steht als Kommentar darin). Gliederung: Stufe
   (`Mittelstufe`/`Oberstufe`) → Klasse → Thema (`themen`) → Lernpfade (`seiten`). Vorschaubild: im Objekt `BILDER`
   ein kleines SVG (320 × 140) anlegen und mit `bild:'name'` verknüpfen.
3. Diese README-Liste ergänzen.
4. Committen und auf `main` pushen – Cloudflare veröffentlicht automatisch.

## Einrichtung bei Cloudflare (einmalig)

1. Cloudflare-Dashboard → Workers & Pages → Erstellen → Repository importieren → `gst-lernen_technik`.
2. Projektname `lernapps-technik` (muss zu `name` in `wrangler.jsonc` passen), Zweig `main`, Build-Befehl leer, Deploy-Befehl `npx wrangler deploy`.
3. Worker → Einstellungen → Domains & Routen → Benutzerdefinierte Domain `technik.physik.party`.
   DNS-Eintrag und HTTPS-Zertifikat legt Cloudflare selbst an (physik.party wird bei Cloudflare verwaltet).

## Branding, Schriften, Formeln, Piktogramme, Druckversionen, Feedback

Alles wie im Physik-Projekt – die verbindlichen Regeln stehen in `CLAUDE.md`. Kurz:

- Im `<head>`: `/fonts/fonts.css`, danach `<script src="/brand/theme.js"></script>`; nach dem `<style>`-Block
  `brand.css`, KaTeX, `formel.js`, `feedback.js`, `mischen.js` (siehe CLAUDE.md).
- Farben: Schiefer #3E4B4C, #5F6F74, Graugrün #76989D, #ACBDC3, #C9D2D3, Hellgrau #E4E7E9, Akzentgelb #FCBE00.
- Formeln in `<f-m>…</f-m>`, automatisch markieren mit `python3 tools/formeln_markieren.py <datei>`.
- Piktogramme aus `brand/piktos.svg` (Katalog: `tools/piktos-katalog.html`).
- Druckversionen (Heftaufschrieb, Übungsblatt): `tools/druck/LIESMICH.md`.
- Feedback landet in der gemeinsamen D1-Datenbank `gst-feedback` mit Präfix `/technik` (siehe `feedback/AUSWERTEN.md`).

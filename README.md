# GST Lernpfade Technik

Interaktive HTML-Lerninhalte für den Technik-Unterricht am Technischen Gymnasium, veröffentlicht als Cloudflare Worker
„technik“ unter **https://technik.physik.party/**. Schwesterprojekt zu den Physik-Lernpfaden
(Repo `y-deiglmayr/gst-lernen`, https://physik.party/) mit gleichem Aufbau, Branding und Werkzeugen.

## Struktur

```
index.html                  Startseite mit allen Lernpfaden (Liste KURSE)
impressum.html              Impressum, Datenschutz, Urheberrecht/KI, Haftung (Link im Fuß jeder Seite)
feedback/                   Feedback: Worker (worker.js), Datenbank-Aufbau (schema.sql), Anleitung AUSWERTEN.md
wrangler.jsonc              Cloudflare-Worker „technik“ (statische Dateien + /api/feedback, D1 gst-feedback)
.assetsignore               Dateien, die nicht öffentlich ausgeliefert werden
brand/                      Schul-Branding (brand.css, theme.js, feedback.js, mischen.js, Logo, Mosaik, piktos.svg)
fonts/                      Schriften lokal (Lexend, Atkinson Hyperlegible, Source Sans 3, SIL OFL)
katex/                      Formelsatz lokal (KaTeX + formel.js)
tools/                      formeln_markieren.py, piktos-katalog.html, druck/ (Vorlagen-Bausteine für PDFs)
```

Noch keine Lernpfade. Jede Klasse bzw. jedes Fach bekommt einen eigenen Ordner, z. B. `Technik11/` (Eingangsklasse),
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
2. Projektname `technik` (muss zu `name` in `wrangler.jsonc` passen), Zweig `main`, Build-Befehl leer, Deploy-Befehl `npx wrangler deploy`.
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

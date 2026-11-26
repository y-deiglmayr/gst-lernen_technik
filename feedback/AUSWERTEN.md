# Feedback auswerten

**Technik-Seite:** Die Datenbank teilt sich technik.physik.party mit physik.party. Technik-Einträge erkennt man am Präfix
`/technik` in `seite` (z. B. `/technik/Technik11/…`, Startseite `/technik/`). Für die Technik-Auswertung in allen Abfragen
`AND seite LIKE '/technik%'` ergänzen. Das tägliche Löschen alter Einträge erledigt der Physik-Worker „lernapps“.

Schüler und Lehrkräfte schicken Rückmeldungen über den Knopf „Feedback“ (Navigation und Fuß jedes Lernpfads,
auf der Startseite unter der Liste für allgemeines Feedback – dort ist `seite` = `/`). Im Formular wählt man die
Rolle (`rolle` = `schueler` oder `lehrer`).
Sie landen anonym in der Cloudflare-D1-Datenbank **gst-feedback**
(ID `17e96367-7f67-4c99-b1f8-ff75f1f89423`, Tabelle `feedback`, Aufbau in `schema.sql`).

## So läuft es technisch

- `brand/feedback.js` (+ `brand/feedback.css`, lädt das Skript selbst) baut Knopf und Formular, `feedback/worker.js` nimmt unter `POST /api/feedback` an.
- **Harte Filter (wird gar nicht gespeichert):** unter 40 Zeichen oder unter 7 Wörtern, Zeichenketten wie „aaaaaa“,
  Links, E-Mail-Adressen, Telefonnummern, unpassende Wörter, fast nur Sonderzeichen, Bots (verstecktes Feld,
  Formular kürzer als 10 s offen), fremde Herkunft, mehr als 300 Einträge am Tag, doppelte Texte.
  Im Browser zusätzlich höchstens 5 Rückmeldungen pro Tag.
- **Wortfilter** (`unpassend()` in `worker.js`) prüft alle Freitext-Felder (Text, Vorschlag, Stelle) auf drei Listen:
  Schimpfwörter/Beleidigungen, unanständige Wörter (Fäkal-, Sexualwörter) und Extremes/Politisches (NS-Bezüge,
  Terror, Gewalt, politische Parolen). Vorher wird vereinheitlicht (klein, ä→ae, ß→ss, Ziffern wie 1→i, doppelte
  Buchstaben → einfach), lange eindeutige Wörter werden auch ohne Leerzeichen gefunden („H i t l e r“).
  Treffer nur am Wortanfang, damit Fachwörter nicht hängen bleiben (Sextant, Anschlag, toter Winkel, Kakao, Nute …).
  Neue Wörter in der vereinheitlichten Form eintragen (ohne Doppelbuchstaben) und gegen alle Lernpfad-Texte testen.
- **Vorbewertung `qualitaet` (0–100)** mit Begründung in `gruende`: Punkte für Länge, genannte Stelle, Vorschlag,
  Fachwörter/konkrete Bezüge, Lehrkraft (+10), Zahlen, Begründung („weil“, „sollte“ …); Abzug für GROSSBUCHSTABEN, „!!!“,
  Vorschlag ohne ganzen Satz (bloße Wortliste), unpassende Wörter (−80, falls die harte Prüfung umgangen wird),
  abwertend ohne Begründung („langweilig“, „doof“ …), viele Wiederholungen, kurzes Lob.
  Faustregel: ab 50 lohnt sich ein Blick, ab 70 meist konkret und brauchbar.
- `status`: `neu` → `uebernommen` (eingebaut) / `erledigt` (geprüft, keine Änderung nötig) / `verworfen`.
- Täglich um 3:17 Uhr (UTC) löscht der Worker Einträge älter als 12 Monate und verworfene älter als 30 Tage.

## Abrufen mit Claude

Einfach sagen: **„Werte das neue Feedback aus.“** Claude geht dann so vor:

1. Neue Einträge holen (Cloudflare-Werkzeug `d1_database_query`):
   ```sql
   SELECT id, erstellt, seite, stelle, rolle, art, text, vorschlag, qualitaet, gruende
   FROM feedback WHERE status = 'neu' AND (qualitaet >= 50 OR rolle = 'lehrer')
   ORDER BY rolle = 'lehrer' DESC, seite, qualitaet DESC;
   ```
   Überblick über alles: `SELECT seite, status, COUNT(*), AVG(qualitaet) FROM feedback GROUP BY seite, status;`
2. **Jeden Eintrag selbst prüfen** – die Zahl ist nur eine Vorsortierung. Ausgewertet wird nur, was
   - sich auf eine bestimmte Stelle bezieht und nachvollziehbar ist (Seite öffnen, Aufgabe nachrechnen, Simulation testen),
   - fachlich stimmt (ein gemeldeter „Fehler“ kann auch ein Denkfehler des Schülers sein – dann ist das ein Hinweis,
     dass Tipp oder Erklärung an der Stelle besser werden sollte, nicht dass die Lösung falsch ist),
   - zur Didaktik der Lernpfade passt (siehe CLAUDE.md) und nicht nur Geschmack ist („zu viel Text“ ohne Stelle).
   Rückmeldungen von Lehrkräften werden immer angesehen und getrennt aufgeführt (sie sind meist fachlich fundiert,
   aber trotzdem nachprüfen). Allgemeines Feedback von der Startseite (`seite = '/'`) gesondert zusammenfassen.
   Mehrere ähnliche Rückmeldungen zur selben Stelle sind ein starkes Zeichen, auch wenn einzelne schwach formuliert sind.
3. Dem Lehrer eine kurze Liste vorlegen: übernehmen / Erklärung verbessern / verwerfen, je mit Grund.
   Erst nach seinem OK ändern, prüfen und veröffentlichen wie üblich.
4. Status setzen:
   ```sql
   UPDATE feedback SET status = 'uebernommen', notiz = 'Toleranz in 4a erhöht' WHERE id = 12;
   UPDATE feedback SET status = 'verworfen' WHERE status = 'neu' AND qualitaet < 30;
   ```

Schwache Einträge (`qualitaet < 50`) bei Bedarf trotzdem überfliegen:
`SELECT id, seite, stelle, art, text FROM feedback WHERE status = 'neu' AND qualitaet < 50;`

## Ohne Claude

Cloudflare-Dashboard → Storage & Databases → D1 → gst-feedback → Console, dort dieselben SQL-Befehle.

-- Datenbank "gst-feedback" (Cloudflare D1). Bereits angelegt; nur für eine neue Datenbank nötig.
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  erstellt TEXT NOT NULL DEFAULT (datetime('now')),
  seite TEXT NOT NULL,          -- z. B. /Physik9/lageenergie
  stelle TEXT,                  -- Abschnitt oder Aufgabe, die der Schüler gewählt hat
  rolle TEXT NOT NULL DEFAULT 'schueler', -- schueler | lehrer
  art TEXT NOT NULL,            -- fehler | unklar | idee | lob
  text TEXT NOT NULL,           -- Was genau?
  vorschlag TEXT,               -- Verbesserungsvorschlag (freiwillig)
  qualitaet INTEGER NOT NULL DEFAULT 0,  -- automatische Vorbewertung 0–100
  gruende TEXT,                 -- warum diese Bewertung (Stichworte)
  status TEXT NOT NULL DEFAULT 'neu',    -- neu | uebernommen | verworfen | erledigt
  notiz TEXT                    -- Notiz bei der Auswertung
);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status, qualitaet);
CREATE INDEX IF NOT EXISTS idx_feedback_erstellt ON feedback(erstellt);

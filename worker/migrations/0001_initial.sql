CREATE TABLE IF NOT EXISTS journal_entries (
  day               INTEGER PRIMARY KEY,
  date              TEXT    NOT NULL,
  city              TEXT    NOT NULL,
  status            TEXT    NOT NULL DEFAULT 'jotting',
  jottings          TEXT    NOT NULL DEFAULT '[]',
  sections          TEXT,
  draft_generated_at TEXT,
  exported_at       TEXT,
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS photos (
  id       TEXT    PRIMARY KEY,
  day      INTEGER NOT NULL,
  r2_key   TEXT    NOT NULL,
  caption  TEXT    NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (day) REFERENCES journal_entries(day)
);

CREATE TABLE IF NOT EXISTS voice_profile (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  description TEXT    NOT NULL DEFAULT '',
  sample      TEXT    NOT NULL DEFAULT '',
  rules       TEXT    NOT NULL DEFAULT '[]'
);

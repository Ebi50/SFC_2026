import type { Database } from 'better-sqlite3';

// Trainingsplan „Hüfte & Rücken“: nur Trainingsdaten, keine Gesundheitsangaben (Art. 9 DSGVO).
// Alle Tabellen hängen per ON DELETE CASCADE am Konto – Kontolöschung entfernt sie mit.
export function initTrainingTables(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS training_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      duration_min INTEGER NOT NULL DEFAULT 20 CHECK (duration_min BETWEEN 10 AND 60),
      rest_s INTEGER NOT NULL DEFAULT 45 CHECK (rest_s BETWEEN 15 AND 60),
      change_s INTEGER NOT NULL DEFAULT 15 CHECK (change_s BETWEEN 15 AND 60),
      cycle_start TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS training_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      block TEXT NOT NULL CHECK (block IN ('warm', 'main', 'cool')),
      exercise_id TEXT NOT NULL,
      variant_index INTEGER NOT NULL,
      sets INTEGER NOT NULL,
      value INTEGER NOT NULL,
      unit TEXT NOT NULL CHECK (unit IN ('reps', 'sec')),
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_id, day, block, exercise_id)
    );
    CREATE INDEX IF NOT EXISTS idx_training_log_user_day ON training_log (user_id, day);

    CREATE TABLE IF NOT EXISTS training_feedback (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 0 CHECK (level BETWEEN -2 AND 2),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, exercise_id)
    );
  `);
}

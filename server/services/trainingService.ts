import { db } from '../database';
import { EX } from '../../lib/training/exercises';
import { isIsoDate, mondayOf, todayIso } from '../../lib/training/dates';
import { SETTING_LIMITS } from '../../lib/training/schedule';
import type { FeedbackMap, LogEntry, TrainingSettings } from '../../lib/training/types';

export class TrainingValidationError extends Error {}

export interface TrainingState {
  settings: TrainingSettings;
  cycleStart: string;
  feedback: FeedbackMap;
}

interface SettingsRow { duration_min: number; rest_s: number; change_s: number; cycle_start: string }
interface LogRow {
  day: string; block: LogEntry['block']; exercise_id: string; variant_index: number;
  sets: number; value: number; unit: LogEntry['unit']; completed_at: string;
}

const fail = (msg: string): never => { throw new TrainingValidationError(msg); };
const isInt = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

function parseDay(v: unknown, field = 'Datum'): string {
  return isIsoDate(v) ? v : fail(`Ungültiges ${field}.`);
}

export function parseSettings(raw: any): TrainingSettings & { cycleStart: string } {
  const out = { dur: raw?.dur, rest: raw?.rest, change: raw?.change };
  for (const k of ['dur', 'rest', 'change'] as const) {
    if (!isInt(out[k], SETTING_LIMITS[k].min, SETTING_LIMITS[k].max)) fail(`Ungültiger Wert für ${k}.`);
  }
  return { ...(out as TrainingSettings), cycleStart: parseDay(raw?.cycleStart, 'Startdatum') };
}

export function parseEntry(raw: any): LogEntry {
  const ex = EX[raw?.exerciseId];
  if (!ex) fail('Unbekannte Übung.');
  if (!['warm', 'main', 'cool'].includes(raw.block)) fail('Ungültiger Block.');
  if (!isInt(raw.variantIndex, 0, ex.v.length - 1)) fail('Ungültige Variante.');
  if (!isInt(raw.sets, 1, 10) || !isInt(raw.value, 1, 600)) fail('Ungültige Dosierung.');
  if (raw.unit !== 'reps' && raw.unit !== 'sec') fail('Ungültige Einheit.');
  return {
    day: parseDay(raw.day), block: raw.block, exerciseId: raw.exerciseId,
    variantIndex: raw.variantIndex, sets: raw.sets, value: raw.value, unit: raw.unit,
  };
}

function rowToSettings(r: SettingsRow) {
  return { settings: { dur: r.duration_min, rest: r.rest_s, change: r.change_s }, cycleStart: r.cycle_start };
}

/** Lädt Einstellungen und Feedback; legt beim ersten Öffnen Standardwerte mit Zyklusstart = Montag der aktuellen Woche an */
export function getState(userId: string, today: unknown): TrainingState {
  let row = db.prepare('SELECT * FROM training_settings WHERE user_id = ?').get(userId) as SettingsRow | undefined;
  if (!row) {
    const start = mondayOf(isIsoDate(today) ? today : todayIso());
    db.prepare('INSERT INTO training_settings (user_id, cycle_start) VALUES (?, ?)').run(userId, start);
    row = db.prepare('SELECT * FROM training_settings WHERE user_id = ?').get(userId) as SettingsRow;
  }
  return { ...rowToSettings(row), feedback: getFeedback(userId) };
}

export function saveSettings(userId: string, raw: unknown) {
  const s = parseSettings(raw);
  db.prepare(`
    INSERT INTO training_settings (user_id, duration_min, rest_s, change_s, cycle_start, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET duration_min = excluded.duration_min, rest_s = excluded.rest_s,
      change_s = excluded.change_s, cycle_start = excluded.cycle_start, updated_at = excluded.updated_at
  `).run(userId, s.dur, s.rest, s.change, s.cycleStart);
}

export function listLog(userId: string, from: unknown, to: unknown): LogEntry[] {
  const rows = db.prepare(`
    SELECT day, block, exercise_id, variant_index, sets, value, unit, completed_at FROM training_log
    WHERE user_id = ? AND day BETWEEN ? AND ? ORDER BY day, completed_at
  `).all(userId, parseDay(from), parseDay(to)) as LogRow[];
  return rows.map(r => ({
    day: r.day, block: r.block, exerciseId: r.exercise_id, variantIndex: r.variant_index,
    sets: r.sets, value: r.value, unit: r.unit, completedAt: r.completed_at,
  }));
}

export function upsertLog(userId: string, raw: unknown) {
  db.prepare(`
    INSERT INTO training_log (user_id, day, block, exercise_id, variant_index, sets, value, unit)
    VALUES (@userId, @day, @block, @exerciseId, @variantIndex, @sets, @value, @unit)
    ON CONFLICT(user_id, day, block, exercise_id) DO UPDATE SET variant_index = excluded.variant_index,
      sets = excluded.sets, value = excluded.value, unit = excluded.unit, completed_at = datetime('now')
  `).run({ userId, ...parseEntry(raw) });
}

export function deleteLog(userId: string, raw: any) {
  const day = parseDay(raw?.day);
  if (!['warm', 'main', 'cool'].includes(raw?.block) || !EX[raw?.exerciseId]) fail('Ungültiger Eintrag.');
  db.prepare('DELETE FROM training_log WHERE user_id = ? AND day = ? AND block = ? AND exercise_id = ?')
    .run(userId, day, raw.block, raw.exerciseId);
}

export function getFeedback(userId: string): FeedbackMap {
  const rows = db.prepare('SELECT exercise_id, level FROM training_feedback WHERE user_id = ?').all(userId) as { exercise_id: string; level: number }[];
  return Object.fromEntries(rows.map(r => [r.exercise_id, r.level]));
}

export function saveFeedback(userId: string, raw: any) {
  if (!EX[raw?.exerciseId]) fail('Unbekannte Übung.');
  if (!isInt(raw.level, -2, 2)) fail('Ungültige Bewertung.');
  db.prepare(`
    INSERT INTO training_feedback (user_id, exercise_id, level, updated_at) VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, exercise_id) DO UPDATE SET level = excluded.level, updated_at = excluded.updated_at
  `).run(userId, raw.exerciseId, raw.level);
}

/**
 * Einmalige Übernahme der Browser-Daten: Einstellungen nur, wenn noch keine existieren;
 * vorhandene Log-Einträge werden nicht überschrieben.
 */
export function importLocal(userId: string, raw: any): { entries: number } {
  const entries = Array.isArray(raw?.entries) ? raw.entries.slice(0, 5000).map(parseEntry) : [];
  const settings = raw?.settings ? parseSettings(raw.settings) : null;
  const insert = db.prepare(`
    INSERT OR IGNORE INTO training_log (user_id, day, block, exercise_id, variant_index, sets, value, unit)
    VALUES (@userId, @day, @block, @exerciseId, @variantIndex, @sets, @value, @unit)
  `);
  let count = 0;
  db.transaction(() => {
    if (settings) {
      db.prepare(`INSERT OR IGNORE INTO training_settings (user_id, duration_min, rest_s, change_s, cycle_start) VALUES (?, ?, ?, ?, ?)`)
        .run(userId, settings.dur, settings.rest, settings.change, settings.cycleStart);
    }
    for (const e of entries) count += insert.run({ userId, ...e }).changes;
  })();
  return { entries: count };
}

export function deleteAllTrainingData(userId: string) {
  db.transaction(() => {
    for (const t of ['training_log', 'training_feedback', 'training_settings']) {
      db.prepare(`DELETE FROM ${t} WHERE user_id = ?`).run(userId);
    }
  })();
}

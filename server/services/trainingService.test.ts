import { beforeAll, describe, expect, it } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfc-training-'));
process.env.DATABASE_PATH = path.join(dir, 'test.sqlite3');

let svc: typeof import('./trainingService');
let db: typeof import('../database')['db'];

const entry = { day: '2026-10-05', block: 'main', exerciseId: 'brs', variantIndex: 1, sets: 2, value: 10, unit: 'reps' };

function addUser(id: string) {
  db.prepare("INSERT INTO participants (id, firstName, lastName, birthYear, perfClass, gender) VALUES (?, 'T', 'T', 1980, 'A', 'M')").run('p-' + id);
  db.prepare("INSERT INTO users (id, email, passwordHash, participantId) VALUES (?, ?, 'x', ?)").run(id, id + '@test.de', 'p-' + id);
}

beforeAll(async () => {
  const database = await import('../database');
  database.initDatabase();
  db = database.db;
  svc = await import('./trainingService');
  addUser('u1');
  addUser('u2');
});

describe('trainingService', () => {
  it('legt beim ersten Abruf Einstellungen mit Zyklusstart am Montag an', () => {
    const st = svc.getState('u1', '2026-10-10');
    expect(st.cycleStart).toBe('2026-10-05');
    expect(st.settings).toEqual({ dur: 20, rest: 45, change: 15 });
  });

  it('speichert Log-Einträge pro Nutzer getrennt (Upsert und Delete)', () => {
    svc.upsertLog('u1', entry);
    svc.upsertLog('u1', { ...entry, sets: 3 });
    expect(svc.listLog('u1', '2026-10-01', '2026-10-31')).toMatchObject([{ exerciseId: 'brs', sets: 3 }]);
    expect(svc.listLog('u2', '2026-10-01', '2026-10-31')).toEqual([]);
    svc.deleteLog('u1', entry);
    expect(svc.listLog('u1', '2026-10-01', '2026-10-31')).toEqual([]);
  });

  it('weist ungültige Eingaben ab', () => {
    expect(() => svc.upsertLog('u1', { ...entry, exerciseId: 'nope' })).toThrow(svc.TrainingValidationError);
    expect(() => svc.saveSettings('u1', { dur: 5, rest: 45, change: 15, cycleStart: '2026-10-05' })).toThrow(svc.TrainingValidationError);
    expect(() => svc.saveFeedback('u1', { exerciseId: 'brs', level: 3 })).toThrow(svc.TrainingValidationError);
  });

  it('übernimmt Browser-Daten nur einmalig und überschreibt keine Einstellungen', () => {
    svc.saveSettings('u1', { dur: 30, rest: 30, change: 20, cycleStart: '2026-09-28' });
    const res = svc.importLocal('u1', { settings: { dur: 10, rest: 15, change: 15, cycleStart: '2026-01-05' }, entries: [entry, entry] });
    expect(res.entries).toBe(1);
    expect(svc.getState('u1', '2026-10-10').settings.dur).toBe(30);
  });

  it('löscht alle Trainingsdaten – auch automatisch mit dem Konto', () => {
    svc.saveFeedback('u2', { exerciseId: 'brs', level: -1 });
    svc.upsertLog('u2', entry);
    svc.deleteAllTrainingData('u2');
    expect(svc.getFeedback('u2')).toEqual({});
    expect(svc.listLog('u2', '2026-01-01', '2026-12-31')).toEqual([]);

    db.prepare('DELETE FROM users WHERE id = ?').run('u1');
    for (const t of ['training_settings', 'training_log', 'training_feedback']) {
      expect(db.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE user_id = 'u1'`).get()).toEqual({ n: 0 });
    }
  });
});

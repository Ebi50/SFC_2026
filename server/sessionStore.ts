import session from 'express-session';
import { db } from './database';

/**
 * SQLite-based session store for express-session.
 * Persists sessions across server restarts.
 */
export class SqliteSessionStore extends session.Store {
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super();
    this.initTable();
    // Clean expired sessions every 15 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 15 * 60 * 1000);
  }

  private initTable() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expired INTEGER NOT NULL
      )
    `);
    // Clean up expired sessions on startup
    this.cleanup();
  }

  private cleanup() {
    try {
      db.prepare('DELETE FROM sessions WHERE expired < ?').run(Date.now());
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  get(sid: string, callback: (err?: any, session?: session.SessionData | null) => void) {
    try {
      const row = db.prepare('SELECT sess FROM sessions WHERE sid = ? AND expired >= ?').get(sid, Date.now()) as any;
      if (row) {
        callback(null, JSON.parse(row.sess));
      } else {
        callback(null, null);
      }
    } catch (err) {
      callback(err);
    }
  }

  set(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
    try {
      const maxAge = sessionData.cookie?.maxAge || 24 * 60 * 60 * 1000;
      const expired = Date.now() + maxAge;
      db.prepare(
        'INSERT OR REPLACE INTO sessions (sid, sess, expired) VALUES (?, ?, ?)'
      ).run(sid, JSON.stringify(sessionData), expired);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  destroy(sid: string, callback?: (err?: any) => void) {
    try {
      db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  touch(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
    try {
      const maxAge = sessionData.cookie?.maxAge || 24 * 60 * 60 * 1000;
      const expired = Date.now() + maxAge;
      db.prepare('UPDATE sessions SET expired = ? WHERE sid = ?').run(expired, sid);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }
}

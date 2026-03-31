import sqlite from 'better-sqlite3';
const Database = sqlite;
import * as path from 'path';

// Database path configuration:
// - Railway (production): /data/database.sqlite3 (persistent volume)
// - Development: ../database.sqlite3 (local)
let dbPath: string;

if (process.env.NODE_ENV === 'production') {
  dbPath = '/data/database.sqlite3';
} else {
  dbPath = path.join(process.cwd(), '..', 'database.sqlite3');
}

console.log('🗄️  Database path:', dbPath);
export const db = new Database(dbPath);

// Enable foreign keys for CASCADE deletes
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      postalCode TEXT,
      birthYear INTEGER NOT NULL,
      perfClass TEXT NOT NULL,
      gender TEXT NOT NULL,
      isRsvMember BOOLEAN NOT NULL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      eventType TEXT NOT NULL,
      notes TEXT,
      finished BOOLEAN NOT NULL DEFAULT 0,
      season INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      participantId TEXT NOT NULL,
      placement INTEGER,
      time TEXT,
      timeSeconds INTEGER,
      points REAL DEFAULT 0,
      winnerRank INTEGER,
      dnf BOOLEAN DEFAULT 0,
      hasAeroBars BOOLEAN DEFAULT 0,
      hasTTEquipment BOOLEAN DEFAULT 0,
      finisherGroup INTEGER,
      rankOverall INTEGER,
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (participantId) REFERENCES participants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      teamId TEXT NOT NULL,
      participantId TEXT NOT NULL,
      penaltyMinus2 BOOLEAN DEFAULT 0,
      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (participantId) REFERENCES participants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS seasons (
      year INTEGER PRIMARY KEY,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS season_settings (
      season INTEGER PRIMARY KEY,
      data TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season) REFERENCES seasons(year) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reglement_files (
      id TEXT PRIMARY KEY,
      season INTEGER NOT NULL,
      filename TEXT NOT NULL,
      uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      fileSize INTEGER,
      FOREIGN KEY (season) REFERENCES seasons(year) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS home_content (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      pdf_file TEXT,
      images TEXT DEFAULT '[]',
      upload_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      participantId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participantId) REFERENCES participants(id)
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      participantId TEXT NOT NULL,
      registeredAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (participantId) REFERENCES participants(id) ON DELETE CASCADE,
      UNIQUE(eventId, participantId)
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expiresAt DATETIME NOT NULL,
      used BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migration: Add missing columns to existing tables
  const addColumnIfNotExists = (table: string, column: string, definition: string) => {
    try {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{name: string}>;
      const columnExists = columns.some(col => col.name === column);
      if (!columnExists) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`Added column ${column} to ${table}`);
      }
    } catch (error) {
      console.error(`Error adding column ${column} to ${table}:`, error);
    }
  };

  // Add report field to events table
  addColumnIfNotExists('events', 'report', 'TEXT');

  // Add time fields to events table
  addColumnIfNotExists('events', 'timeVereinsheim', 'TEXT');
  addColumnIfNotExists('events', 'timeStrecke', 'TEXT');

  // Add missing columns to results table
  addColumnIfNotExists('results', 'timeSeconds', 'INTEGER');
  addColumnIfNotExists('results', 'dnf', 'BOOLEAN DEFAULT 0');
  addColumnIfNotExists('results', 'hasAeroBars', 'BOOLEAN DEFAULT 0');
  addColumnIfNotExists('results', 'hasTTEquipment', 'BOOLEAN DEFAULT 0');
  addColumnIfNotExists('results', 'finisherGroup', 'INTEGER');
  addColumnIfNotExists('results', 'rankOverall', 'INTEGER');
  addColumnIfNotExists('results', 'perfClass', 'TEXT');

  // Backfill perfClass from participants for existing results that have no perfClass
  try {
    const unfilled = db.prepare(
      `SELECT r.id, p.perfClass FROM results r
       JOIN participants p ON r.participantId = p.id
       WHERE r.perfClass IS NULL`
    ).all() as Array<{id: string, perfClass: string}>;
    if (unfilled.length > 0) {
      const updateStmt = db.prepare('UPDATE results SET perfClass = ? WHERE id = ?');
      for (const row of unfilled) {
        updateStmt.run(row.perfClass, row.id);
      }
      console.log(`Backfilled perfClass for ${unfilled.length} existing results`);
    }
  } catch (error) {
    console.error('Error backfilling perfClass:', error);
  }

  // Add missing column to team_members table
  addColumnIfNotExists('team_members', 'penaltyMinus2', 'BOOLEAN DEFAULT 0');

  // Add waiver acceptance tracking to participants
  addColumnIfNotExists('participants', 'waiverAccepted', 'BOOLEAN DEFAULT 0');
  addColumnIfNotExists('participants', 'waiverAcceptedAt', 'DATETIME');

  // Add GDPR data consent tracking
  addColumnIfNotExists('participants', 'dataConsent', 'BOOLEAN DEFAULT 0');
  addColumnIfNotExists('participants', 'dataConsentAt', 'DATETIME');

  // Add photo consent tracking (separate from waiver, DSGVO-compliant)
  addColumnIfNotExists('participants', 'fotoConsent', 'BOOLEAN DEFAULT 0');
  addColumnIfNotExists('participants', 'fotoConsentAt', 'DATETIME');

  // Auto-set dataConsent for participants who have a user account (self-registered)
  try {
    const updated = db.prepare(`
      UPDATE participants SET dataConsent = 1, dataConsentAt = CURRENT_TIMESTAMP
      WHERE dataConsent = 0 AND id IN (SELECT participantId FROM users)
    `).run();
    if (updated.changes > 0) {
      console.log(`Auto-set dataConsent for ${updated.changes} self-registered participants`);
    }
  } catch (error) {
    console.error('Error auto-setting dataConsent:', error);
  }

  // GDPR auto-anonymization: remove contact data for participants without consent after deadline
  const GDPR_DEADLINE = '2026-05-31';
  const now = new Date().toISOString().split('T')[0];
  if (now >= GDPR_DEADLINE) {
    try {
      const anonymized = db.prepare(`
        UPDATE participants
        SET email = NULL, phone = NULL, address = NULL, city = NULL, postalCode = NULL
        WHERE dataConsent = 0
          AND (email IS NOT NULL OR phone IS NOT NULL OR address IS NOT NULL OR city IS NOT NULL OR postalCode IS NOT NULL)
      `).run();
      if (anonymized.changes > 0) {
        console.log(`GDPR: Anonymized contact data for ${anonymized.changes} participants without consent (deadline: ${GDPR_DEADLINE})`);
      }
    } catch (error) {
      console.error('Error during GDPR anonymization:', error);
    }
  }

  // Migration: Fix participants with NULL IDs
  try {
    const nullIdParticipants = db.prepare('SELECT rowid, firstName, lastName FROM participants WHERE id IS NULL').all() as Array<{rowid: number, firstName: string, lastName: string}>;
    if (nullIdParticipants.length > 0) {
      const updateStmt = db.prepare('UPDATE participants SET id = ? WHERE rowid = ?');
      for (const p of nullIdParticipants) {
        const newId = 'p' + Date.now() + Math.random().toString(36).substring(2, 10);
        updateStmt.run(newId, p.rowid);
      }
      console.log(`Fixed ${nullIdParticipants.length} participants with NULL IDs`);
    }
  } catch (error) {
    console.error('Error fixing participant IDs:', error);
  }

  // Migration: Populate seasons table from existing events
  try {
    const existingSeasons = db.prepare('SELECT DISTINCT season FROM events').all() as Array<{season: number}>;
    const insertSeason = db.prepare('INSERT OR IGNORE INTO seasons (year) VALUES (?)');
    
    for (const {season} of existingSeasons) {
      insertSeason.run(season);
    }
    
    if (existingSeasons.length > 0) {
      console.log(`Migrated ${existingSeasons.length} seasons from events to seasons table`);
    }
  } catch (error) {
    console.error('Error migrating seasons:', error);
  }
}

export function sanitizeParticipant(participant: any, includeContactInfo: boolean = false) {
  const basic = {
    id: participant.id,
    firstName: participant.firstName,
    lastName: participant.lastName,
    birthYear: participant.birthYear,
    perfClass: participant.perfClass,
    gender: participant.gender,
    isRsvMember: Boolean(participant.isRsvMember)
  };

  if (includeContactInfo) {
    return {
      ...basic,
      email: participant.email || '',
      phone: participant.phone || '',
      waiverAccepted: Boolean(participant.waiverAccepted),
      waiverAcceptedAt: participant.waiverAcceptedAt || null,
      dataConsent: Boolean(participant.dataConsent),
      dataConsentAt: participant.dataConsentAt || null,
      fotoConsent: Boolean(participant.fotoConsent),
      fotoConsentAt: participant.fotoConsentAt || null
    };
  }

  return basic;
}

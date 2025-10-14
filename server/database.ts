import sqlite from 'better-sqlite3';
const Database = sqlite;
import * as path from 'path';

// Use current working directory for database in production
const dbPath = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'database.sqlite3')
  : path.join(process.cwd(), '..', 'database.sqlite3');
console.log('Connecting to database at:', dbPath);
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

  // Add missing columns to results table
  addColumnIfNotExists('results', 'timeSeconds', 'INTEGER');
  addColumnIfNotExists('results', 'dnf', 'BOOLEAN DEFAULT 0');
  addColumnIfNotExists('results', 'hasAeroBars', 'BOOLEAN DEFAULT 0');
  addColumnIfNotExists('results', 'hasTTEquipment', 'BOOLEAN DEFAULT 0');
  addColumnIfNotExists('results', 'finisherGroup', 'INTEGER');
  addColumnIfNotExists('results', 'rankOverall', 'INTEGER');

  // Add missing column to team_members table
  addColumnIfNotExists('team_members', 'penaltyMinus2', 'BOOLEAN DEFAULT 0');

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

export function sanitizeParticipant(participant: any, includeAddress: boolean = false) {
  const basic = {
    id: participant.id,
    firstName: participant.firstName,
    lastName: participant.lastName,
    birthYear: participant.birthYear,
    perfClass: participant.perfClass,
    gender: participant.gender,
    isRsvMember: Boolean(participant.isRsvMember)
  };

  if (includeAddress) {
    return {
      ...basic,
      email: participant.email || '',
      phone: participant.phone || '',
      address: participant.address || '',
      city: participant.city || '',
      postalCode: participant.postalCode || ''
    };
  }

  return basic;
}

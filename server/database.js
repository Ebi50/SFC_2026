"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initDatabase = initDatabase;
exports.sanitizeParticipant = sanitizeParticipant;
var better_sqlite3_1 = require("better-sqlite3");
var path_1 = require("path");
var dbPath = path_1.default.join(process.cwd(), '..', 'database.sqlite3');
console.log('Connecting to database at:', dbPath);
exports.db = new better_sqlite3_1.default(dbPath);
// Enable foreign keys for CASCADE deletes
exports.db.pragma('foreign_keys = ON');
function initDatabase() {
    exports.db.exec("\n    CREATE TABLE IF NOT EXISTS participants (\n      id TEXT PRIMARY KEY,\n      firstName TEXT NOT NULL,\n      lastName TEXT NOT NULL,\n      email TEXT,\n      phone TEXT,\n      address TEXT,\n      city TEXT,\n      postalCode TEXT,\n      birthYear INTEGER NOT NULL,\n      perfClass TEXT NOT NULL,\n      gender TEXT NOT NULL,\n      isRsvMember BOOLEAN NOT NULL DEFAULT 0,\n      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP\n    );\n\n    CREATE TABLE IF NOT EXISTS events (\n      id TEXT PRIMARY KEY,\n      name TEXT NOT NULL,\n      date TEXT NOT NULL,\n      location TEXT NOT NULL,\n      eventType TEXT NOT NULL,\n      notes TEXT,\n      finished BOOLEAN NOT NULL DEFAULT 0,\n      season INTEGER NOT NULL,\n      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP\n    );\n\n    CREATE TABLE IF NOT EXISTS results (\n      id TEXT PRIMARY KEY,\n      eventId TEXT NOT NULL,\n      participantId TEXT NOT NULL,\n      placement INTEGER,\n      time TEXT,\n      timeSeconds INTEGER,\n      points REAL DEFAULT 0,\n      winnerRank INTEGER,\n      dnf BOOLEAN DEFAULT 0,\n      hasAeroBars BOOLEAN DEFAULT 0,\n      hasTTEquipment BOOLEAN DEFAULT 0,\n      finisherGroup INTEGER,\n      rankOverall INTEGER,\n      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,\n      FOREIGN KEY (participantId) REFERENCES participants(id) ON DELETE CASCADE\n    );\n\n    CREATE TABLE IF NOT EXISTS teams (\n      id TEXT PRIMARY KEY,\n      eventId TEXT NOT NULL,\n      name TEXT NOT NULL,\n      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE\n    );\n\n    CREATE TABLE IF NOT EXISTS team_members (\n      id TEXT PRIMARY KEY,\n      teamId TEXT NOT NULL,\n      participantId TEXT NOT NULL,\n      penaltyMinus2 BOOLEAN DEFAULT 0,\n      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,\n      FOREIGN KEY (participantId) REFERENCES participants(id) ON DELETE CASCADE\n    );\n\n    CREATE TABLE IF NOT EXISTS settings (\n      id INTEGER PRIMARY KEY CHECK (id = 1),\n      data TEXT NOT NULL,\n      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP\n    );\n\n    CREATE TABLE IF NOT EXISTS seasons (\n      year INTEGER PRIMARY KEY,\n      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP\n    );\n\n    CREATE TABLE IF NOT EXISTS season_settings (\n      season INTEGER PRIMARY KEY,\n      data TEXT NOT NULL,\n      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,\n      FOREIGN KEY (season) REFERENCES seasons(year) ON DELETE CASCADE\n    );\n\n    CREATE TABLE IF NOT EXISTS reglement_files (\n      id TEXT PRIMARY KEY,\n      season INTEGER NOT NULL,\n      filename TEXT NOT NULL,\n      uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,\n      fileSize INTEGER,\n      FOREIGN KEY (season) REFERENCES seasons(year) ON DELETE CASCADE\n    );\n  ");
    // Migration: Add missing columns to existing tables
    var addColumnIfNotExists = function (table, column, definition) {
        try {
            var columns = exports.db.prepare("PRAGMA table_info(".concat(table, ")")).all();
            var columnExists = columns.some(function (col) { return col.name === column; });
            if (!columnExists) {
                exports.db.exec("ALTER TABLE ".concat(table, " ADD COLUMN ").concat(column, " ").concat(definition));
                console.log("Added column ".concat(column, " to ").concat(table));
            }
        }
        catch (error) {
            console.error("Error adding column ".concat(column, " to ").concat(table, ":"), error);
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
        var existingSeasons = exports.db.prepare('SELECT DISTINCT season FROM events').all();
        var insertSeason = exports.db.prepare('INSERT OR IGNORE INTO seasons (year) VALUES (?)');
        for (var _i = 0, existingSeasons_1 = existingSeasons; _i < existingSeasons_1.length; _i++) {
            var season = existingSeasons_1[_i].season;
            insertSeason.run(season);
        }
        if (existingSeasons.length > 0) {
            console.log("Migrated ".concat(existingSeasons.length, " seasons from events to seasons table"));
        }
    }
    catch (error) {
        console.error('Error migrating seasons:', error);
    }
}
function sanitizeParticipant(participant, includeAddress) {
    if (includeAddress === void 0) { includeAddress = false; }
    var basic = {
        id: participant.id,
        firstName: participant.firstName,
        lastName: participant.lastName,
        birthYear: participant.birthYear,
        perfClass: participant.perfClass,
        gender: participant.gender,
        isRsvMember: Boolean(participant.isRsvMember)
    };
    if (includeAddress) {
        return __assign(__assign({}, basic), { email: participant.email, phone: participant.phone, address: participant.address, city: participant.city, postalCode: participant.postalCode });
    }
    return basic;
}

import { db } from './database';

// Initialize database with season 2025
console.log('Initializing database...');

try {
    // Create tables first
    console.log('Creating database tables...');
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

        CREATE TABLE IF NOT EXISTS seasons (
            year INTEGER PRIMARY KEY,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS season_settings (
            season INTEGER PRIMARY KEY,
            data TEXT NOT NULL,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (season) REFERENCES seasons(year) ON DELETE CASCADE
        );
    `);

    // Start transaction for data insertion
    db.exec('BEGIN TRANSACTION');

    // Create seasons 2005 and 2025
    console.log('Creating seasons 2005 and 2025...');
    const seasons = [2005, 2025];
    for (const year of seasons) {
        try {
            db.prepare('INSERT INTO seasons (year) VALUES (?)').run(year);
            console.log(`Season ${year} created successfully`);
        } catch (error) {
            console.log(`Season ${year} already exists`);
        }
    }

    // Create default settings
    console.log('Creating default settings...');
    const defaultSettings = {
        handicaps: { A: 0, B: 120, C: 240, D: 480 },
        teamSizes: { EZF: 1, BZF: 1, MZF: 4 },
        defaultPerfClass: 'B'
    };

    db.prepare(
        'INSERT INTO settings (id, data) VALUES (?, ?)'
    ).run(1, JSON.stringify(defaultSettings));

    // Create season settings for both seasons
    console.log('Creating season settings...');
    for (const year of seasons) {
        try {
            db.prepare(
                'INSERT INTO season_settings (season, data) VALUES (?, ?)'
            ).run(year, JSON.stringify(defaultSettings));
            console.log(`Season settings for ${year} created successfully`);
        } catch (error) {
            console.log(`Season settings for ${year} already exist`);
        }
    }

    // Commit transaction
    db.exec('COMMIT');
    console.log('Database initialized successfully!');

} catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    console.error('Error initializing database:', error);
    process.exit(1);
}
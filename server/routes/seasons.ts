import express from 'express';
import { db } from '../database';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    console.log('Fetching seasons from database...');
    
    // Debug: List all tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Database tables:', tables);
    
    // Debug: Check if seasons table exists and has data
    if (tables.some(t => t.name === 'seasons')) {
      const count = db.prepare('SELECT COUNT(*) as count FROM seasons').get();
      console.log('Number of seasons in database:', count);
      
      // Debug: Show all seasons
      const allSeasons = db.prepare('SELECT * FROM seasons').all();
      console.log('All seasons:', allSeasons);
    } else {
      console.log('Seasons table does not exist!');
    }
    
    const seasons = db.prepare('SELECT year FROM seasons ORDER BY year DESC').all();
    console.log('Found seasons:', seasons);
    res.json({ seasons: seasons.map(s => (s as any).year) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  const { year } = req.body;
  
  try {
    // Start transaction
    db.exec('BEGIN TRANSACTION');
    
    // Create new season
    db.prepare('INSERT INTO seasons (year) VALUES (?)').run(year);
    
    // Copy settings from previous season (year - 1) or use global settings
    const previousYear = year - 1;
    const previousSeasonSettings = db.prepare(
      'SELECT data FROM season_settings WHERE season = ?'
    ).get(previousYear) as { data: string } | undefined;
    
    let settingsData: string;
    
    if (previousSeasonSettings) {
      // Copy from previous season
      settingsData = previousSeasonSettings.data;
      console.log(`Copying settings from season ${previousYear} to ${year}`);
    } else {
      // Use global settings as fallback
      const globalSettings = db.prepare(
        'SELECT data FROM settings WHERE id = 1'
      ).get() as { data: string } | undefined;
      
      settingsData = globalSettings?.data || JSON.stringify({
        handicaps: { A: 0, B: 120, C: 240, D: 480 }
      });
      console.log(`Using global/default settings for new season ${year}`);
    }
    
    // Insert settings for new season
    db.prepare(
      'INSERT INTO season_settings (season, data) VALUES (?, ?)'
    ).run(year, settingsData);
    
    db.exec('COMMIT');
    
    res.status(201).json({ year });
  } catch (error: any) {
    db.exec('ROLLBACK');
    
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Diese Saison existiert bereits' });
    }
    console.error('Error creating season:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

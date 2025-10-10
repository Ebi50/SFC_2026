import express from 'express';
import { db } from '../database';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const seasons = db.prepare('SELECT year FROM seasons ORDER BY year DESC').all();
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

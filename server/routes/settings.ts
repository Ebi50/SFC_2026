import { Router } from 'express';
import { db } from '../database';

const router = Router();

router.get('/', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM settings WHERE id = 1').get() as { data: string } | undefined;
    
    if (row) {
      res.json(JSON.parse(row.data));
    } else {
      res.status(404).json({ error: 'Settings not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  try {
    const settingsData = JSON.stringify(req.body);
    
    const existing = db.prepare('SELECT id FROM settings WHERE id = 1').get();
    
    if (existing) {
      db.prepare('UPDATE settings SET data = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = 1')
        .run(settingsData);
    } else {
      db.prepare('INSERT INTO settings (id, data) VALUES (1, ?)')
        .run(settingsData);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/increment-views', (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM settings WHERE id = 1').get() as { data: string } | undefined;
    
    let settings: any = {};
    if (row) {
      settings = JSON.parse(row.data);
    }
    
    settings.pageViews = (settings.pageViews || 0) + 1;
    const settingsData = JSON.stringify(settings);
    
    const existing = db.prepare('SELECT id FROM settings WHERE id = 1').get();
    
    if (existing) {
      db.prepare('UPDATE settings SET data = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = 1')
        .run(settingsData);
    } else {
      db.prepare('INSERT INTO settings (id, data) VALUES (1, ?)')
        .run(settingsData);
    }
    
    res.json({ success: true, pageViews: settings.pageViews });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Season-specific settings routes
router.get('/season/:year', (req, res) => {
  try {
    const { year } = req.params;
    const row = db.prepare('SELECT data FROM season_settings WHERE season = ?').get(year) as { data: string } | undefined;
    
    if (row) {
      res.json(JSON.parse(row.data));
    } else {
      // Fallback to global settings if season settings don't exist
      const globalRow = db.prepare('SELECT data FROM settings WHERE id = 1').get() as { data: string } | undefined;
      if (globalRow) {
        res.json(JSON.parse(globalRow.data));
      } else {
        res.status(404).json({ error: 'Settings not found' });
      }
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/season/:year', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  try {
    const { year } = req.params;
    const settingsData = JSON.stringify(req.body);
    
    const existing = db.prepare('SELECT season FROM season_settings WHERE season = ?').get(year);
    
    if (existing) {
      db.prepare('UPDATE season_settings SET data = ?, updatedAt = CURRENT_TIMESTAMP WHERE season = ?')
        .run(settingsData, year);
    } else {
      db.prepare('INSERT INTO season_settings (season, data) VALUES (?, ?)')
        .run(year, settingsData);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

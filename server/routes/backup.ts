import express from 'express';
import { exportDatabase, collectFiles } from '../services/backupService';

const router = express.Router();

// Shared-secret auth for non-interactive backup jobs (e.g. GitHub Actions).
// Distinct from admin sessions since scripted jobs can't hold a login session.
router.use((req, res, next) => {
  const key = process.env.BACKUP_API_KEY;
  if (!key || req.get('x-backup-key') !== key) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }
  next();
});

// GET /api/backup/full - Complete disaster-recovery snapshot (DB rows + uploaded files)
router.get('/full', (req, res) => {
  try {
    res.json({
      exportedAt: new Date().toISOString(),
      tables: exportDatabase(),
      files: collectFiles(),
    });
  } catch (error: any) {
    console.error('Backup export error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

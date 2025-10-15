// Reglement Routes - Local storage only
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../database';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGLEMENT_DIR = path.join(__dirname, '../../public/reglement');

// Ensure reglement directory exists
if (!fs.existsSync(REGLEMENT_DIR)) {
  fs.mkdirSync(REGLEMENT_DIR, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, REGLEMENT_DIR);
  },
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeName = originalName.replace(/[^a-zA-Z0-9._äöüÄÖÜß-]/g, '_');
    cb(null, safeName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Nur PDF, DOC, DOCX und TXT Dateien sind erlaubt'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Get reglement for season
router.get('/:season', (req, res) => {
  try {
    const season = parseInt(req.params.season);
    const reglementData = db.prepare('SELECT * FROM reglement_files WHERE season = ?').get(season);
    
    if (!reglementData) {
      return res.status(404).json({ error: 'Reglement nicht gefunden' });
    }

    const filePath = path.join(REGLEMENT_DIR, reglementData.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Datei nicht gefunden' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${reglementData.filename}"`);
    res.sendFile(filePath);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload reglement
router.post('/upload/:season', upload.single('reglement'), (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }

  try {
    const season = parseInt(req.params.season);
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const safeName = originalName.replace(/[^a-zA-Z0-9._äöüÄÖÜß-]/g, '_');
    
    // Save to database
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO reglement_files (id, season, filename, uploadedAt)
      VALUES (?, ?, ?, ?)
    `);
    
    const id = `reglement_${season}_${Date.now()}`;
    stmt.run(id, season, safeName, new Date().toISOString());
    
    res.json({
      id,
      season,
      filename: safeName,
      uploadedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
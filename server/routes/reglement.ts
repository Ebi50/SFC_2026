// Reglement (PDF) Routes mit Replit Object Storage Fallback
// Referenced from blueprint:javascript_object_storage
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ObjectStorageService } from '../objectStorage';
import { db } from '../database';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reglementDir = path.join(__dirname, '../../public/reglement');

// Ensure reglement directory exists for fallback
if (!fs.existsSync(reglementDir)) {
  fs.mkdirSync(reglementDir, { recursive: true });
}

// Check if Object Storage is configured
function isObjectStorageConfigured(): boolean {
  return !!process.env.OBJECT_STORAGE_BUCKET;
}

// Always use memory storage to have full control over filename
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Nur PDF-Dateien sind erlaubt'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.post('/upload', (req, res, next) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }
  next();
}, upload.single('reglement'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }

  const seasonYear = req.body.seasonYear;
  if (!seasonYear) {
    return res.status(400).json({ error: 'Saison Jahr fehlt' });
  }

  try {
    const filename = `reglement-${seasonYear}.pdf`;
    
    if (isObjectStorageConfigured()) {
      // Use Object Storage
      const objectStorage = new ObjectStorageService();
      
      await objectStorage.uploadFile(
        filename,
        req.file.buffer,
        'application/pdf',
        'reglement'
      );

      // Save metadata to database
      const existing = db.prepare('SELECT id FROM reglement_files WHERE season = ?').get(seasonYear);
      
      if (existing) {
        db.prepare('UPDATE reglement_files SET filename = ?, fileSize = ?, uploadDate = CURRENT_TIMESTAMP WHERE season = ?')
          .run(filename, req.file.size, seasonYear);
      } else {
        const id = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        db.prepare('INSERT INTO reglement_files (id, season, filename, fileSize) VALUES (?, ?, ?, ?)')
          .run(id, seasonYear, filename, req.file.size);
      }

      res.json({ 
        message: 'Reglement erfolgreich hochgeladen',
        filename,
        seasonYear
      });
    } else {
      // Fallback to filesystem - save file manually
      const filePath = path.join(reglementDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      
      const existing = db.prepare('SELECT id FROM reglement_files WHERE season = ?').get(seasonYear);
      
      if (existing) {
        db.prepare('UPDATE reglement_files SET filename = ?, fileSize = ?, uploadDate = CURRENT_TIMESTAMP WHERE season = ?')
          .run(filename, req.file.size, seasonYear);
      } else {
        const id = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        db.prepare('INSERT INTO reglement_files (id, season, filename, fileSize) VALUES (?, ?, ?, ?)')
          .run(id, seasonYear, filename, req.file.size);
      }
      
      res.json({ 
        message: 'Reglement erfolgreich hochgeladen',
        filename,
        seasonYear 
      });
    }
  } catch (error) {
    console.error('Error uploading reglement:', error);
    res.status(500).json({ error: 'Fehler beim Hochladen des Reglements' });
  }
});

router.get('/download/:seasonYear', async (req, res) => {
  try {
    const seasonYear = req.params.seasonYear;
    const reglementData = db.prepare('SELECT * FROM reglement_files WHERE season = ?').get(seasonYear) as any;
    
    if (!reglementData) {
      return res.status(404).json({ error: 'Kein Reglement für diese Saison vorhanden' });
    }
    
    if (isObjectStorageConfigured()) {
      // Use Object Storage
      const objectStorage = new ObjectStorageService();
      const file = await objectStorage.getFile('reglement', reglementData.filename);

      if (!file) {
        return res.status(404).json({ error: 'Kein Reglement vorhanden' });
      }

      await objectStorage.downloadFile(file, res);
    } else {
      // Fallback to filesystem
      const reglementPath = path.join(reglementDir, reglementData.filename);
      
      if (!fs.existsSync(reglementPath)) {
        return res.status(404).json({ error: 'Kein Reglement vorhanden' });
      }
      
      res.sendFile(reglementPath);
    }
  } catch (error) {
    console.error('Error downloading reglement:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Fehler beim Herunterladen des Reglements' });
    }
  }
});

router.get('/exists/:seasonYear', async (req, res) => {
  try {
    const seasonYear = req.params.seasonYear;
    const reglementData = db.prepare('SELECT * FROM reglement_files WHERE season = ?').get(seasonYear) as any;
    
    if (reglementData) {
      res.json({
        exists: true,
        path: `/api/reglement/download/${seasonYear}`,
        uploadDate: reglementData.uploadDate,
        size: reglementData.fileSize,
        seasonYear: reglementData.season
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking reglement:', error);
    res.json({ exists: false });
  }
});

// Get all reglements
router.get('/all', async (req, res) => {
  try {
    const reglements = db.prepare('SELECT * FROM reglement_files ORDER BY season DESC').all() as any[];
    // Map to legacy field names for frontend compatibility
    const mappedReglements = reglements.map(r => ({
      id: r.id,
      seasonYear: r.season,
      filename: r.filename,
      uploadedAt: r.uploadDate,
      size: r.fileSize
    }));
    res.json({ reglements: mappedReglements });
  } catch (error) {
    console.error('Error fetching reglements:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Reglements' });
  }
});

export default router;

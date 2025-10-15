// Strecken (GPX) Routes - Local storage only
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GPX_DIR = path.join(__dirname, '../../public/gpx');

// Ensure GPX directory exists
if (!fs.existsSync(GPX_DIR)) {
  fs.mkdirSync(GPX_DIR, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, GPX_DIR);
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
    if (file.originalname.toLowerCase().endsWith('.gpx')) {
      cb(null, true);
    } else {
      cb(new Error('Nur GPX-Dateien sind erlaubt'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Get all GPX files
router.get('/', async (req, res) => {
  try {
    const files = fs.readdirSync(GPX_DIR)
      .filter(file => file.toLowerCase().endsWith('.gpx'))
      .map(filename => {
        const filePath = path.join(GPX_DIR, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          path: `/api/strecken/download/${filename}`,
          uploadDate: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());

    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload GPX file
router.post('/upload', upload.single('gpx'), (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }

  try {
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const safeName = originalName.replace(/[^a-zA-Z0-9._äöüÄÖÜß-]/g, '_');
    
    res.json({
      filename: safeName,
      path: `/api/strecken/download/${safeName}`,
      size: req.file.size
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Download GPX file
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(GPX_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Datei nicht gefunden' });
  }

  try {
    res.setHeader('Content-Type', 'application/gpx+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filePath);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete GPX file
router.delete('/:filename', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  const filename = req.params.filename;
  const filePath = path.join(GPX_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Datei nicht gefunden' });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
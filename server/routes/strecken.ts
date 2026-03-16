// Strecken (GPX) Routes - Local storage
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
const GPX_DIR = isRailway ? '/data/gpx' : path.join(__dirname, '../../public/gpx');

// Ensure GPX directory exists
if (!fs.existsSync(GPX_DIR)) {
  fs.mkdirSync(GPX_DIR, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, GPX_DIR);
  },
  filename: (_req: any, file: any, cb: any) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeName = originalName.replace(/[^a-zA-Z0-9._äöüÄÖÜß-]/g, '_');
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req: any, file: any, cb: any) => {
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
router.get('/', (_req, res) => {
  try {
    if (!fs.existsSync(GPX_DIR)) {
      return res.json([]);
    }

    const files = fs.readdirSync(GPX_DIR)
      .filter((f: string) => f.toLowerCase().endsWith('.gpx'))
      .map((filename: string) => {
        const filePath = path.join(GPX_DIR, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          path: `/api/strecken/download/${filename}`,
          uploadDate: stats.mtime,
          size: stats.size
        };
      })
      .sort((a: any, b: any) => b.uploadDate.getTime() - a.uploadDate.getTime());

    res.json(files);
  } catch (error: any) {
    console.error('Error listing GPX files:', error);
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

  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const safeName = originalName.replace(/[^a-zA-Z0-9._äöüÄÖÜß-]/g, '_');

  res.json({
    filename: safeName,
    path: `/api/strecken/download/${safeName}`,
    size: req.file.size,
  });
});

// Download GPX file
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(GPX_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Datei nicht gefunden' });
  }

  res.setHeader('Content-Type', 'application/gpx+xml');
  if (req.query.download === '1') {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }
  res.sendFile(filePath);
});

// Delete GPX file
router.delete('/:filename', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  const filename = req.params.filename;
  const filePath = path.join(GPX_DIR, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting GPX file:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

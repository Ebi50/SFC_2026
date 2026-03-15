// Strecken (GPX) Routes - Local storage with optional cloud sync
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GPX_DIR = path.join(__dirname, '../../public/gpx');
const isCloudRun = !!process.env.K_SERVICE;

// Only import CloudStorageService on Cloud Run
let CloudStorage: any = null;
if (isCloudRun) {
  import('../cloudStorage').then(m => { CloudStorage = m.CloudStorageService; }).catch(() => {});
}

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

// Helper: list local GPX files
function listLocalFiles() {
  if (!fs.existsSync(GPX_DIR)) return [];
  return fs.readdirSync(GPX_DIR)
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
}

// Get all GPX files
router.get('/', async (_req, res) => {
  try {
    if (CloudStorage) {
      // Cloud Run: use cloud storage
      const cloudFiles = await CloudStorage.listGpxFiles();
      const formattedFiles = cloudFiles.map((file: any) => ({
        filename: file.name,
        path: `/api/strecken/download/${file.name}`,
        uploadDate: new Date(file.updated),
        size: file.size
      })).sort((a: any, b: any) => b.uploadDate.getTime() - a.uploadDate.getTime());
      res.json(formattedFiles);
    } else {
      // Railway / Local: use local filesystem
      res.json(listLocalFiles());
    }
  } catch (error: any) {
    console.error('Error listing GPX files:', error);
    // Fallback to local files
    res.json(listLocalFiles());
  }
});

// Upload GPX file
router.post('/upload', upload.single('gpx'), async (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }

  try {
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const safeName = originalName.replace(/[^a-zA-Z0-9._äöüÄÖÜß-]/g, '_');

    // Optionally upload to cloud storage
    if (CloudStorage) {
      await CloudStorage.uploadGpxFile(req.file.path, safeName).catch(() => {});
    }

    res.json({
      filename: safeName,
      path: `/api/strecken/download/${safeName}`,
      size: req.file.size,
    });
  } catch (error: any) {
    console.error('Error uploading GPX file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download GPX file
router.get('/download/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(GPX_DIR, filename);

  // Check if file exists locally
  if (!fs.existsSync(filePath)) {
    // Try cloud storage fallback
    if (CloudStorage) {
      const ok = await CloudStorage.downloadGpxFile(filename, filePath).catch(() => false);
      if (!ok) return res.status(404).json({ error: 'Datei nicht gefunden' });
    } else {
      return res.status(404).json({ error: 'Datei nicht gefunden' });
    }
  }

  try {
    res.setHeader('Content-Type', 'application/gpx+xml');
    if (req.query.download === '1') {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    res.sendFile(filePath);
  } catch (error: any) {
    console.error('Error serving GPX file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete GPX file
router.delete('/:filename', async (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  const filename = req.params.filename;
  const filePath = path.join(GPX_DIR, filename);

  try {
    // Delete locally
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Optionally delete from cloud
    if (CloudStorage) {
      await CloudStorage.deleteGpxFile(filename).catch(() => {});
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting GPX file:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

// Strecken (GPX) Routes mit Replit Object Storage Fallback
// Referenced from blueprint:javascript_object_storage
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ObjectStorageService } from '../objectStorage';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GPX_DIR = path.join(__dirname, '../../public/gpx');

// Ensure GPX directory exists for fallback
if (!fs.existsSync(GPX_DIR)) {
  fs.mkdirSync(GPX_DIR, { recursive: true });
}

// Check if Object Storage is configured
function isObjectStorageConfigured(): boolean {
  return !!process.env.OBJECT_STORAGE_BUCKET;
}

// Disk storage fallback
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, GPX_DIR);
  },
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeName = originalName.replace(/[^a-zA-Z0-9._äöüÄÖÜß-]/g, '_');
    cb(null, safeName);
  },
});

// Memory storage for Object Storage
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: isObjectStorageConfigured() ? memoryStorage : diskStorage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.gpx')) {
      cb(null, true);
    } else {
      cb(new Error('Nur GPX-Dateien sind erlaubt'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.get('/', async (req, res) => {
  try {
    if (isObjectStorageConfigured()) {
      // Use Object Storage
      const objectStorage = new ObjectStorageService();
      const files = await objectStorage.listFiles('gpx');
      
      const formattedFiles = files.map(file => ({
        filename: file.name,
        path: `/api/strecken/download/${file.name}`,
        uploadDate: file.uploadedAt,
      })).sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());

      res.json(formattedFiles);
    } else {
      // Fallback to filesystem
      const files = fs.readdirSync(GPX_DIR)
        .filter(file => file.endsWith('.gpx'))
        .map(filename => ({
          filename,
          path: `/api/strecken/download/${filename}`,
          uploadDate: fs.statSync(path.join(GPX_DIR, filename)).mtime,
        }))
        .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());

      res.json(files);
    }
  } catch (error) {
    console.error('Error listing GPX files:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Strecken' });
  }
});

router.post('/upload', upload.single('gpx'), async (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Admin-Zugriff erforderlich' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }

  try {
    if (isObjectStorageConfigured()) {
      // Use Object Storage
      const objectStorage = new ObjectStorageService();
      const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      const safeName = originalName.replace(/[^a-zA-Z0-9._äöüÄÖÜß-]/g, '_');
      
      await objectStorage.uploadFile(
        safeName,
        req.file.buffer,
        'application/gpx+xml',
        'gpx'
      );

      res.json({
        filename: safeName,
        path: `/api/strecken/download/${safeName}`,
      });
    } else {
      // Fallback - file already saved by multer disk storage
      res.json({
        filename: req.file.filename,
        path: `/api/strecken/download/${req.file.filename}`,
      });
    }
  } catch (error) {
    console.error('Error uploading GPX file:', error);
    res.status(500).json({ error: 'Fehler beim Hochladen der Datei' });
  }
});

router.get('/download/:filename', async (req, res) => {
  const { filename } = req.params;

  // Security: Prevent path traversal attacks
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Ungültiger Dateiname' });
  }

  try {
    if (isObjectStorageConfigured()) {
      // Use Object Storage
      const objectStorage = new ObjectStorageService();
      console.log('Fetching GPX file from storage:', filename);
      const file = await objectStorage.getFile('gpx', filename);

      if (!file) {
        console.error('GPX file not found in storage:', filename);
        return res.status(404).json({ error: 'Datei nicht gefunden' });
      }

      try {
        console.log('Starting download of GPX file:', filename);
        await objectStorage.downloadFile(file, res);
        console.log('GPX file download completed:', filename);
      } catch (downloadError) {
        console.error('Error during file download:', downloadError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Fehler beim Herunterladen der Datei' });
        }
      }
    } else {
      // Fallback to filesystem
      const filePath = path.join(GPX_DIR, filename);
      
      // Security: Verify the resolved path is within GPX_DIR
      const resolvedPath = path.resolve(filePath);
      const resolvedDir = path.resolve(GPX_DIR);
      if (!resolvedPath.startsWith(resolvedDir)) {
        return res.status(403).json({ error: 'Zugriff verweigert' });
      }
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Datei nicht gefunden' });
      }
      res.sendFile(filePath);
    }
  } catch (error) {
    console.error('Error downloading GPX file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Fehler beim Herunterladen der Datei' });
    }
  }
});

router.delete('/:filename', async (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Admin-Zugriff erforderlich' });
  }

  const { filename } = req.params;

  // Security: Prevent path traversal attacks
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Ungültiger Dateiname' });
  }

  try {
    if (isObjectStorageConfigured()) {
      // Use Object Storage
      const objectStorage = new ObjectStorageService();
      const success = await objectStorage.deleteFile('gpx', filename);

      if (!success) {
        return res.status(404).json({ error: 'Datei nicht gefunden' });
      }

      res.json({ message: 'Datei erfolgreich gelöscht' });
    } else {
      // Fallback to filesystem
      const filePath = path.join(GPX_DIR, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Datei nicht gefunden' });
      }

      fs.unlinkSync(filePath);
      res.json({ message: 'Datei erfolgreich gelöscht' });
    }
  } catch (error) {
    console.error('Error deleting GPX file:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Datei' });
  }
});

export default router;

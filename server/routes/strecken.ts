// Strecken (GPX) Routes - Cloud storage with local cache
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CloudStorageService } from '../cloudStorage';

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

// Get all GPX files from cloud storage
router.get('/', async (req, res) => {
  try {
    // Get files from cloud storage
    const cloudFiles = await CloudStorageService.listGpxFiles();
    
    // Also check local files and sync any missing from cloud
    let localFiles: any[] = [];
    if (fs.existsSync(GPX_DIR)) {
      localFiles = fs.readdirSync(GPX_DIR)
        .filter(file => file.toLowerCase().endsWith('.gpx'))
        .map(filename => {
          const filePath = path.join(GPX_DIR, filename);
          const stats = fs.statSync(filePath);
          return { filename, stats };
        });
    }

    // Sync local files to cloud if they're missing
    for (const localFile of localFiles) {
      const existsInCloud = cloudFiles.some(cf => cf.name === localFile.filename);
      if (!existsInCloud) {
        const localPath = path.join(GPX_DIR, localFile.filename);
        await CloudStorageService.uploadGpxFile(localPath, localFile.filename);
      }
    }

    // Re-fetch cloud files after sync
    const finalFiles = await CloudStorageService.listGpxFiles();
    
    const formattedFiles = finalFiles.map(file => ({
      filename: file.name,
      path: `/api/strecken/download/${file.name}`,
      uploadDate: new Date(file.updated),
      size: file.size
    })).sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());

    res.json(formattedFiles);
  } catch (error: any) {
    console.error('Error listing GPX files:', error);
    res.status(500).json({ error: error.message });
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
    
    // Upload to cloud storage
    const localPath = req.file.path;
    const uploadSuccess = await CloudStorageService.uploadGpxFile(localPath, safeName);
    
    if (!uploadSuccess) {
      console.warn('Failed to upload to cloud storage, but file is saved locally');
    }
    
    res.json({
      filename: safeName,
      path: `/api/strecken/download/${safeName}`,
      size: req.file.size,
      uploadedToCloud: uploadSuccess
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
    // Try to download from cloud storage
    console.log(`File not found locally, trying to download from cloud: ${filename}`);
    const downloadSuccess = await CloudStorageService.downloadGpxFile(filename, filePath);
    
    if (!downloadSuccess) {
      return res.status(404).json({ error: 'Datei nicht gefunden' });
    }
  }

  try {
    res.setHeader('Content-Type', 'application/gpx+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
    // Delete from local storage if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from cloud storage
    const cloudDeleteSuccess = await CloudStorageService.deleteGpxFile(filename);
    
    res.json({ 
      success: true, 
      deletedFromCloud: cloudDeleteSuccess 
    });
  } catch (error: any) {
    console.error('Error deleting GPX file:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
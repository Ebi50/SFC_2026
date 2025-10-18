import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../database';
import { CloudStorageService } from '../cloudStorage';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'home');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'pdf') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Nur PDF-Dateien sind erlaubt'));
      }
    } else if (file.fieldname === 'images') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Nur Bilddateien sind erlaubt'));
      }
    } else {
      cb(new Error('Unbekannter Dateityp'));
    }
  }
});

interface HomeContent {
  id: string;
  title: string;
  description: string;
  pdfFile?: string;
  images: string[];
  uploadDate: string;
}

// Initialize default content if it doesn't exist
const initDefaultContent = async () => {
  try {
    const existing = db.prepare('SELECT * FROM home_content WHERE id = ?').get('main');
    
    if (!existing) {
      const defaultContent: HomeContent = {
        id: 'main',
        title: 'Willkommen zum SKINFIT CUP',
        description: 'Der skinfit-cup ist ein offenes Vereinstraining mit Punktwertung, das durch den skinfit-shop in Stuttgart unterstützt wird! Sicherheit, Spaß und Fairness stehen im Vordergrund. Jeder der mind. 18 Jahre alt ist darf teilnehmen und wird gewertet. Egal ob Hobbyfahrer, Senior, Gast oder Elite-Amateur.\n\nDer Skinfit-cup ist für ambitionierte und leistungsorientierte Radsportler. Die Strecken und der Charakter der einzelnen Trainingsfahrten wird unterschiedlich gestaltet. Neben den Events auf einer 10km Runde gibt es außerdem Einzelzeitfahren, Mannschaftszeitfahren und Bergfahren.\n\nAm Jahresende gibt es Wanderpokale und Spitzenreitertrikots für den Gesamtsieger (GELBES Trikot) und die Sieger in den Kategorien Frauen und Hobby-/Jedermann (HOBBY-CUP). Außerdem Pokale, für die Plätze 2 & 3 der jeweiligen Klassen.',
        images: [],
        uploadDate: new Date().toISOString()
      };
      
      db.prepare(`
        INSERT INTO home_content (id, title, description, pdf_file, images, upload_date) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        defaultContent.id,
        defaultContent.title,
        defaultContent.description,
        defaultContent.pdfFile || null,
        JSON.stringify(defaultContent.images),
        defaultContent.uploadDate
      );
    }
  } catch (error) {
    console.error('Error initializing default content:', error);
  }
};

// Create table if it doesn't exist
const initTable = () => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS home_content (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        pdf_file TEXT,
        images TEXT DEFAULT '[]',
        upload_date TEXT NOT NULL
      )
    `);
    initDefaultContent();
  } catch (error) {
    console.error('Error creating home_content table:', error);
  }
};

// Initialize table on startup
initTable();

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session || !req.session.authenticated) {
    return res.status(401).json({ error: 'Authentifizierung erforderlich' });
  }
  next();
};

// Get home content
router.get('/content', (req, res) => {
  try {
    const content = db.prepare('SELECT * FROM home_content WHERE id = ?').get('main') as any;
    
    if (!content) {
      return res.status(404).json({ error: 'Inhalt nicht gefunden' });
    }
    
    const result: HomeContent = {
      id: content.id,
      title: content.title,
      description: content.description,
      pdfFile: content.pdf_file,
      images: JSON.parse(content.images || '[]'),
      uploadDate: content.upload_date
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error getting home content:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Inhalte' });
  }
});

// Update home content
router.post('/content', requireAuth, (req, res) => {
  try {
    const { title, description, pdfFile, images } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Titel und Beschreibung sind erforderlich' });
    }
    
    const uploadDate = new Date().toISOString();
    
    db.prepare(`
      INSERT OR REPLACE INTO home_content (id, title, description, pdf_file, images, upload_date) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'main',
      title,
      description,
      pdfFile || null,
      JSON.stringify(images || []),
      uploadDate
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating home content:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Inhalte' });
  }
});

// Upload PDF
router.post('/upload-pdf', requireAuth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine PDF-Datei hochgeladen' });
    }
    
    // Upload to cloud storage
    const cloudPath = `homepage/pdfs/${req.file.filename}`;
    
    try {
      await CloudStorageService.uploadFile(req.file.path, cloudPath);
      console.log(`PDF uploaded to cloud: ${cloudPath}`);
    } catch (cloudError) {
      console.warn('Cloud upload failed, using local storage:', cloudError);
    }
    
    res.json({ filename: req.file.filename });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ error: 'Fehler beim Hochladen der PDF' });
  }
});

// Upload images
router.post('/upload-images', requireAuth, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'Keine Bilder hochgeladen' });
    }
    
    const filenames: string[] = [];
    
    for (const file of req.files) {
      filenames.push(file.filename);
      
      // Upload to cloud storage
      const cloudPath = `Bilder/${file.filename}`;
      
      try {
        await CloudStorageService.uploadFile(file.path, cloudPath);
        console.log(`Image uploaded to cloud: ${cloudPath}`);
      } catch (cloudError) {
        console.warn('Cloud upload failed for image, using local storage:', cloudError);
      }
    }
    
    res.json({ filenames });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Fehler beim Hochladen der Bilder' });
  }
});

// Serve PDF files
router.get('/pdfs/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const localPath = path.join(uploadsDir, filename);
    const cloudPath = `homepage/pdfs/${filename}`;
    
    // Try cloud storage first
    try {
      const cloudData = await CloudStorageService.downloadFile(cloudPath);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`
      });
      res.send(cloudData);
      return;
    } catch (cloudError) {
      console.warn('Cloud download failed, trying local:', cloudError);
    }
    
    // Fallback to local file
    if (fs.existsSync(localPath)) {
      res.sendFile(localPath);
    } else {
      res.status(404).json({ error: 'PDF nicht gefunden' });
    }
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({ error: 'Fehler beim Laden der PDF' });
  }
});

// Serve image files
router.get('/images/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const localPath = path.join(uploadsDir, filename);
    const cloudPath = `Bilder/${filename}`;
    
    // Try cloud storage first
    try {
      const cloudData = await CloudStorageService.downloadFile(cloudPath);
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      
      res.set({
        'Content-Type': mimeTypes[ext] || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400' // Cache for 1 day
      });
      res.send(cloudData);
      return;
    } catch (cloudError) {
      console.warn('Cloud download failed, trying local:', cloudError);
    }
    
    // Fallback to local file
    if (fs.existsSync(localPath)) {
      res.sendFile(localPath);
    } else {
      res.status(404).json({ error: 'Bild nicht gefunden' });
    }
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Bildes' });
  }
});

// Delete image
router.delete('/images/:filename', requireAuth, async (req, res) => {
  try {
    const filename = req.params.filename;
    const localPath = path.join(uploadsDir, filename);
    const cloudPath = `Bilder/${filename}`;
    
    // Delete from cloud storage
    try {
      await CloudStorageService.deleteFile(cloudPath);
      console.log(`Image deleted from cloud: ${cloudPath}`);
    } catch (cloudError) {
      console.warn('Cloud deletion failed:', cloudError);
    }
    
    // Delete local file
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Bildes' });
  }
});

export default router;
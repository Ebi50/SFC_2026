import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../database';

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
        description: 'Der skinfit-cup ist ein offenes Vereinstraining mit Punktwertung.',
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

initTable();

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Admin-Berechtigung erforderlich' });
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
    const imagesJson = JSON.stringify(images || []);

    db.prepare(`
      INSERT OR REPLACE INTO home_content (id, title, description, pdf_file, images, upload_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('main', title, description, pdfFile || null, imagesJson, uploadDate);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating home content:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Inhalte: ' + (error as Error).message });
  }
});

// Upload PDF
router.post('/upload-pdf', requireAuth, upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine PDF-Datei hochgeladen' });
    }
    res.json({ filename: req.file.filename });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ error: 'Fehler beim Hochladen der PDF' });
  }
});

// Upload images
router.post('/upload-images', requireAuth, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'Keine Bilder hochgeladen' });
    }

    const filenames = req.files.map((file: any) => file.filename);
    res.json({ filenames });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Fehler beim Hochladen der Bilder' });
  }
});

// Serve PDF files
router.get('/pdfs/:filename', (req, res) => {
  const localPath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(localPath)) {
    res.sendFile(localPath);
  } else {
    res.status(404).json({ error: 'PDF nicht gefunden' });
  }
});

// Serve image files
router.get('/images/:filename', (req, res) => {
  const localPath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(localPath)) {
    const ext = path.extname(req.params.filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp'
    };
    res.set({
      'Content-Type': mimeTypes[ext] || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400'
    });
    res.sendFile(localPath);
  } else {
    res.status(404).json({ error: 'Bild nicht gefunden' });
  }
});

// Delete image
router.delete('/images/:filename', requireAuth, (req, res) => {
  try {
    const localPath = path.join(uploadsDir, req.params.filename);
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

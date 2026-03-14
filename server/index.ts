import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routers
import participantsRouter from './routes/participants';
import eventsRouter from './routes/events';
import authRouter from './routes/auth';
import reglementRouter from './routes/reglement';
import settingsRouter from './routes/settings';
import streckenRouter from './routes/strecken';
import seasonsRouter from './routes/seasons';
import homeRouter from './routes/home';
import userAuthRouter from './routes/userAuth';

// Initialize database
import { initDatabase, db } from './database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Initialize Express
const app = express();
const PORT = parseInt(process.env.PORT || '') || 3001;

// Detect platform
const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
const isCloudRun = !!process.env.K_SERVICE; // Cloud Run sets K_SERVICE automatically

// CORS configuration
const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:5001',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://127.0.0.1:5000',
  'https://127.0.0.1:5001',
  'https://skinfitcup-238077235347.europe-west1.run.app',
  'https://sfc-rsv.de',
  'https://www.sfc-rsv.de',
  ...(process.env.RAILWAY_PUBLIC_DOMAIN ? [`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`] : []),
  ...(process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',').map(d => `https://${d}`) : [])
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For production, allow any https origin from known platforms
    if (process.env.NODE_ENV === 'production') {
      if (origin.includes('run.app') || origin.includes('sfc-rsv.de') || origin.includes('railway.app')) {
        return callback(null, true);
      }
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Middleware
app.use(express.json());
app.set('trust proxy', 1);

// Session configuration
const SESSION_SECRET = process.env.SESSION_SECRET || 'skinfit-cup-dev-secret-2025-stable';
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  proxy: true,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  },
  name: 'skinfit.sid'
}));

// Async initialization function
async function startServer() {
  try {
    if (isProduction && isCloudRun) {
      // ===== Google Cloud Run: needs Cloud Storage sync =====
      console.log('☁️  Cloud Run mode: Initializing with cloud storage');
      
      const { CloudStorageService } = await import('./cloudStorage');
      await CloudStorageService.ensureBucketExists();
      
      const dbPath = '/tmp/database.sqlite3';
      const downloaded = await CloudStorageService.downloadDatabase(dbPath);
      
      console.log('📊 Initializing database...');
      initDatabase();
      console.log('✅ Database initialized successfully');

      if (!downloaded) {
        console.log('📝 No cloud database found, creating initial test data...');
        const { createTestData } = await import('./createTestData');
        await createTestData();
        console.log('✅ Test data created successfully');
        await CloudStorageService.uploadDatabase(dbPath);
      }
      
      CloudStorageService.startPeriodicSync(dbPath, 2);

    } else if (isProduction && isRailway) {
      // ===== Railway: persistent volume, no sync needed =====
      console.log('🚂 Railway mode: Using persistent volume at /data');
      console.log('📊 Initializing database...');
      initDatabase();
      console.log('✅ Database initialized successfully');

    } else {
      // ===== Development =====
      console.log('🔧 Development mode: Using local database');
      console.log('📊 Initializing database...');
      initDatabase();
      console.log('✅ Database initialized successfully');
    }

    // Static files
    app.use('/gpx', express.static(path.join(__dirname, '..', 'public', 'gpx')));
    app.use('/reglement', express.static(path.join(__dirname, '..', 'public', 'reglement')));

    // API routes
    app.use('/api/auth', authRouter);
    app.use('/api/participants', participantsRouter);
    app.use('/api/events', eventsRouter);
    app.use('/api/reglement', reglementRouter);
    app.use('/api/settings', settingsRouter);
    app.use('/api/strecken', streckenRouter);
    app.use('/api/seasons', seasonsRouter);
    app.use('/api/home', homeRouter);
    app.use('/api/user', userAuthRouter);

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        platform: isRailway ? 'railway' : isCloudRun ? 'cloudrun' : 'local',
        timestamp: new Date().toISOString() 
      });
    });

    // Manual database sync endpoint (admin only, Cloud Run only)
    app.post('/api/sync', async (req, res) => {
      if (!req.session?.isAdmin) {
        return res.status(403).json({ error: 'Keine Berechtigung' });
      }
      
      if (isCloudRun) {
        try {
          const { CloudStorageService } = await import('./cloudStorage');
          const success = await CloudStorageService.syncNow('/tmp/database.sqlite3');
          res.json({ 
            success, 
            message: success ? 'Database synced to cloud' : 'Sync failed',
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      } else if (isRailway) {
        res.json({ message: 'Railway uses persistent volume – no sync needed' });
      } else {
        res.json({ message: 'Sync not available in development mode' });
      }
    });

    // Production: serve built frontend
    if (isProduction) {
      const distPath = path.join(__dirname, '..', 'dist');
      app.use(express.static(distPath));
      
      app.use((req, res) => {
        if (req.path.startsWith('/api/')) {
          return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 CORS enabled for origins: ${allowedOrigins.join(', ')}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏗️  Platform: ${isRailway ? 'Railway' : isCloudRun ? 'Cloud Run' : 'Local'}`);
      console.log(`🔐 Session Secret configured: ${SESSION_SECRET ? 'Yes' : 'No'}`);
      
      try {
        const testQuery = db.prepare('SELECT COUNT(*) as count FROM participants').get() as { count: number };
        console.log(`📊 Database connected: ${testQuery.count} participants found`);
      } catch (error) {
        console.error('❌ Database connection test failed:', error);
      }
      
      if (process.env.GCS_BUCKET_NAME) {
        console.log(`☁️  Cloud Storage Bucket: ${process.env.GCS_BUCKET_NAME}`);
      }
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        console.log(`🚂 Railway URL: https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

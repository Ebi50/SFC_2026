import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database';
import participantsRouter from './routes/participants';
import eventsRouter from './routes/events';
import authRouter from './routes/auth';
import reglementRouter from './routes/reglement';
import settingsRouter from './routes/settings';
import streckenRouter from './routes/strecken';
import seasonsRouter from './routes/seasons';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.NODE_ENV === 'production' ? 5000 : 3001;

const allowedOrigins = [
  'http://localhost:5000',
  'https://127.0.0.1:5000',
  ...(process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',').map(d => `https://${d}`) : [])
];

// CORS mit vollem Preflight-Support
app.use(cors({
  origin: true, // In Dev: Alle Origins erlauben
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24h Preflight-Cache
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Trust Replit's proxy for correct session/cookie handling
app.set('trust proxy', 1);

// NOTE: Using default MemoryStore for sessions
// For production Autoscale deployments with multiple instances, consider using
// a persistent session store like connect-pg-simple with PostgreSQL
const SESSION_SECRET = process.env.SESSION_SECRET || 'skinfit-cup-dev-secret-2025-stable';

// Session-Konfiguration für Production (HTTPS) und Development (HTTP)
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,  // Cookie bei jedem Request erneuern
  proxy: true,    // Trust X-Forwarded-Proto vom Replit-Proxy
  cookie: {
    secure: isProduction,  // true für HTTPS (Production), false für HTTP (Dev)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',  // Lax für Same-Origin Requests
    path: '/',  // Explicitly set path
  },
  name: 'skinfit.sid'
}));

initDatabase();

// Serve static GPX files
app.use('/gpx', express.static(path.join(__dirname, '..', 'public', 'gpx')));
// Serve static reglement PDF
app.use('/reglement', express.static(path.join(__dirname, '..', 'public', 'reglement')));

app.use('/api/auth', authRouter);
app.use('/api/participants', participantsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/reglement', reglementRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/strecken', streckenRouter);
app.use('/api/seasons', seasonsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  
  // NO-CACHE für HTML/JS/CSS um Service Worker Probleme zu vermeiden
  app.use((req, res, next) => {
    if (req.path.endsWith('.html') || req.path.endsWith('.js') || req.path.endsWith('.css') || req.path === '/') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });
  
  app.use(express.static(distPath));
  
  // Catch-all handler for SPA - serves index.html for all non-API routes
  app.use((req, res, next) => {
    // NEVER intercept API requests
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

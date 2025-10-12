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

// Initialize database
import { initDatabase } from './database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Initialize Express
const app = express();
const PORT = parseInt(process.env.PORT || '') || 3001;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://127.0.0.1:5000',
  ...(process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',').map(d => `https://${d}`) : [])
];

app.use(cors({
  origin: true,
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
    sameSite: 'lax',
    path: '/'
  },
  name: 'skinfit.sid'
}));

// Initialize database
initDatabase();

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Production setup
if (process.env.NODE_ENV === 'production') {
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
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
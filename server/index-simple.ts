import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routers
import participantsRouter from './routes/participants.js';
import eventsRouter from './routes/events.js';
import authRouter from './routes/auth.js';
import reglementRouter from './routes/reglement.js';
import settingsRouter from './routes/settings.js';
import streckenRouter from './routes/strecken.js';
import seasonsRouter from './routes/seasons.js';

// Initialize database
import { initDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Initialize Express
const app = express();
const PORT = parseInt(process.env.PORT || '') || 3001;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:5001',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://127.0.0.1:5000',
  'https://127.0.0.1:5001',
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
app.use(session({
  secret: process.env.SESSION_SECRET || 'skinfit-cup-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  },
  name: 'skinfit.sid'
}));

// Async initialization function
async function startServer() {
  try {
    console.log('🔄 Initializing database...');
    
    // Initialize database (create tables if needed)
    initDatabase();
    
    console.log('✅ Database initialized');

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
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 CORS enabled for origins: ${allowedOrigins.join(', ')}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Add error handling
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    });

    console.log('🎯 Server ready for connections!');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
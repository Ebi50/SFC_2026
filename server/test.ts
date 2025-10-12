import express from 'express';
import { db } from './database';

const app = express();
const PORT = 3001;

// Enable CORS
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Seasons endpoint
app.get('/api/seasons', (req, res) => {
  try {
    const seasons = db.prepare('SELECT * FROM seasons ORDER BY year DESC').all();
    res.json({ seasons });
  } catch (error) {
    console.error('Error fetching seasons:', error);
    res.status(500).json({ error: 'Failed to fetch seasons' });
  }
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
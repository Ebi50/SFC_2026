import express from 'express';
import cors from 'cors';
const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors());

// Import Database
import sqlite from 'better-sqlite3';
import path from 'path';
const dbPath = path.join(process.cwd(), '..', 'database.sqlite3');
console.log('Connecting to database at:', dbPath);
const db = new sqlite(dbPath);

// Debug endpoint to list tables
app.get('/api/debug/tables', (req, res) => {
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    res.json({ tables: tables.map(t => t.name) });
  } catch (error: any) {
    console.error('Error getting tables:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to show table schema
app.get('/api/debug/schema/:table', (req, res) => {
  try {
    const { table } = req.params;
    const schema = db.prepare(`PRAGMA table_info(${table})`).all();
    res.json({ schema });
  } catch (error: any) {
    console.error('Error getting schema:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to show sample data
app.get('/api/debug/data/:table', (req, res) => {
  try {
    const { table } = req.params;
    const data = db.prepare(`SELECT * FROM ${table} LIMIT 10`).all();
    res.json({ data });
  } catch (error: any) {
    console.error('Error getting data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Debug server running on http://localhost:${PORT}`);
});
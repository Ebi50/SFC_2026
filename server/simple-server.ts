import express from 'express';
const app = express();
const PORT = 3001;

app.get('/debug', (req, res) => {
  console.log('Debug endpoint called');
  res.json({ message: 'Debug endpoint is working!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
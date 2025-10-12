import express from 'express';

const app = express();
const port = 3001;

app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint is working!' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
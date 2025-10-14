import express from 'express';
import cors from 'cors';

console.log('🚀 Starting minimal test server...');

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:5001'],
  credentials: true
}));

app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.get('/api/settings', (req, res) => {
  res.json({ 
    message: 'Settings endpoint working',
    timeTrialBonuses: {
      aeroBars: { enabled: true, seconds: 30 },
      ttEquipment: { enabled: true, seconds: 30 }
    },
    winnerPoints: [3, 2, 1]
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log('📋 Test endpoint: http://localhost:3001/api/test');
  console.log('📋 Settings endpoint: http://localhost:3001/api/settings');
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

console.log('🔄 Server setup complete, waiting for connections...');
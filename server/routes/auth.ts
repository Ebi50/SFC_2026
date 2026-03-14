import express from 'express';

const router = express.Router();

declare module 'express-session' {
  interface SessionData {
    isAdmin: boolean;
    userId?: string;
    participantId?: string;
  }
}

router.post('/login', (req, res) => {
  console.log('🔐 LOGIN REQUEST RECEIVED');
  console.log('Password received:', !!req.body?.password);
  
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'Rgjzdvlim32/';
  
  if (password === adminPassword) {
    req.session.isAdmin = true;
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.status(500).json({ success: false, message: 'Session-Fehler' });
      }
      console.log('✅ LOGIN SUCCESS - Session ID:', req.sessionID);
      res.json({ success: true, isAdmin: true });
    });
  } else {
    console.log('❌ Wrong password');
    res.status(401).json({ success: false, message: 'Falsches Passwort' });
  }
});

router.post('/logout', (req, res) => {
  req.session.isAdmin = false;
  res.json({ success: true });
});

router.get('/status', (req, res) => {
  res.json({
    isAdmin: req.session.isAdmin || false,
    userId: req.session.userId || null,
    participantId: req.session.participantId || null,
  });
});

export default router;

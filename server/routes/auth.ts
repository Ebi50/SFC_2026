import express from 'express';

const router = express.Router();

declare module 'express-session' {
  interface SessionData {
    isAdmin: boolean;
    userId?: string;
    participantId?: string;
  }
}

router.get('/status', (req, res) => {
  // Admin status is only valid when paired with a logged-in user.
  // A lingering isAdmin flag without a userId means a stale/legacy session — drop it.
  if (req.session.isAdmin && !req.session.userId) {
    req.session.isAdmin = false;
  }

  res.json({
    isAdmin: req.session.isAdmin || false,
    userId: req.session.userId || null,
    participantId: req.session.participantId || null,
  });
});

export default router;

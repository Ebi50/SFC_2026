import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database';

const router = express.Router();

// POST /api/user/register
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, phone, birthYear, gender, perfClass, isRsvMember } = req.body;

  // Validate required fields
  if (!email || !password || !firstName || !lastName || !birthYear || !gender || !perfClass) {
    return res.status(400).json({ error: 'Alle Pflichtfelder müssen ausgefüllt werden.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
  }

  // Check if email already exists in users table
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase()) as any;
  if (existingUser) {
    return res.status(409).json({ error: 'Ein Konto mit dieser E-Mail-Adresse existiert bereits.' });
  }

  try {
    // Duplicate detection: check for existing participant with same name + birthYear
    const existingParticipant = db.prepare(
      'SELECT id FROM participants WHERE LOWER(firstName) = LOWER(?) AND LOWER(lastName) = LOWER(?) AND birthYear = ?'
    ).get(firstName.trim(), lastName.trim(), birthYear) as any;

    let participantId: string;

    if (existingParticipant) {
      // Check if another user account is already linked to this participant
      const linkedUser = db.prepare('SELECT id FROM users WHERE participantId = ?').get(existingParticipant.id) as any;
      if (linkedUser) {
        return res.status(409).json({
          error: 'Für diesen Teilnehmer existiert bereits ein Konto. Bitte melden Sie sich an.'
        });
      }

      // Link to existing participant and update their email
      participantId = existingParticipant.id;
      db.prepare('UPDATE participants SET email = ?, phone = ?, perfClass = ?, gender = ?, isRsvMember = ? WHERE id = ?')
        .run(email.trim().toLowerCase(), phone?.trim() || null, perfClass, gender, isRsvMember ? 1 : 0, participantId);
    } else {
      // Create new participant
      participantId = 'p' + Date.now() + Math.random().toString(36).substring(2, 15);
      db.prepare(
        'INSERT INTO participants (id, firstName, lastName, email, phone, birthYear, perfClass, gender, isRsvMember) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(participantId, firstName.trim(), lastName.trim(), email.trim().toLowerCase(), phone?.trim() || null, birthYear, perfClass, gender, isRsvMember ? 1 : 0);
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'u' + Date.now() + Math.random().toString(36).substring(2, 15);

    db.prepare('INSERT INTO users (id, email, passwordHash, participantId) VALUES (?, ?, ?, ?)')
      .run(userId, email.trim().toLowerCase(), passwordHash, participantId);

    // Set session
    req.session.userId = userId;
    req.session.participantId = participantId;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session-Fehler' });
      }
      res.status(201).json({
        success: true,
        user: { id: userId, email: email.trim().toLowerCase(), participantId }
      });
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Fehler bei der Registrierung.' });
  }
});

// POST /api/user/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase()) as any;
    if (!user) {
      return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch.' });
    }

    req.session.userId = user.id;
    req.session.participantId = user.participantId;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session-Fehler' });
      }
      res.json({
        success: true,
        user: { id: user.id, email: user.email, participantId: user.participantId }
      });
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Fehler beim Anmelden.' });
  }
});

// POST /api/user/logout
router.post('/logout', (req, res) => {
  req.session.userId = undefined;
  req.session.participantId = undefined;
  res.json({ success: true });
});

// GET /api/user/status
router.get('/status', (req, res) => {
  if (req.session.userId) {
    const user = db.prepare('SELECT id, email, participantId FROM users WHERE id = ?').get(req.session.userId) as any;
    if (user) {
      return res.json({
        isLoggedIn: true,
        user: { id: user.id, email: user.email, participantId: user.participantId }
      });
    }
  }
  res.json({ isLoggedIn: false, user: null });
});

// GET /api/user/profile
router.get('/profile', (req, res) => {
  if (!req.session.userId || !req.session.participantId) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }

  const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(req.session.participantId) as any;
  if (!participant) {
    return res.status(404).json({ error: 'Teilnehmer nicht gefunden.' });
  }

  res.json(participant);
});

// GET /api/user/registrations
router.get('/registrations', (req, res) => {
  if (!req.session.userId || !req.session.participantId) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }

  const registrations = db.prepare(
    'SELECT eventId FROM event_registrations WHERE participantId = ?'
  ).all(req.session.participantId) as any[];

  res.json({ eventIds: registrations.map(r => r.eventId) });
});

export default router;

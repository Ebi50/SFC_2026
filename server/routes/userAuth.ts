import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../database';
import { sendPasswordResetEmail, isEmailConfigured } from '../services/emailService';

const router = express.Router();

// POST /api/user/register
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, phone, birthYear, gender, perfClass, isRsvMember, waiverAccepted, fotoConsent } = req.body;

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
      db.prepare('UPDATE participants SET email = ?, phone = ?, perfClass = ?, gender = ?, isRsvMember = ?, waiverAccepted = ?, waiverAcceptedAt = ?, fotoConsent = ?, fotoConsentAt = ? WHERE id = ?')
        .run(email.trim().toLowerCase(), phone?.trim() || null, perfClass, gender, isRsvMember ? 1 : 0, waiverAccepted ? 1 : 0, waiverAccepted ? new Date().toISOString() : null, fotoConsent ? 1 : 0, fotoConsent ? new Date().toISOString() : null, participantId);
    } else {
      // Create new participant
      participantId = 'p' + Date.now() + Math.random().toString(36).substring(2, 15);
      db.prepare(
        'INSERT INTO participants (id, firstName, lastName, email, phone, birthYear, perfClass, gender, isRsvMember, waiverAccepted, waiverAcceptedAt, fotoConsent, fotoConsentAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(participantId, firstName.trim(), lastName.trim(), email.trim().toLowerCase(), phone?.trim() || null, birthYear, perfClass, gender, isRsvMember ? 1 : 0, waiverAccepted ? 1 : 0, waiverAccepted ? new Date().toISOString() : null, fotoConsent ? 1 : 0, fotoConsent ? new Date().toISOString() : null);
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'u' + Date.now() + Math.random().toString(36).substring(2, 15);

    db.prepare('INSERT INTO users (id, email, passwordHash, participantId) VALUES (?, ?, ?, ?)')
      .run(userId, email.trim().toLowerCase(), passwordHash, participantId);

    // Set session - explicitly clear any leftover admin status
    req.session.userId = userId;
    req.session.participantId = participantId;
    req.session.isAdmin = false;
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
    req.session.isAdmin = false; // Clear any leftover admin status from previous sessions
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

// POST /api/user/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'E-Mail-Adresse ist erforderlich.' });
  }

  if (!isEmailConfigured()) {
    return res.status(503).json({ error: 'E-Mail-Service ist nicht konfiguriert. Bitte wende dich an den Administrator.' });
  }

  try {
    // Always return success to prevent email enumeration
    const user = db.prepare('SELECT u.id, p.firstName FROM users u JOIN participants p ON u.participantId = p.id WHERE u.email = ?')
      .get(email.trim().toLowerCase()) as any;

    if (user) {
      // Invalidate old tokens for this user
      db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE userId = ? AND used = 0').run(user.id);

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
      const id = 'rt_' + Date.now() + crypto.randomBytes(4).toString('hex');

      db.prepare('INSERT INTO password_reset_tokens (id, userId, token, expiresAt) VALUES (?, ?, ?, ?)')
        .run(id, user.id, token, expiresAt);

      await sendPasswordResetEmail(email.trim().toLowerCase(), token, user.firstName);
    }

    // Always respond with success (security: don't reveal if email exists)
    res.json({ success: true, message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Fehler beim Senden der E-Mail.' });
  }
});

// POST /api/user/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token und neues Passwort sind erforderlich.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
  }

  try {
    const resetToken = db.prepare(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expiresAt > ?'
    ).get(token, new Date().toISOString()) as any;

    if (!resetToken) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Reset-Link. Bitte fordere einen neuen an.' });
    }

    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(passwordHash, resetToken.userId);

    // Mark token as used
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(resetToken.id);

    res.json({ success: true, message: 'Passwort erfolgreich zurückgesetzt. Du kannst dich jetzt anmelden.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Fehler beim Zurücksetzen des Passworts.' });
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

// PUT /api/user/password
router.put('/password', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Aktuelles und neues Passwort sind erforderlich.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId) as any;
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Das aktuelle Passwort ist falsch.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(newHash, req.session.userId);

    res.json({ success: true, message: 'Passwort erfolgreich geändert.' });
  } catch (error: any) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Fehler beim Ändern des Passworts.' });
  }
});

// PUT /api/user/profile
router.put('/profile', (req, res) => {
  if (!req.session.userId || !req.session.participantId) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }

  const { firstName, lastName, phone, birthYear, gender, perfClass, isRsvMember } = req.body;

  if (!firstName || !lastName || !birthYear || !gender || !perfClass) {
    return res.status(400).json({ error: 'Alle Pflichtfelder müssen ausgefüllt werden.' });
  }

  try {
    db.prepare(
      'UPDATE participants SET firstName = ?, lastName = ?, phone = ?, birthYear = ?, gender = ?, perfClass = ?, isRsvMember = ? WHERE id = ?'
    ).run(firstName.trim(), lastName.trim(), phone?.trim() || null, birthYear, gender, perfClass, isRsvMember ? 1 : 0, req.session.participantId);

    const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(req.session.participantId) as any;
    res.json({ success: true, participant });
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Profils.' });
  }
});

// POST /api/user/accept-waiver
router.post('/accept-waiver', (req, res) => {
  if (!req.session.userId || !req.session.participantId) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }

  try {
    db.prepare('UPDATE participants SET waiverAccepted = 1, waiverAcceptedAt = ? WHERE id = ?')
      .run(new Date().toISOString(), req.session.participantId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/user/foto-consent — Foto-Einwilligung erteilen
router.post('/foto-consent', (req, res) => {
  if (!req.session.userId || !req.session.participantId) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }

  try {
    db.prepare('UPDATE participants SET fotoConsent = 1, fotoConsentAt = ? WHERE id = ?')
      .run(new Date().toISOString(), req.session.participantId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/user/foto-consent — Foto-Einwilligung widerrufen
router.delete('/foto-consent', (req, res) => {
  if (!req.session.userId || !req.session.participantId) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }

  try {
    db.prepare('UPDATE participants SET fotoConsent = 0, fotoConsentAt = NULL WHERE id = ?')
      .run(req.session.participantId);
    res.json({ success: true, message: 'Foto-Einwilligung widerrufen.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/user/account - Konto löschen (DSGVO), Ergebnisse bleiben anonymisiert
router.delete('/account', async (req, res) => {
  if (!req.session.userId || !req.session.participantId) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }

  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Passwort zur Bestätigung erforderlich.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId) as any;
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Passwort ist falsch.' });
    }

    const participantId = req.session.participantId;

    // Delete personal contact data but keep name for results display
    db.prepare(`
      UPDATE participants
      SET email = NULL, phone = NULL, address = NULL, city = NULL, postalCode = NULL
      WHERE id = ?
    `).run(participantId);

    // Delete user account
    db.prepare('DELETE FROM users WHERE id = ?').run(req.session.userId);

    // Delete event registrations (future events)
    db.prepare('DELETE FROM event_registrations WHERE participantId = ?').run(participantId);

    // Clear session
    req.session.userId = undefined;
    req.session.participantId = undefined;

    res.json({ success: true, message: 'Konto wurde gelöscht. Deine Ergebnisse bleiben anonymisiert erhalten.' });
  } catch (error: any) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Kontos.' });
  }
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

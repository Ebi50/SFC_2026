import express from 'express';
import { db } from '../database';
import { sendBulkEmail, isEmailConfigured } from '../services/emailService';

const router = express.Router();

// All admin routes require admin session
router.use((req, res, next) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }
  next();
});

// POST /api/admin/bulk-email - Send BCC email to all participants
router.post('/bulk-email', async (req, res) => {
  const { subject, message } = req.body;

  if (!subject?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Betreff und Nachricht sind erforderlich' });
  }

  if (!isEmailConfigured()) {
    return res.status(503).json({ error: 'Email-Service ist nicht konfiguriert (SMTP-Einstellungen fehlen)' });
  }

  try {
    const participants: any[] = db.prepare(
      `SELECT email, firstName FROM participants WHERE email IS NOT NULL AND email != ''`
    ).all();

    const emails = participants.map(p => p.email).filter(Boolean);

    if (emails.length === 0) {
      return res.status(400).json({ error: 'Keine Teilnehmer mit E-Mail-Adresse gefunden' });
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">SkinfitCup</h1>
        </div>
        <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          ${message.replace(/\n/g, '<br>')}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            SkinfitCup – RSV Stuttgart-Vaihingen<br>
            <a href="https://www.sfc-rsv.de" style="color: #dc2626;">www.sfc-rsv.de</a>
          </p>
        </div>
      </div>
    `;

    const result = await sendBulkEmail(emails, subject, htmlBody);
    res.json({ success: true, emailsSent: result.count });
  } catch (error: any) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/gdpr-status - GDPR consent overview
router.get('/gdpr-status', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN dataConsent = 1 THEN 1 ELSE 0 END) as withConsent,
        SUM(CASE WHEN dataConsent = 0 THEN 1 ELSE 0 END) as withoutConsent,
        SUM(CASE WHEN dataConsent = 0 AND email IS NOT NULL AND email != '' THEN 1 ELSE 0 END) as withoutConsentWithEmail
      FROM participants
    `).get() as any;

    const participantsWithoutConsent: any[] = db.prepare(`
      SELECT id, firstName, lastName, email, phone, birthYear, perfClass, gender, dataConsent, dataConsentAt
      FROM participants
      WHERE dataConsent = 0
      ORDER BY lastName, firstName
    `).all();

    res.json({
      stats,
      participantsWithoutConsent,
      deadline: '2026-05-31'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/gdpr-send-consent-request - Send consent request email to participants without consent
router.post('/gdpr-send-consent-request', async (req, res) => {
  if (!isEmailConfigured()) {
    return res.status(503).json({ error: 'Email-Service ist nicht konfiguriert' });
  }

  try {
    const participants: any[] = db.prepare(
      `SELECT email FROM participants WHERE dataConsent = 0 AND email IS NOT NULL AND email != ''`
    ).all();

    const emails = participants.map(p => p.email).filter(Boolean);

    if (emails.length === 0) {
      return res.status(400).json({ error: 'Keine Teilnehmer ohne Einwilligung mit E-Mail-Adresse gefunden' });
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">SkinfitCup</h1>
        </div>
        <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hallo,</p>
          <p>Du hast in der Vergangenheit am <strong>SkinfitCup</strong> des RSV Stuttgart-Vaihingen teilgenommen.
          Wir würden uns freuen, dich auch in dieser Saison wieder dabei zu haben!</p>
          <p>Aufgrund der <strong>Datenschutz-Grundverordnung (DSGVO)</strong> benötigen wir deine Einwilligung zur
          Speicherung deiner Kontaktdaten (E-Mail, Telefon, Adresse).</p>
          <p><strong>Bitte registriere dich bis zum 31.05.2026</strong> auf unserer Website, um deine Daten zu bestätigen
          und weiterhin Informationen zum SkinfitCup zu erhalten:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.sfc-rsv.de" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Jetzt registrieren
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Deine bisherigen Ergebnisse bleiben in jedem Fall erhalten.
          Nach dem 31.05.2026 werden jedoch deine Kontaktdaten (E-Mail, Telefon, Adresse) gelöscht,
          falls keine Registrierung erfolgt ist.</p>
          <p style="color: #6b7280; font-size: 14px;">Dein Name bleibt weiterhin in den Ergebnislisten sichtbar.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            SkinfitCup – RSV Stuttgart-Vaihingen<br>
            <a href="https://www.sfc-rsv.de" style="color: #dc2626;">www.sfc-rsv.de</a>
          </p>
        </div>
      </div>
    `;

    const result = await sendBulkEmail(
      emails,
      'SkinfitCup – Einwilligung zur Datenspeicherung erforderlich',
      htmlBody
    );

    res.json({ success: true, emailsSent: result.count });
  } catch (error: any) {
    console.error('Error sending GDPR consent request:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/gdpr-anonymize - Manually anonymize participants without consent
router.post('/gdpr-anonymize', (req, res) => {
  try {
    const result = db.prepare(`
      UPDATE participants
      SET email = NULL, phone = NULL, address = NULL, city = NULL, postalCode = NULL
      WHERE dataConsent = 0
        AND (email IS NOT NULL OR phone IS NOT NULL OR address IS NOT NULL OR city IS NOT NULL OR postalCode IS NOT NULL)
    `).run();

    res.json({ success: true, anonymized: result.changes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

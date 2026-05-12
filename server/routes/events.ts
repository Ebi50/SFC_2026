import express from 'express';
import { db } from '../database';
import { sendBulkEmail, isEmailConfigured } from '../services/emailService';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const events = db.prepare('SELECT * FROM events ORDER BY date DESC').all();
    const results = db.prepare('SELECT * FROM results').all();
    const teams = db.prepare('SELECT * FROM teams').all();
    const teamMembers = db.prepare('SELECT * FROM team_members').all();
    
    res.json({
      events,
      results,
      teams,
      teamMembers
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/results', (req, res) => {
  try {
    const results = db.prepare('SELECT * FROM results WHERE eventId = ?').all(req.params.id);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/teams', (req, res) => {
  try {
    const teams = db.prepare('SELECT * FROM teams WHERE eventId = ?').all(req.params.id);
    const teamIds = teams.map((t: any) => t.id);
    
    let teamMembers: any[] = [];
    if (teamIds.length > 0) {
      const placeholders = teamIds.map(() => '?').join(',');
      teamMembers = db.prepare(`SELECT * FROM team_members WHERE teamId IN (${placeholders})`).all(...teamIds);
    }
    
    res.json({ teams, teamMembers });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  const event = req.body;
  
  // DEBUG: Log incoming event data
  console.log('📝 CREATE EVENT REQUEST:');
  console.log('Event data:', JSON.stringify(event, null, 2));
  console.log('Season value:', event.season, 'Type:', typeof event.season);
  
  try {
    // Validate season is provided
    if (event.season === null || event.season === undefined || event.season === '') {
      console.log('❌ Season validation failed - season is:', event.season);
      return res.status(400).json({ error: 'Season ist erforderlich. Bitte wählen Sie eine Saison aus.' });
    }

    // Validate that the season actually exists in the database
    const seasonExists = db.prepare('SELECT year FROM seasons WHERE year = ?').get(event.season);
    if (!seasonExists) {
      console.log('❌ Season does not exist:', event.season);
      return res.status(400).json({ error: `Saison ${event.season} existiert nicht. Bitte erstellen Sie zuerst die Saison.` });
    }
    
    console.log('✅ Season validation passed for:', event.season);
    
    // ALWAYS generate unique ID server-side to prevent UNIQUE constraint errors
    // Ignore any ID sent from frontend to avoid collisions
    const newId = 'e' + Date.now() + Math.random().toString(36).substring(2, 15);
    
    const stmt = db.prepare(`
      INSERT INTO events (id, name, date, location, eventType, notes, report, finished, season, timeVereinsheim, timeStrecke)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(newId, event.name, event.date, event.location, event.eventType, event.notes || null, event.report || null, event.finished ? 1 : 0, event.season, event.timeVereinsheim || null, event.timeStrecke || null);
    
    console.log('✅ Event created successfully with ID:', newId);
    const createdEvent = { ...event, id: newId };
    res.status(201).json(createdEvent);
  } catch (error: any) {
    console.log('❌ Error creating event:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  const event = req.body;
  
  try {
    // Validate season is provided
    if (event.season === null || event.season === undefined || event.season === '') {
      console.log('❌ Season validation failed - season is:', event.season);
      return res.status(400).json({ error: 'Season ist erforderlich. Bitte wählen Sie eine Saison aus.' });
    }

    // Validate that the season actually exists in the database
    const seasonExists = db.prepare('SELECT year FROM seasons WHERE year = ?').get(event.season);
    if (!seasonExists) {
      console.log('❌ Season does not exist:', event.season);
      return res.status(400).json({ error: `Saison ${event.season} existiert nicht. Bitte erstellen Sie zuerst die Saison.` });
    }

    const stmt = db.prepare(`
      UPDATE events
      SET name = ?, date = ?, location = ?, eventType = ?, notes = ?, report = ?, finished = ?, season = ?, timeVereinsheim = ?, timeStrecke = ?
      WHERE id = ?
    `);

    stmt.run(event.name, event.date, event.location, event.eventType, event.notes || null, event.report || null, event.finished ? 1 : 0, event.season, event.timeVereinsheim || null, event.timeStrecke || null, req.params.id);
    
    res.json(event);
  } catch (error: any) {
    console.log('❌ Error updating event:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  try {
    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/results', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  const results = req.body;
  
  try {
    db.prepare('DELETE FROM results WHERE eventId = ?').run(req.params.id);

    // Lookup current perfClass for each participant to freeze it with the result
    const getParticipant = db.prepare('SELECT perfClass FROM participants WHERE id = ?');

    const insert = db.prepare(`
      INSERT INTO results (id, eventId, participantId, placement, time, timeSeconds, points, winnerRank, dnf, hasAeroBars, hasTTEquipment, finisherGroup, rankOverall, perfClass)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((results) => {
      for (const r of results) {
        const participant = getParticipant.get(r.participantId) as any;
        insert.run(
          r.id,
          r.eventId,
          r.participantId,
          r.placement || null,
          r.time || null,
          r.timeSeconds || null,
          r.points || 0,
          r.winnerRank || null,
          r.dnf ? 1 : 0,
          r.hasAeroBars ? 1 : 0,
          r.hasTTEquipment ? 1 : 0,
          r.finisherGroup !== undefined && r.finisherGroup !== null ? r.finisherGroup : null,
          r.rankOverall !== undefined && r.rankOverall !== null ? r.rankOverall : null,
          r.perfClass || participant?.perfClass || null
        );
      }
    });

    insertMany(results);

    // Die Ergebnis-Liste ist die Wahrheit darüber, wer teilgenommen hat:
    // Anmeldungen von Teilnehmern, die der Admin aus der Liste entfernt hat,
    // löschen – sonst fügt das Auto-Einfügen im Bearbeiten-Dialog sie beim
    // nächsten Öffnen wieder ein. Guard: eine leere Liste löscht NICHT alle
    // Anmeldungen (könnte ein fehlgeschlagener Frontend-Ladevorgang sein).
    const participantIds = (results as any[]).map(r => r.participantId).filter(Boolean);
    if (participantIds.length > 0) {
      const placeholders = participantIds.map(() => '?').join(',');
      db.prepare(
        `DELETE FROM event_registrations WHERE eventId = ? AND participantId NOT IN (${placeholders})`
      ).run(req.params.id, ...participantIds);
    }

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/teams', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  const { teams, teamMembers } = req.body;
  
  try {
    db.prepare('DELETE FROM teams WHERE eventId = ?').run(req.params.id);
    
    const insertTeam = db.prepare(`INSERT INTO teams (id, eventId, name) VALUES (?, ?, ?)`);
    const insertMember = db.prepare(`INSERT INTO team_members (id, teamId, participantId, penaltyMinus2) VALUES (?, ?, ?, ?)`);

    const transaction = db.transaction(() => {
      for (const team of teams) {
        insertTeam.run(team.id, team.eventId, team.name);
      }
      for (const member of teamMembers) {
        insertMember.run(member.id, member.teamId, member.participantId, member.penaltyMinus2 ? 1 : 0);
      }
    });

    transaction();
    
    res.json({ teams, teamMembers });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/send-email', async (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  if (!isEmailConfigured()) {
    return res.status(503).json({ error: 'Email-Service ist nicht konfiguriert (BREVO_API_KEY fehlt)' });
  }

  const { message } = req.body;
  const eventId = req.params.id;

  try {
    const event: any = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event nicht gefunden' });
    }

    const results: any[] = db.prepare('SELECT participantId FROM results WHERE eventId = ?').all(eventId);
    const participantIds = [...new Set(results.map(r => r.participantId))];

    if (participantIds.length === 0) {
      return res.status(400).json({ error: 'Keine Teilnehmer für dieses Event gefunden' });
    }

    const placeholders = participantIds.map(() => '?').join(',');
    const participants: any[] = db.prepare(
      `SELECT email FROM participants WHERE id IN (${placeholders}) AND email IS NOT NULL AND email != ''`
    ).all(...participantIds);

    const emails = participants.map(p => p.email).filter(email => email);

    if (emails.length === 0) {
      return res.status(400).json({ error: 'Keine E-Mail-Adressen gefunden' });
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">SkinfitCup</h1>
        </div>
        <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p><strong>${event.name}</strong></p>
          ${message.replace(/\n/g, '<br>')}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            SkinfitCup – RSV Stuttgart-Vaihingen<br>
            <a href="https://www.sfc-rsv.de" style="color: #dc2626;">www.sfc-rsv.de</a>
          </p>
        </div>
      </div>
    `;

    const result = await sendBulkEmail(emails, `SkinfitCup – ${event.name}`, htmlBody);

    res.json({ success: true, emailsSent: result.count });
  } catch (error: any) {
    console.error('Error sending event email:', error);
    res.status(500).json({ error: error.message });
  }
});

// === Event Registration (User self-service) ===

// POST /:id/register - Register for an event
router.post('/:id/register', (req, res) => {
  if (!req.session?.userId || !req.session?.participantId) {
    return res.status(401).json({ error: 'Bitte melden Sie sich an.' });
  }

  const eventId = req.params.id;
  const participantId = req.session.participantId;

  try {
    // Check event exists and is not finished
    const event = db.prepare('SELECT id, finished FROM events WHERE id = ?').get(eventId) as any;
    if (!event) {
      return res.status(404).json({ error: 'Event nicht gefunden.' });
    }
    if (event.finished) {
      return res.status(400).json({ error: 'Anmeldung für abgeschlossene Events ist nicht möglich.' });
    }

    const regId = 'reg' + Date.now() + Math.random().toString(36).substring(2, 15);
    db.prepare('INSERT INTO event_registrations (id, eventId, participantId) VALUES (?, ?, ?)')
      .run(regId, eventId, participantId);

    res.status(201).json({ success: true });
  } catch (error: any) {
    // UNIQUE constraint means already registered
    if (error.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Sie sind bereits für dieses Event angemeldet.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id/register - Unregister from an event
router.delete('/:id/register', (req, res) => {
  if (!req.session?.userId || !req.session?.participantId) {
    return res.status(401).json({ error: 'Bitte melden Sie sich an.' });
  }

  try {
    db.prepare('DELETE FROM event_registrations WHERE eventId = ? AND participantId = ?')
      .run(req.params.id, req.session.participantId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id/registrations - List registrations for an event
router.get('/:id/registrations', (req, res) => {
  try {
    const registrations = db.prepare(`
      SELECT er.participantId, er.registeredAt, p.firstName, p.lastName, p.perfClass, p.gender
      FROM event_registrations er
      JOIN participants p ON p.id = er.participantId
      WHERE er.eventId = ?
      ORDER BY er.registeredAt ASC
    `).all(req.params.id) as any[];

    res.json({ registrations, count: registrations.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

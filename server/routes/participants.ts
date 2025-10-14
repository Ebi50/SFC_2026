import express from 'express';
import { db, sanitizeParticipant } from '../database';

const router = express.Router();

router.get('/', (req, res) => {
  const isAdmin = req.session?.isAdmin || false;
  
  try {
    const participants = db.prepare('SELECT * FROM participants').all();
    const sanitized = participants.map(p => sanitizeParticipant(p, isAdmin));
    res.json({ participants: sanitized });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  const isAdmin = req.session?.isAdmin || false;
  
  try {
    const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Teilnehmer nicht gefunden' });
    }
    res.json(sanitizeParticipant(participant, isAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  const { firstName, lastName, email, phone, address, city, postalCode, birthYear, perfClass, gender, isRsvMember } = req.body;
  
  try {
    // Generate unique ID for new participant
    const newId = 'p' + Date.now() + Math.random().toString(36).substring(2, 15);
    
    const stmt = db.prepare(`
      INSERT INTO participants (id, firstName, lastName, email, phone, address, city, postalCode, birthYear, perfClass, gender, isRsvMember)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(newId, firstName, lastName, email, phone || null, address || null, city || null, postalCode || null, birthYear, perfClass, gender, isRsvMember ? 1 : 0);
    
    const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(newId);
    res.status(201).json(sanitizeParticipant(participant, true));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  console.log('📝 PUT REQUEST RECEIVED - ID:', req.params.id);
  console.log('Session ID:', req.sessionID);
  console.log('isAdmin:', req.session?.isAdmin);
  
  if (!req.session?.isAdmin) {
    console.log('❌ PUT REJECTED: Not admin');
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  const { firstName, lastName, email, phone, address, city, postalCode, birthYear, perfClass, gender, isRsvMember } = req.body;
  
  try {
    const stmt = db.prepare(`
      UPDATE participants 
      SET firstName = ?, lastName = ?, email = ?, phone = ?, address = ?, city = ?, postalCode = ?, birthYear = ?, perfClass = ?, gender = ?, isRsvMember = ?
      WHERE id = ?
    `);
    
    stmt.run(firstName, lastName, email, phone || null, address || null, city || null, postalCode || null, birthYear, perfClass, gender, isRsvMember ? 1 : 0, req.params.id);
    
    const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(req.params.id);
    console.log('✅ PUT SUCCESS');
    res.json(sanitizeParticipant(participant, true));
  } catch (error: any) {
    console.error('❌ PUT ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  console.log('🗑️ DELETE REQUEST RECEIVED - ID:', req.params.id);
  console.log('Session ID:', req.sessionID);
  console.log('isAdmin:', req.session?.isAdmin);
  
  // Ensure we always send a JSON response
  const sendJsonResponse = (statusCode: number, data: any) => {
    res.status(statusCode).json(data);
  };
  
  if (!req.session?.isAdmin) {
    console.log('❌ DELETE REJECTED: Not admin');
    return sendJsonResponse(403, { error: 'Keine Berechtigung' });
  }

  try {
    // Check if participant exists
    const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(req.params.id);
    if (!participant) {
      console.log('❌ Participant not found:', req.params.id);
      return sendJsonResponse(404, { error: 'Teilnehmer nicht gefunden' });
    }

    console.log('✅ Participant found:', participant.firstName, participant.lastName);

    // Check for foreign key constraints - manually delete related records first
    // This ensures CASCADE DELETE works properly
    const deleteResults = db.prepare('DELETE FROM results WHERE participantId = ?').run(req.params.id);
    const deleteTeamMembers = db.prepare('DELETE FROM team_members WHERE participantId = ?').run(req.params.id);
    
    console.log('🗑️ Deleted related records - Results:', deleteResults.changes, 'Team Members:', deleteTeamMembers.changes);

    // Now delete the participant
    const result = db.prepare('DELETE FROM participants WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      console.log('❌ No participant deleted - ID might not exist:', req.params.id);
      return sendJsonResponse(404, { error: 'Teilnehmer nicht gefunden' });
    }
    
    console.log('✅ DELETE SUCCESS - Participant deleted, Changes:', result.changes);
    return sendJsonResponse(200, { success: true, message: 'Teilnehmer erfolgreich gelöscht' });
  } catch (error: any) {
    console.error('❌ DELETE ERROR:', error.message);
    console.error('❌ DELETE ERROR Stack:', error.stack);
    return sendJsonResponse(500, { error: `Fehler beim Löschen des Teilnehmers: ${error.message}` });
  }
});

router.post('/import', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  const participants = req.body;
  
  try {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO participants (id, firstName, lastName, email, phone, address, city, postalCode, birthYear, perfClass, gender, isRsvMember)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Generate unique IDs for imported participants
    const generateId = () => `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const insertMany = db.transaction((participants) => {
      for (const p of participants) {
        // Generate ID if not present
        const participantId = p.id || generateId();
        insert.run(participantId, p.firstName, p.lastName, p.email, p.phone || null, p.address || null, p.city || null, p.postalCode || null, p.birthYear, p.perfClass, p.gender, p.isRsvMember ? 1 : 0);
      }
    });

    insertMany(participants);
    
    const allParticipants = db.prepare('SELECT * FROM participants').all();
    res.json(allParticipants.map(p => sanitizeParticipant(p, true)));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

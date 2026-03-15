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

    // Clean up ALL foreign key references before deleting
    const deleteResults = db.prepare('DELETE FROM results WHERE participantId = ?').run(req.params.id);
    const deleteTeamMembers = db.prepare('DELETE FROM team_members WHERE participantId = ?').run(req.params.id);
    const deleteRegistrations = db.prepare('DELETE FROM event_registrations WHERE participantId = ?').run(req.params.id);
    const deleteUsers = db.prepare('DELETE FROM users WHERE participantId = ?').run(req.params.id);

    console.log('🗑️ Deleted related records - Results:', deleteResults.changes, 'Team Members:', deleteTeamMembers.changes, 'Registrations:', deleteRegistrations.changes, 'Users:', deleteUsers.changes);

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
    const findByEmail = db.prepare('SELECT id FROM participants WHERE LOWER(email) = LOWER(?)');
    const findByName = db.prepare('SELECT id FROM participants WHERE LOWER(firstName) = LOWER(?) AND LOWER(lastName) = LOWER(?) AND birthYear = ?');
    const insert = db.prepare(`
      INSERT INTO participants (id, firstName, lastName, email, phone, address, city, postalCode, birthYear, perfClass, gender, isRsvMember)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const update = db.prepare(`
      UPDATE participants SET
        email = COALESCE(NULLIF(?, ''), email),
        phone = COALESCE(NULLIF(?, ''), phone),
        address = COALESCE(NULLIF(?, ''), address),
        city = COALESCE(NULLIF(?, ''), city),
        postalCode = COALESCE(NULLIF(?, ''), postalCode),
        perfClass = ?, gender = ?, isRsvMember = ?
      WHERE id = ?
    `);

    const generateId = () => `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const importMany = db.transaction((participants) => {
      for (const p of participants) {
        // Try to find existing: first by email, then by name+birthYear
        let existing = p.email ? findByEmail.get(p.email) as any : null;
        if (!existing) {
          existing = findByName.get(p.firstName, p.lastName, p.birthYear) as any;
        }

        if (existing) {
          update.run(p.email || null, p.phone || null, p.address || null, p.city || null, p.postalCode || null, p.perfClass, p.gender, p.isRsvMember ? 1 : 0, existing.id);
        } else {
          const participantId = p.id || generateId();
          insert.run(participantId, p.firstName, p.lastName, p.email, p.phone || null, p.address || null, p.city || null, p.postalCode || null, p.birthYear, p.perfClass, p.gender, p.isRsvMember ? 1 : 0);
        }
      }
    });

    importMany(participants);
    
    const allParticipants = db.prepare('SELECT * FROM participants').all();
    res.json(allParticipants.map(p => sanitizeParticipant(p, true)));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Merge duplicates: keeps the entry with results, updates it with contact info from the other
router.post('/merge-duplicates', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  try {
    // Find duplicates by firstName + lastName + birthYear
    const duplicates = db.prepare(`
      SELECT firstName, lastName, birthYear, GROUP_CONCAT(id) as ids, COUNT(*) as cnt
      FROM participants
      GROUP BY LOWER(firstName), LOWER(lastName), birthYear
      HAVING cnt > 1
    `).all() as any[];

    let merged = 0;

    const mergeTransaction = db.transaction(() => {
      for (const dup of duplicates) {
        const ids = dup.ids.split(',');
        const entries = ids.map((id: string) =>
          db.prepare('SELECT * FROM participants WHERE id = ?').get(id)
        ) as any[];

        // Find entry with results (the "primary" one to keep)
        const withResults = entries.find((e: any) => {
          const resultCount = db.prepare('SELECT COUNT(*) as cnt FROM results WHERE participantId = ?').get(e.id) as any;
          return resultCount.cnt > 0;
        });

        // The primary entry is the one with results, or the first one
        const primary = withResults || entries[0];
        const others = entries.filter((e: any) => e.id !== primary.id);

        for (const other of others) {
          // Update primary with contact info from other if primary is missing it
          if ((!primary.email && other.email) || (!primary.phone && other.phone)) {
            db.prepare(`
              UPDATE participants SET
                email = COALESCE(NULLIF(?, ''), email),
                phone = COALESCE(NULLIF(?, ''), phone)
              WHERE id = ?
            `).run(other.email, other.phone, primary.id);
          }

          // Move any results from other to primary
          db.prepare('UPDATE results SET participantId = ? WHERE participantId = ?').run(primary.id, other.id);
          db.prepare('UPDATE team_members SET participantId = ? WHERE participantId = ?').run(primary.id, other.id);

          // Handle event_registrations (might have unique constraint conflicts)
          const otherRegs = db.prepare('SELECT * FROM event_registrations WHERE participantId = ?').all(other.id) as any[];
          for (const reg of otherRegs) {
            const existing = db.prepare('SELECT id FROM event_registrations WHERE eventId = ? AND participantId = ?').get(reg.eventId, primary.id);
            if (!existing) {
              db.prepare('UPDATE event_registrations SET participantId = ? WHERE id = ?').run(primary.id, reg.id);
            } else {
              db.prepare('DELETE FROM event_registrations WHERE id = ?').run(reg.id);
            }
          }

          // Move user accounts
          const otherUsers = db.prepare('SELECT * FROM users WHERE participantId = ?').all(other.id) as any[];
          for (const u of otherUsers) {
            db.prepare('UPDATE users SET participantId = ? WHERE id = ?').run(primary.id, u.id);
          }

          // Delete the duplicate
          db.prepare('DELETE FROM participants WHERE id = ?').run(other.id);
          merged++;
        }
      }
    });

    mergeTransaction();

    const allParticipants = db.prepare('SELECT * FROM participants').all();
    res.json({
      success: true,
      merged,
      duplicateGroups: duplicates.length,
      participants: allParticipants.map(p => sanitizeParticipant(p, true))
    });
  } catch (error: any) {
    console.error('Merge error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

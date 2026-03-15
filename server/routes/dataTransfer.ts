import express from 'express';
import { db } from '../database';

const router = express.Router();

// GET /api/data/export - Export all data (admin only)
router.get('/export', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  try {
    const data = {
      seasons: db.prepare('SELECT * FROM seasons').all(),
      participants: db.prepare('SELECT * FROM participants').all(),
      events: db.prepare('SELECT * FROM events').all(),
      results: db.prepare('SELECT * FROM results').all(),
      teams: db.prepare('SELECT * FROM teams').all(),
      team_members: db.prepare('SELECT * FROM team_members').all(),
      settings: db.prepare('SELECT * FROM settings').all(),
      season_settings: db.prepare('SELECT * FROM season_settings').all(),
      home_content: db.prepare('SELECT * FROM home_content').all(),
    };

    // Try reglement_files if table exists
    try {
      data['reglement_files'] = db.prepare('SELECT id, season, filename, uploadDate, fileSize FROM reglement_files').all();
    } catch {
      data['reglement_files'] = [];
    }

    res.json(data);
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/data/import - Import all data (admin only)
router.post('/import', (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }

  const data = req.body;

  try {
    const importTransaction = db.transaction(() => {
      // Clear existing data (in correct order for foreign keys)
      db.exec('DELETE FROM team_members');
      db.exec('DELETE FROM teams');
      db.exec('DELETE FROM results');
      db.exec('DELETE FROM event_registrations');
      db.exec('DELETE FROM users');
      db.exec('DELETE FROM events');
      db.exec('DELETE FROM participants');
      db.exec('DELETE FROM season_settings');
      db.exec('DELETE FROM seasons');
      db.exec('DELETE FROM settings');
      db.exec('DELETE FROM home_content');

      // Import seasons
      if (data.seasons?.length) {
        const stmt = db.prepare('INSERT INTO seasons (year, createdAt) VALUES (?, ?)');
        for (const s of data.seasons) {
          stmt.run(s.year, s.createdAt || new Date().toISOString());
        }
      }

      // Import participants
      if (data.participants?.length) {
        const stmt = db.prepare(
          'INSERT INTO participants (id, firstName, lastName, email, phone, address, city, postalCode, birthYear, perfClass, gender, isRsvMember, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        for (const p of data.participants) {
          const pid = p.id || ('p' + Date.now() + Math.random().toString(36).substring(2, 10));
          stmt.run(pid, p.firstName, p.lastName, p.email || null, p.phone || null, p.address || null, p.city || null, p.postalCode || null, p.birthYear, p.perfClass, p.gender, p.isRsvMember ? 1 : 0, p.createdAt || new Date().toISOString());
        }
      }

      // Import events
      if (data.events?.length) {
        const stmt = db.prepare(
          'INSERT INTO events (id, name, date, location, eventType, notes, finished, season, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        for (const e of data.events) {
          stmt.run(e.id, e.name, e.date, e.location, e.eventType, e.notes || null, e.finished ? 1 : 0, e.season, e.createdAt || new Date().toISOString());
        }
      }

      // Import results
      if (data.results?.length) {
        const stmt = db.prepare(
          'INSERT INTO results (id, eventId, participantId, placement, time, timeSeconds, points, winnerRank, dnf, hasAeroBars, hasTTEquipment, finisherGroup, rankOverall) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        for (const r of data.results) {
          stmt.run(r.id, r.eventId, r.participantId, r.placement || null, r.time || null, r.timeSeconds || null, r.points || 0, r.winnerRank || null, r.dnf ? 1 : 0, r.hasAeroBars ? 1 : 0, r.hasTTEquipment ? 1 : 0, r.finisherGroup ?? null, r.rankOverall ?? null);
        }
      }

      // Import teams
      if (data.teams?.length) {
        const stmt = db.prepare('INSERT INTO teams (id, eventId, name) VALUES (?, ?, ?)');
        for (const t of data.teams) {
          stmt.run(t.id, t.eventId, t.name);
        }
      }

      // Import team_members
      if (data.team_members?.length) {
        const stmt = db.prepare('INSERT INTO team_members (id, teamId, participantId, penaltyMinus2) VALUES (?, ?, ?, ?)');
        for (const tm of data.team_members) {
          stmt.run(tm.id, tm.teamId, tm.participantId, tm.penaltyMinus2 ? 1 : 0);
        }
      }

      // Import settings
      if (data.settings?.length) {
        const stmt = db.prepare('INSERT INTO settings (id, data, updatedAt) VALUES (?, ?, ?)');
        for (const s of data.settings) {
          stmt.run(s.id, s.data, s.updatedAt || new Date().toISOString());
        }
      }

      // Import season_settings
      if (data.season_settings?.length) {
        const stmt = db.prepare('INSERT INTO season_settings (season, data, updatedAt) VALUES (?, ?, ?)');
        for (const ss of data.season_settings) {
          stmt.run(ss.season, ss.data, ss.updatedAt || new Date().toISOString());
        }
      }

      // Import home_content
      if (data.home_content?.length) {
        const stmt = db.prepare('INSERT INTO home_content (id, title, description, pdf_file, images, upload_date) VALUES (?, ?, ?, ?, ?, ?)');
        for (const hc of data.home_content) {
          stmt.run(hc.id, hc.title, hc.description, hc.pdf_file || null, hc.images || '[]', hc.upload_date);
        }
      }
    });

    importTransaction();

    // Count imported records
    const counts = {
      seasons: data.seasons?.length || 0,
      participants: data.participants?.length || 0,
      events: data.events?.length || 0,
      results: data.results?.length || 0,
      teams: data.teams?.length || 0,
      team_members: data.team_members?.length || 0,
      settings: data.settings?.length || 0,
      season_settings: data.season_settings?.length || 0,
      home_content: data.home_content?.length || 0,
    };

    console.log('Data import successful:', counts);
    res.json({ success: true, imported: counts });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

import { db } from './database';

const PRODUCTION_API = 'https://skinfit-cup-verwaltungs--wertungsapp.ebi50.repl.co/api';

async function fetchFromProduction(endpoint: string) {
  console.log(`Fetching ${endpoint}...`);
  try {
    const response = await fetch(`${PRODUCTION_API}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`✓ Fetched ${Array.isArray(data) ? data.length : 1} items from ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`✗ Error fetching ${endpoint}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function importData() {
  console.log('=== Starting Production Data Import ===\n');

  try {
    // 1. Import Participants
    const participants = await fetchFromProduction('/participants');
    if (participants && Array.isArray(participants)) {
      console.log(`Importing ${participants.length} participants...`);
      const insertParticipant = db.prepare(`
        INSERT OR REPLACE INTO participants 
        (id, firstName, lastName, email, phone, address, city, postalCode, birthYear, perfClass, gender, isRsvMember, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const p of participants) {
        try {
          insertParticipant.run(
            p.id,
            p.firstName,
            p.lastName,
            p.email || null,
            p.phone || null,
            p.address || null,
            p.city || null,
            p.postalCode || null,
            p.birthYear,
            p.perfClass,
            p.gender,
            p.isRsvMember ? 1 : 0,
            p.createdAt || new Date().toISOString()
          );
        } catch (error) {
          console.error(`Error importing participant ${p.firstName} ${p.lastName}:`, error instanceof Error ? error.message : String(error));
        }
      }
      console.log(`✓ Imported ${participants.length} participants`);
    }

    // 2. Import Events
    const events = await fetchFromProduction('/events');
    if (events && Array.isArray(events)) {
      console.log(`Importing ${events.length} events...`);
      const insertEvent = db.prepare(`
        INSERT OR REPLACE INTO events 
        (id, name, date, location, eventType, notes, finished, season, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const e of events) {
        try {
          insertEvent.run(
            e.id,
            e.name,
            e.date,
            e.location,
            e.eventType,
            e.notes || null,
            e.finished ? 1 : 0,
            e.season,
            e.createdAt || new Date().toISOString()
          );
        } catch (error) {
          console.error(`Error importing event ${e.name}:`, error instanceof Error ? error.message : String(error));
        }
      }
      console.log(`✓ Imported ${events.length} events`);
    }

    // 3. Import Results (if any events exist)
    if (events && events.length > 0) {
      for (const event of events) {
        const results = await fetchFromProduction(`/events/${event.id}/results`);
        if (results && Array.isArray(results) && results.length > 0) {
          console.log(`Importing ${results.length} results for event ${event.name}...`);
          const insertResult = db.prepare(`
            INSERT OR REPLACE INTO results 
            (id, eventId, participantId, placement, time, timeSeconds, points, winnerRank, dnf, hasAeroBars, hasTTEquipment, finisherGroup, rankOverall)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          for (const r of results) {
            try {
              insertResult.run(
                r.id || `${event.id}-${r.participantId}`,
                event.id,
                r.participantId,
                r.placement || null,
                r.time || null,
                r.timeSeconds || null,
                r.points || 0,
                r.winnerRank || null,
                r.dnf ? 1 : 0,
                r.hasAeroBars ? 1 : 0,
                r.hasTTEquipment ? 1 : 0,
                r.finisherGroup || null,
                r.rankOverall || null
              );
            } catch (error) {
              console.error(`Error importing result for participant ${r.participantId}:`, error instanceof Error ? error.message : String(error));
            }
          }
          console.log(`✓ Imported ${results.length} results for event ${event.name}`);
        }
      }
    }

    // 4. Import Settings
    const settings = await fetchFromProduction('/settings');
    if (settings) {
      console.log('Importing settings...');
      try {
        db.prepare('INSERT OR REPLACE INTO settings (id, data, updatedAt) VALUES (?, ?, ?)').run(
          1,
          JSON.stringify(settings),
          new Date().toISOString()
        );
        console.log('✓ Imported settings');
      } catch (error) {
        console.error('Error importing settings:', error instanceof Error ? error.message : String(error));
      }
    }

    console.log('\n=== Import Summary ===');
    const counts = {
      participants: db.prepare('SELECT COUNT(*) as count FROM participants').get() as {count: number},
      events: db.prepare('SELECT COUNT(*) as count FROM events').get() as {count: number},
      results: db.prepare('SELECT COUNT(*) as count FROM results').get() as {count: number},
      seasons: db.prepare('SELECT COUNT(*) as count FROM seasons').get() as {count: number},
      settings: db.prepare('SELECT COUNT(*) as count FROM settings').get() as {count: number}
    };

    console.log(`Participants: ${counts.participants.count}`);
    console.log(`Events: ${counts.events.count}`);
    console.log(`Results: ${counts.results.count}`);
    console.log(`Seasons: ${counts.seasons.count}`);
    console.log(`Settings: ${counts.settings.count}`);

    console.log('\n✅ Import completed successfully!');

  } catch (error) {
    console.error('❌ Import failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

importData();
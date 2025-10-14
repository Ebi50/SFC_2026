import { db } from './database';

async function createTestData() {
  console.log('=== Creating Test Data ===\n');

  try {
    // Create sample participants
    console.log('Creating test participants...');
    const participants = [
      {
        id: 'p1', firstName: 'Max', lastName: 'Mustermann', birthYear: 1985, 
        perfClass: 'A', gender: 'M', isRsvMember: 1, email: 'max@test.de'
      },
      {
        id: 'p2', firstName: 'Anna', lastName: 'Schmidt', birthYear: 1990, 
        perfClass: 'B', gender: 'W', isRsvMember: 0, email: 'anna@test.de'
      },
      {
        id: 'p3', firstName: 'Tom', lastName: 'Weber', birthYear: 1978, 
        perfClass: 'A', gender: 'M', isRsvMember: 1, email: 'tom@test.de'
      },
      {
        id: 'p4', firstName: 'Lisa', lastName: 'Müller', birthYear: 1988, 
        perfClass: 'C', gender: 'W', isRsvMember: 0, email: 'lisa@test.de'
      },
      {
        id: 'p5', firstName: 'Stefan', lastName: 'Bauer', birthYear: 1982, 
        perfClass: 'B', gender: 'M', isRsvMember: 1, email: 'stefan@test.de'
      }
    ];

    const insertParticipant = db.prepare(`
      INSERT OR REPLACE INTO participants 
      (id, firstName, lastName, email, phone, address, city, postalCode, birthYear, perfClass, gender, isRsvMember, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of participants) {
      insertParticipant.run(
        p.id, p.firstName, p.lastName, p.email, null, null, null, null,
        p.birthYear, p.perfClass, p.gender, p.isRsvMember, new Date().toISOString()
      );
    }
    console.log(`✓ Created ${participants.length} test participants`);

    // Create sample events
    console.log('Creating test events...');
    const events = [
      {
        id: 'e1', name: 'Frühling Zeitfahren', date: '2025-04-15',
        location: 'Würmtal', eventType: 'EZF', season: 2025, finished: 1
      },
      {
        id: 'e2', name: 'Sommer Bergzeitfahren', date: '2025-06-20',
        location: 'Alpen', eventType: 'BZF', season: 2025, finished: 1
      },
      {
        id: 'e3', name: 'Herbst Mannschaftsfahren', date: '2025-09-10',
        location: 'Würmtal', eventType: 'MZF', season: 2025, finished: 0
      }
    ];

    const insertEvent = db.prepare(`
      INSERT OR REPLACE INTO events 
      (id, name, date, location, eventType, notes, finished, season, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const e of events) {
      insertEvent.run(
        e.id, e.name, e.date, e.location, e.eventType, null,
        e.finished, e.season, new Date().toISOString()
      );
    }
    console.log(`✓ Created ${events.length} test events`);

    // Create sample results for finished events
    console.log('Creating test results...');
    const results = [
      // Event 1 results
      { id: 'r1', eventId: 'e1', participantId: 'p1', placement: 1, time: '25:30', timeSeconds: 1530, points: 100 },
      { id: 'r2', eventId: 'e1', participantId: 'p2', placement: 2, time: '26:45', timeSeconds: 1605, points: 95 },
      { id: 'r3', eventId: 'e1', participantId: 'p3', placement: 3, time: '27:20', timeSeconds: 1640, points: 90 },
      
      // Event 2 results
      { id: 'r4', eventId: 'e2', participantId: 'p3', placement: 1, time: '18:45', timeSeconds: 1125, points: 100 },
      { id: 'r5', eventId: 'e2', participantId: 'p1', placement: 2, time: '19:30', timeSeconds: 1170, points: 95 },
      { id: 'r6', eventId: 'e2', participantId: 'p4', placement: 3, time: '20:15', timeSeconds: 1215, points: 90 }
    ];

    const insertResult = db.prepare(`
      INSERT OR REPLACE INTO results 
      (id, eventId, participantId, placement, time, timeSeconds, points, winnerRank, dnf, hasAeroBars, hasTTEquipment, finisherGroup, rankOverall)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const r of results) {
      insertResult.run(
        r.id, r.eventId, r.participantId, r.placement, r.time, r.timeSeconds,
        r.points, null, 0, 0, 0, null, null
      );
    }
    console.log(`✓ Created ${results.length} test results`);

    // Update settings with more realistic data
    console.log('Updating settings...');
    const settings = {
      handicaps: { A: 0, B: 120, C: 240, D: 480 },
      teamSizes: { EZF: 1, BZF: 1, MZF: 4 },
      defaultPerfClass: 'B',
      currentSeason: 2025,
      appName: 'SkinFit Cup 2025'
    };

    db.prepare('UPDATE settings SET data = ?, updatedAt = ? WHERE id = 1').run(
      JSON.stringify(settings),
      new Date().toISOString()
    );
    console.log('✓ Updated settings');

    console.log('\n=== Final Data Summary ===');
    const counts = {
      participants: db.prepare('SELECT COUNT(*) as count FROM participants').get() as {count: number},
      events: db.prepare('SELECT COUNT(*) as count FROM events').get() as {count: number},
      results: db.prepare('SELECT COUNT(*) as count FROM results').get() as {count: number},
      seasons: db.prepare('SELECT COUNT(*) as count FROM seasons').get() as {count: number}
    };

    console.log(`Participants: ${counts.participants.count}`);
    console.log(`Events: ${counts.events.count}`);
    console.log(`Results: ${counts.results.count}`);
    console.log(`Seasons: ${counts.seasons.count}`);

    console.log('\n✅ Test data created successfully!');

  } catch (error) {
    console.error('❌ Error creating test data:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Export the function for use in other modules
export { createTestData };

// Only run directly if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestData().catch(error => {
    console.error('Failed to create test data:', error);
    process.exit(1);
  });
}
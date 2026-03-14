// Migration script: Transfer data from Cloud Run to Railway
// Usage: node migrate-data.mjs

const SOURCE = 'https://skinfitcup-238077235347.europe-west1.run.app';
const TARGET = 'https://sfc2026-production.up.railway.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Rgjzdvlim32/';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

async function loginAdmin(baseUrl) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
    redirect: 'manual',
  });

  const cookies = res.headers.getSetCookie?.() || [];
  const sessionCookie = cookies.find(c => c.startsWith('skinfit.sid='));
  if (!sessionCookie) {
    // Try raw headers
    const rawCookies = res.headers.raw?.()?.['set-cookie'] || [];
    const raw = rawCookies.find(c => c.startsWith('skinfit.sid='));
    if (raw) return raw.split(';')[0];
    throw new Error('Login failed - no session cookie');
  }
  return sessionCookie.split(';')[0];
}

async function main() {
  console.log('=== Data Migration: Cloud Run -> Railway ===\n');

  // Step 1: Fetch all data from source (public APIs)
  console.log('1. Fetching data from Cloud Run...');

  const [eventsData, participantsData, seasonsData] = await Promise.all([
    fetchJson(`${SOURCE}/api/events`),
    fetchJson(`${SOURCE}/api/participants`),
    fetchJson(`${SOURCE}/api/seasons`),
  ]);

  console.log(`   Seasons: ${seasonsData.seasons?.length || 0}`);
  console.log(`   Events: ${eventsData.events?.length || 0}`);
  console.log(`   Results: ${eventsData.results?.length || 0}`);
  console.log(`   Teams: ${eventsData.teams?.length || 0}`);
  console.log(`   Team Members: ${eventsData.teamMembers?.length || 0}`);
  console.log(`   Participants: ${participantsData.participants?.length || 0}`);

  // Try to get settings (might need admin)
  let settingsData = null;
  try {
    settingsData = await fetchJson(`${SOURCE}/api/settings`);
    console.log('   Settings: found');
  } catch {
    console.log('   Settings: not accessible (admin only)');
  }

  // Build import payload
  const importData = {
    seasons: (seasonsData.seasons || []).map(year => ({ year })),
    participants: participantsData.participants || [],
    events: eventsData.events || [],
    results: eventsData.results || [],
    teams: eventsData.teams || [],
    team_members: eventsData.teamMembers || [],
    settings: settingsData ? [{ id: 1, data: JSON.stringify(settingsData) }] : [],
    season_settings: [],
    home_content: [],
  };

  // Try to get season settings for each season
  for (const year of (seasonsData.seasons || [])) {
    try {
      const ss = await fetchJson(`${SOURCE}/api/settings/season/${year}`);
      importData.season_settings.push({ season: year, data: JSON.stringify(ss) });
      console.log(`   Season settings ${year}: found`);
    } catch {
      console.log(`   Season settings ${year}: not accessible`);
    }
  }

  // Step 2: Login as admin on Railway
  console.log('\n2. Logging into Railway as admin...');
  const cookie = await loginAdmin(TARGET);
  console.log('   Login successful');

  // Step 3: Import data to Railway
  console.log('\n3. Importing data to Railway...');
  const result = await fetchJson(`${TARGET}/api/data/import`, {
    method: 'POST',
    headers: { 'Cookie': cookie },
    body: JSON.stringify(importData),
  });

  console.log('\n=== Migration complete! ===');
  console.log('Imported:', JSON.stringify(result.imported, null, 2));
}

main().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});

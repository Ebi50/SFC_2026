import { db } from './database';
import { PerfClass } from '../types';

const properSettings = {
  timeTrialBonuses: {
    aeroBars: { enabled: true, seconds: 30 },
    ttEquipment: { enabled: true, seconds: 30 },
  },
  winnerPoints: [3, 2, 1],
  handicapBasePoints: {
    [PerfClass.A]: 5,
    [PerfClass.B]: 6,
    [PerfClass.C]: 7,
    [PerfClass.D]: 8,
  },
  dropScores: 1,
  closedSeasons: [],
  defaultGroupMapping: {
    hobby: PerfClass.B,
    ambitious: PerfClass.C,
  },
  handicapSettings: {
    gender: {
        female: { enabled: true, seconds: -120 }, // Bonus
    },
    ageBrackets: [
        { minAge: 0, maxAge: 18, enabled: true, seconds: -90 },   // Youth
        { minAge: 40, maxAge: 49, enabled: true, seconds: -60 },  // Sen 2
        { minAge: 50, maxAge: 59, enabled: true, seconds: -90 },  // Sen 3
        { minAge: 60, maxAge: 999, enabled: true, seconds: -120 }, // Sen 4
    ],
    perfClass: {
        hobby: { enabled: true, seconds: -45 },
    },
  },
};

console.log('Fixing settings with proper structure...');

try {
  // Update global settings
  db.prepare('UPDATE settings SET data = ? WHERE id = 1').run(JSON.stringify(properSettings));
  console.log('✅ Updated global settings');
  
  // Update season settings for 2025 and 2005
  const seasons = [2025, 2005];
  for (const year of seasons) {
    db.prepare('UPDATE season_settings SET data = ? WHERE season = ?').run(JSON.stringify(properSettings), year);
    console.log(`✅ Updated settings for season ${year}`);
  }
  
  console.log('Settings fixed successfully!');
} catch (error) {
  console.error('Error fixing settings:', error);
}
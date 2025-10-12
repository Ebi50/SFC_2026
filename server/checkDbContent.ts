import sqlite from 'better-sqlite3';
import * as path from 'path';
import { statSync } from 'fs';

console.log('=== Database Content Check ===\n');

// Check both database files
const databases = [
  { name: 'Root DB', path: path.join(process.cwd(), '..', 'database.sqlite3') },
  { name: 'Server DB', path: path.join(process.cwd(), 'database.sqlite3') }
];

const tables = ['participants', 'events', 'results', 'seasons', 'settings', 'teams'];

for (const dbInfo of databases) {
  console.log(`\n--- ${dbInfo.name} (${dbInfo.path}) ---`);
  
  try {
    const db = sqlite(dbInfo.path);
    
    // Check if file exists and has content
    const fileStats = statSync(dbInfo.path);
    console.log(`File size: ${fileStats.size} bytes`);
    
    // Check each table
    for (const table of tables) {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE 1=1`).get() as {count: number};
        console.log(`${table}: ${count.count} rows`);
      } catch (error) {
        console.log(`${table}: TABLE NOT EXISTS or ERROR`);
      }
    }
    
    db.close();
    
  } catch (error) {
    console.log(`ERROR accessing database: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log('\n=== Current Working Directory Info ===');
console.log('process.cwd():', process.cwd());
console.log('Expected DB path from database.ts:', path.join(process.cwd(), '..', 'database.sqlite3'));
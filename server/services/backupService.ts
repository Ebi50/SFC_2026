import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../database';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isRailway = !!process.env.RAILWAY_ENVIRONMENT;

const BACKUP_TABLES = [
  'seasons', 'participants', 'users', 'events', 'results', 'teams',
  'team_members', 'event_registrations', 'settings', 'season_settings',
  'home_content', 'reglement_files'
];

export function exportDatabase() {
  const data: Record<string, unknown[]> = {};
  for (const table of BACKUP_TABLES) {
    try {
      data[table] = db.prepare(`SELECT * FROM ${table}`).all();
    } catch {
      data[table] = [];
    }
  }
  return data;
}

const FILE_DIRS: Record<string, string> = {
  gpx: isRailway ? '/data/gpx' : path.join(__dirname, '../../public/gpx'),
  reglement: isRailway ? '/data/reglement' : path.join(__dirname, '../../public/reglement'),
  home: isRailway ? '/data/uploads/home' : path.join(process.cwd(), 'uploads', 'home'),
};

export function collectFiles() {
  const files: Array<{ dir: string; name: string; base64: string }> = [];
  for (const [dir, dirPath] of Object.entries(FILE_DIRS)) {
    if (!fs.existsSync(dirPath)) continue;
    for (const name of fs.readdirSync(dirPath)) {
      const fullPath = path.join(dirPath, name);
      if (fs.statSync(fullPath).isFile()) {
        files.push({ dir, name, base64: fs.readFileSync(fullPath).toString('base64') });
      }
    }
  }
  return files;
}

const SNAPSHOT_DIR = isRailway ? '/data/import-snapshots' : path.join(process.cwd(), 'import-snapshots');
const MAX_SNAPSHOTS = 10;

// Sicherheitsnetz: wird vor jedem Voll-Import aufgerufen, der die DB leert und neu befuellt.
// Ohne dieses Snapshot waere ein Fehl-Import (falsche Datei, Bug) sofort unwiederbringlich.
export function writePreImportSnapshot() {
  if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

  const filename = `pre-import-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(path.join(SNAPSHOT_DIR, filename), JSON.stringify(exportDatabase()));

  const files = fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.startsWith('pre-import-'))
    .sort();
  for (const old of files.slice(0, -MAX_SNAPSHOTS)) {
    fs.unlinkSync(path.join(SNAPSHOT_DIR, old));
  }

  return filename;
}

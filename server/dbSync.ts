import { Storage } from '@google-cloud/storage';
import { existsSync, copyFileSync, statSync } from 'fs';
import * as path from 'path';

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'skinfit-cup-database';
const DB_FILE_NAME = 'database.sqlite3';
const LOCAL_DB_PATH = path.join(process.cwd(), DB_FILE_NAME);

// Initialize Google Cloud Storage
const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);
const file = bucket.file(DB_FILE_NAME);

let lastSyncTime = Date.now();
let syncInterval: NodeJS.Timeout | null = null;

/**
 * Download database from Cloud Storage to local filesystem
 */
export async function downloadDatabaseFromCloud(): Promise<boolean> {
  try {
    console.log(`📥 Downloading database from gs://${BUCKET_NAME}/${DB_FILE_NAME}...`);
    
    // Check if file exists in bucket
    const [exists] = await file.exists();
    
    if (!exists) {
      console.log('⚠️  No database found in Cloud Storage. Will create new one.');
      return false;
    }

    // Download the file
    await file.download({ destination: LOCAL_DB_PATH });
    
    const stats = statSync(LOCAL_DB_PATH);
    console.log(`✅ Database downloaded successfully (${stats.size} bytes)`);
    lastSyncTime = Date.now();
    return true;
    
  } catch (error) {
    console.error('❌ Error downloading database from Cloud Storage:', error);
    return false;
  }
}

/**
 * Upload database from local filesystem to Cloud Storage
 */
export async function uploadDatabaseToCloud(): Promise<boolean> {
  try {
    if (!existsSync(LOCAL_DB_PATH)) {
      console.warn('⚠️  Local database not found. Nothing to upload.');
      return false;
    }

    console.log(`📤 Uploading database to gs://${BUCKET_NAME}/${DB_FILE_NAME}...`);
    
    await bucket.upload(LOCAL_DB_PATH, {
      destination: DB_FILE_NAME,
      metadata: {
        contentType: 'application/x-sqlite3',
        metadata: {
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'skinfit-cup-server'
        }
      }
    });
    
    console.log('✅ Database uploaded successfully');
    lastSyncTime = Date.now();
    return true;
    
  } catch (error) {
    console.error('❌ Error uploading database to Cloud Storage:', error);
    return false;
  }
}

/**
 * Create a backup of the current database in Cloud Storage
 */
export async function backupDatabaseToCloud(): Promise<boolean> {
  try {
    if (!existsSync(LOCAL_DB_PATH)) {
      console.warn('⚠️  Local database not found. Nothing to backup.');
      return false;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backups/database-${timestamp}.sqlite3`;
    
    console.log(`💾 Creating backup: ${backupFileName}...`);
    
    await bucket.upload(LOCAL_DB_PATH, {
      destination: backupFileName,
      metadata: {
        contentType: 'application/x-sqlite3',
        metadata: {
          backupDate: new Date().toISOString(),
          originalFile: DB_FILE_NAME
        }
      }
    });
    
    console.log('✅ Backup created successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    return false;
  }
}

/**
 * Start automatic sync: Upload database every N minutes
 */
export function startAutoSync(intervalMinutes: number = 5): void {
  if (syncInterval) {
    console.log('⚠️  Auto-sync already running');
    return;
  }

  console.log(`🔄 Starting auto-sync: every ${intervalMinutes} minutes`);
  
  syncInterval = setInterval(async () => {
    const now = Date.now();
    const minutesSinceLastSync = (now - lastSyncTime) / 1000 / 60;
    
    if (minutesSinceLastSync >= intervalMinutes) {
      console.log(`🔄 Auto-sync triggered (${minutesSinceLastSync.toFixed(1)} minutes since last sync)`);
      await uploadDatabaseToCloud();
    }
  }, intervalMinutes * 60 * 1000);
}

/**
 * Stop automatic sync
 */
export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('🛑 Auto-sync stopped');
  }
}

/**
 * Initialize database: Download from cloud or create new
 */
export async function initializeDatabase(): Promise<void> {
  console.log('🚀 Initializing database...');
  
  const downloaded = await downloadDatabaseFromCloud();
  
  if (!downloaded) {
    console.log('📝 No existing database found. Will be created by initDatabase()');
  }
  
  // Start auto-sync (upload every 5 minutes)
  if (process.env.NODE_ENV === 'production') {
    startAutoSync(5);
  }
}

/**
 * Graceful shutdown: Upload database one last time
 */
export async function shutdownDatabaseSync(): Promise<void> {
  console.log('🔄 Final database sync before shutdown...');
  stopAutoSync();
  await uploadDatabaseToCloud();
  console.log('✅ Database sync completed');
}

// Handle process termination
process.on('SIGTERM', async () => {
  await shutdownDatabaseSync();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdownDatabaseSync();
  process.exit(0);
});

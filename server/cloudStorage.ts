import { Storage } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ID = 'skinfit-app-474714';
const BUCKET_NAME = 'skinfit-app-data';
const DATABASE_FILE = 'database.sqlite3';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: PROJECT_ID,
});

const bucket = storage.bucket(BUCKET_NAME);

export class CloudStorageService {
  
  /**
   * Download database from Google Cloud Storage
   */
  static async downloadDatabase(localPath: string): Promise<boolean> {
    try {
      const file = bucket.file(DATABASE_FILE);
      const [exists] = await file.exists();
      
      if (!exists) {
        console.log('📦 No database found in cloud storage, will create new one');
        return false;
      }

      console.log('⬇️  Downloading database from cloud storage...');
      await file.download({ destination: localPath });
      console.log('✅ Database downloaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error downloading database:', error);
      return false;
    }
  }

  /**
   * Upload database to Google Cloud Storage
   */
  static async uploadDatabase(localPath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(localPath)) {
        console.log('⚠️  Local database file does not exist, skipping upload');
        return false;
      }

      console.log('⬆️  Uploading database to cloud storage...');
      const file = bucket.file(DATABASE_FILE);
      await file.save(fs.readFileSync(localPath));
      console.log('✅ Database uploaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error uploading database:', error);
      return false;
    }
  }

  /**
   * Create bucket if it doesn't exist
   */
  static async ensureBucketExists(): Promise<boolean> {
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        console.log('📦 Creating cloud storage bucket...');
        await bucket.create();
        console.log('✅ Bucket created successfully');
      } else {
        console.log('📦 Cloud storage bucket exists');
      }
      return true;
    } catch (error) {
      console.error('❌ Error with bucket:', error);
      return false;
    }
  }

  /**
   * Sync database to cloud periodically
   */
  static startPeriodicSync(localPath: string, intervalMinutes: number = 5): NodeJS.Timeout {
    const intervalMs = intervalMinutes * 60 * 1000;
    console.log(`🔄 Starting periodic database sync every ${intervalMinutes} minutes`);
    
    return setInterval(async () => {
      console.log('⏰ Periodic sync - uploading database...');
      const success = await this.uploadDatabase(localPath);
      if (success) {
        console.log('✅ Periodic sync completed successfully');
      } else {
        console.log('❌ Periodic sync failed');
      }
    }, intervalMs);
  }

  /**
   * Upload database immediately (for manual sync)
   */
  static async syncNow(localPath: string): Promise<boolean> {
    console.log('🚀 Manual sync requested...');
    return await this.uploadDatabase(localPath);
  }
}
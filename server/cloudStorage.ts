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

  /**
   * Upload GPX file to Google Cloud Storage
   */
  static async uploadGpxFile(localPath: string, filename: string): Promise<boolean> {
    try {
      if (!fs.existsSync(localPath)) {
        console.log('⚠️  GPX file does not exist, skipping upload');
        return false;
      }

      const cloudPath = `Daten/Strecken/${filename}`;
      console.log(`⬆️  Uploading GPX file to: ${cloudPath}`);
      
      const file = bucket.file(cloudPath);
      await file.save(fs.readFileSync(localPath), {
        metadata: {
          contentType: 'application/gpx+xml',
        },
      });
      
      console.log('✅ GPX file uploaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error uploading GPX file:', error);
      return false;
    }
  }

  /**
   * Download GPX file from Google Cloud Storage
   */
  static async downloadGpxFile(filename: string, localPath: string): Promise<boolean> {
    try {
      const cloudPath = `Daten/Strecken/${filename}`;
      const file = bucket.file(cloudPath);
      const [exists] = await file.exists();
      
      if (!exists) {
        console.log(`📦 GPX file ${filename} not found in cloud storage`);
        return false;
      }

      console.log(`⬇️  Downloading GPX file: ${filename}`);
      await file.download({ destination: localPath });
      console.log('✅ GPX file downloaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error downloading GPX file:', error);
      return false;
    }
  }

  /**
   * List all GPX files in cloud storage
   */
  static async listGpxFiles(): Promise<Array<{name: string, size: number, updated: string}>> {
    try {
      const [files] = await bucket.getFiles({
        prefix: 'Daten/Strecken/',
      });

      const gpxFiles = files
        .filter(file => file.name.toLowerCase().endsWith('.gpx'))
        .map(file => ({
          name: path.basename(file.name),
          size: typeof file.metadata.size === 'string' ? parseInt(file.metadata.size) : (file.metadata.size || 0),
          updated: file.metadata.updated || '',
        }));

      console.log(`📋 Found ${gpxFiles.length} GPX files in cloud storage`);
      return gpxFiles;
    } catch (error) {
      console.error('❌ Error listing GPX files:', error);
      return [];
    }
  }

  /**
   * Delete GPX file from cloud storage
   */
  static async deleteGpxFile(filename: string): Promise<boolean> {
    try {
      const cloudPath = `Daten/Strecken/${filename}`;
      const file = bucket.file(cloudPath);
      await file.delete();
      console.log(`🗑️  GPX file deleted: ${filename}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting GPX file:', error);
      return false;
    }
  }

  /**
   * Upload any file to Google Cloud Storage
   */
  static async uploadFile(localPath: string, cloudPath: string): Promise<boolean> {
    try {
      const file = bucket.file(cloudPath);
      await file.save(fs.readFileSync(localPath));
      console.log(`☁️  File uploaded: ${cloudPath}`);
      return true;
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      return false;
    }
  }

  /**
   * Download any file from Google Cloud Storage
   */
  static async downloadFile(cloudPath: string): Promise<Buffer> {
    try {
      const file = bucket.file(cloudPath);
      const [data] = await file.download();
      console.log(`☁️  File downloaded: ${cloudPath}`);
      return data;
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Delete any file from Google Cloud Storage
   */
  static async deleteFile(cloudPath: string): Promise<boolean> {
    try {
      const file = bucket.file(cloudPath);
      await file.delete();
      console.log(`🗑️  File deleted: ${cloudPath}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      return false;
    }
  }
}
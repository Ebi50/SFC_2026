import { Storage } from '@google-cloud/storage';

class StorageService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    // Prüfen ob Credentials als Environment-Variable vorhanden sind
    const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS 
      ? JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
      : { keyFilename: process.env.GOOGLE_CLOUD_CREDENTIALS_PATH };

    this.storage = new Storage({
      ...credentials,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });
    
    this.bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || '';
    
    if (!this.bucketName) {
      throw new Error('GOOGLE_CLOUD_BUCKET_NAME must be set in environment variables');
    }
  }

  async uploadFile(filePath: string, destination: string): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [file] = await bucket.upload(filePath, {
        destination: destination,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      // Macht die Datei öffentlich zugänglich
      await file.makePublic();

      // Gibt die öffentliche URL zurück
      return `https://storage.googleapis.com/${this.bucketName}/${destination}`;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async downloadFile(fileName: string, destinationPath: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      await file.download({
        destination: destinationPath
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      await file.delete();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
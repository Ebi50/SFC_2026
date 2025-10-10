// Object Storage Service für Replit App Storage
// Referenced from blueprint:javascript_object_storage
import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Object Storage Client für Replit
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

export class ObjectStorageService {
  constructor() {}

  getStorageBasePath(): string {
    const bucketName = process.env.OBJECT_STORAGE_BUCKET || "";
    if (!bucketName) {
      throw new Error(
        "OBJECT_STORAGE_BUCKET not set. Create a bucket in 'App Storage' " +
          "tool and set OBJECT_STORAGE_BUCKET env var."
      );
    }
    // Return path in format: /bucket-name
    return `/${bucketName}`;
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
    folder: 'gpx' | 'reglement'
  ): Promise<string> {
    const basePath = this.getStorageBasePath();
    const fullPath = `${basePath}/${folder}/${fileName}`;
    
    const { bucketName, objectName } = parseObjectPath(fullPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    await file.save(fileBuffer, {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=3600',
      },
    });

    return fullPath;
  }

  async getFile(folder: 'gpx' | 'reglement', fileName: string): Promise<File | null> {
    try {
      const basePath = this.getStorageBasePath();
      const fullPath = `${basePath}/${folder}/${fileName}`;
      
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      const [exists] = await file.exists();
      if (!exists) {
        return null;
      }

      return file;
    } catch (error) {
      console.error('Error getting file:', error);
      return null;
    }
  }

  async listFiles(folder: 'gpx' | 'reglement'): Promise<Array<{ name: string; uploadedAt: Date; size: number }>> {
    try {
      const basePath = this.getStorageBasePath();
      const folderPath = `${basePath}/${folder}/`;
      
      const { bucketName, objectName } = parseObjectPath(folderPath);
      const bucket = objectStorageClient.bucket(bucketName);
      
      const [files] = await bucket.getFiles({ prefix: objectName });
      
      return files
        .filter((file: File) => !file.name.endsWith('/'))
        .map((file: File) => {
          const metadata = file.metadata;
          return {
            name: file.name.replace(objectName, ''),
            uploadedAt: new Date(metadata.timeCreated || Date.now()),
            size: parseInt(String(metadata.size || '0'), 10),
          };
        });
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  async deleteFile(folder: 'gpx' | 'reglement', fileName: string): Promise<boolean> {
    try {
      const basePath = this.getStorageBasePath();
      const fullPath = `${basePath}/${folder}/${fileName}`;
      
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      await file.delete();
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async downloadFile(file: File, res: Response): Promise<void> {
    try {
      const [metadata] = await file.getMetadata();
      
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": "public, max-age=3600",
      });

      const stream = file.createReadStream();

      stream.on("error", (err: Error) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
}

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'r2sbop';
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://bfdba11ba88cafd6f064809c2fe29b99.r2.cloudflarestorage.com/r2sbop';
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT || 'https://bfdba11ba88cafd6f064809c2fe29b99.r2.cloudflarestorage.com';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';

// Local uploads directory
const localUploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

let s3Client: S3Client | null = null;
if (R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

export interface UploadResult {
  url: string;
  key: string;
  storage: 'r2' | 'local';
}

export async function uploadFile(
  fileBuffer: Buffer,
  originalFilename: string,
  mimetype: string
): Promise<UploadResult> {
  const ext = path.extname(originalFilename) || '.jpg';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const key = `defects/${timestamp}_${randomStr}${ext}`;

  // If S3 client is configured with credentials, upload directly to Cloudflare R2
  if (s3Client) {
    try {
      console.log(`Uploading ${key} to Cloudflare R2 bucket ${R2_BUCKET_NAME}...`);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: mimetype,
        })
      );
      const url = `${R2_PUBLIC_URL}/${key}`;
      return { url, key, storage: 'r2' };
    } catch (err) {
      console.error('Failed to upload to Cloudflare R2, falling back to local storage:', err);
    }
  }

  // Fallback to local storage (and save locally)
  const localFilePath = path.join(localUploadsDir, `${timestamp}_${randomStr}${ext}`);
  fs.writeFileSync(localFilePath, fileBuffer);
  
  // Return URL accessible via /uploads/ and note R2 representation
  const url = `/uploads/${timestamp}_${randomStr}${ext}`;
  return {
    url,
    key,
    storage: 'local'
  };
}

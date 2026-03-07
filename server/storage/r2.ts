import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { StorageDriver, StorageResult } from './types';

export class R2StorageDriver implements StorageDriver {
  private client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('Missing required Cloudflare R2 environment variables');
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucketName = bucketName;
    this.publicUrl = publicUrl || `https://pub-${accountId}.r2.dev`;
  }

  private generateKey(userId: string, filename: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uuid = randomUUID();
    const ext = filename.split('.').pop() || 'jpg';
    
    return `receipts/${userId}/${year}/${month}/${uuid}.${ext}`;
  }

  async upload(file: Buffer, filename: string, mimeType: string, userId: string): Promise<StorageResult> {
    const key = this.generateKey(userId, filename);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });

    try {
      await this.client.send(command);
      const url = `${this.publicUrl}/${key}`;
      return { key, url };
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error('Failed to upload to R2');
    }
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.client.send(command);
    } catch (error) {
      console.error('R2 delete error:', error);
      throw new Error('Failed to delete from R2');
    }
  }
}

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { GlacierClient, InitiateJobCommand, DescribeJobCommand } from '@aws-sdk/client-glacier';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { StorageDriver, StorageResult } from './types';

export class S3GlacierDriver implements StorageDriver {
  private s3Client: S3Client;
  private glacierClient: GlacierClient;
  private bucketName: string;
  private glacierVaultName: string | undefined;
  private region: string;

  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const glacierVaultName = process.env.AWS_GLACIER_VAULT_NAME;

    if (!accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('Missing required AWS environment variables. Check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME');
    }

    console.log(`🔧 Initializing S3 Glacier Driver`);
    console.log(`📦 Bucket: ${bucketName}`);
    console.log(`🌍 Region: ${region}`);
    console.log(`🗄️  Glacier Vault: ${glacierVaultName || 'Using S3 Glacier transitions'}`);

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.glacierClient = new GlacierClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucketName = bucketName;
    this.glacierVaultName = glacierVaultName;
    this.region = region;
  }

  private generateKey(userId: string, filename: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uuid = randomUUID();
    const ext = filename.split('.').pop() || 'jpg';
    
    return `receipts/${userId}/${year}/${month}/${uuid}.${ext}`;
  }

  private async checkStorageClass(key: string): Promise<string> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      const response = await this.s3Client.send(command);
      return response.StorageClass || 'STANDARD';
    } catch (error) {
      console.error('Error checking storage class:', error);
      return 'STANDARD';
    }
  }

  private async restoreFromGlacier(key: string): Promise<void> {
    try {
      console.log(`🔄 Initiating Glacier restore for: ${key}`);
      
      const command = new InitiateJobCommand({
        accountId: process.env.AWS_ACCOUNT_ID || '',
        vaultName: this.glacierVaultName,
        jobParameters: {
          Type: 'archive-retrieval',
          ArchiveId: key,
          Tier: 'Expedited', // Use 'Standard' or 'Bulk' for cost optimization
          Description: `Restore receipt: ${key}`,
        },
      });

      const response = await this.glacierClient.send(command);
      console.log(`✅ Glacier restore initiated. Job ID: ${response.jobId}`);
      
      // In production, you'd want to:
      // 1. Store the jobId in your database
      // 2. Check job status periodically
      // 3. Notify user when restore is complete
      
    } catch (error) {
      console.error('❌ Glacier restore failed:', error);
      throw new Error('Failed to restore from Glacier');
    }
  }

  async upload(file: Buffer, filename: string, mimeType: string, userId: string): Promise<StorageResult> {
    const key = this.generateKey(userId, filename);

    try {
      // Upload to S3 with lifecycle tags for Glacier transition
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: mimeType,
        Metadata: {
          'original-filename': filename,
          'user-id': userId,
          'upload-date': new Date().toISOString(),
        },
        Tagging: 'Lifecycle=Receipt', // Tag for lifecycle policies
        StorageClass: 'STANDARD', // Start in S3 Standard
      });

      await this.s3Client.send(command);
      
      // Generate public URL
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      
      console.log(`✅ File uploaded to S3: ${key}`);
      
      return { key, url };
      
    } catch (error) {
      console.error('❌ S3 upload error:', error);
      throw new Error('Failed to upload to S3');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      // Check if object is in Glacier and needs to be restored first
      const storageClass = await this.checkStorageClass(key);
      
      if (storageClass === 'GLACIER' || storageClass === 'DEEP_ARCHIVE') {
        console.log(`🗄️  Deleting from Glacier: ${key}`);
        // For Glacier objects, deletion works the same way
        // but you might want to add additional cleanup logic
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log(`✅ File deleted: ${key}`);
      
    } catch (error) {
      console.error('❌ Delete error:', error);
      throw new Error('Failed to delete file');
    }
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      // Check if object is in Glacier storage
      const storageClass = await this.checkStorageClass(key);
      
      if (storageClass === 'GLACIER' || storageClass === 'DEEP_ARCHIVE') {
        console.log(`🗄️  Object in Glacier, initiating restore: ${key}`);
        await this.restoreFromGlacier(key);
        
        // For now, return a placeholder URL
        // In production, you'd want to:
        // 1. Return a "restoring" status
        // 2. Poll the restore job
        // 3. Return the presigned URL when ready
        throw new Error('File is in cold storage. Restore initiated, please try again later.');
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
      
    } catch (error) {
      console.error('❌ Error generating presigned URL:', error);
      throw error;
    }
  }

  async getStorageInfo(key: string): Promise<{
    storageClass: string;
    size: number;
    lastModified: Date;
    isRestoring: boolean;
  }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      const response = await this.s3Client.send(command);
      
      return {
        storageClass: response.StorageClass || 'STANDARD',
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        isRestoring: response.Restore?.includes('ongoing-request="true"') || false,
      };
    } catch (error) {
      console.error('❌ Error getting storage info:', error);
      throw error;
    }
  }

  // Helper method to setup lifecycle policies (run once during setup)
  async setupLifecyclePolicy(): Promise<void> {
    // This would typically be done via AWS Console or CLI
    // Including here for completeness
    console.log('📋 Lifecycle policy setup required via AWS Console/CLI');
    console.log('📋 Policy for grwofinance-glacier-policy bucket:');
    console.log('   Day 0-30: S3 Standard');
    console.log('   Day 30-120: Glacier Instant Retrieval');
    console.log('   Day 120-210: Glacier Flexible Retrieval');
    console.log('   Day 210+: Glacier Deep Archive');
  }
}

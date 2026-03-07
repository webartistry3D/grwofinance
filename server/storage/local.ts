import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { StorageDriver, StorageResult } from './types';

export class LocalStorageDriver implements StorageDriver {
  private uploadDir: string;

  constructor() {
    this.uploadDir = join(process.cwd(), 'uploads', 'dev');
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
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
    const filePath = join(this.uploadDir, key);
    
    // Ensure directory exists
    const dir = join(filePath, '..');
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, file);
    
    // Verify file was written successfully
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      throw new Error(`Failed to write file to ${filePath}`);
    }
    
    // Generate URL (this would be served via Express static route)
    const url = `/uploads/dev/${key}`;
    
    console.log(`✅ File uploaded successfully: ${filePath}`);
    console.log(`🔍 File size: ${file.length} bytes`);
    console.log(`🔍 File exists: ${fileExists}`);
    
    return { key, url };
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.uploadDir, key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }
}

import { StorageDriver, StorageResult } from './types';
import { LocalStorageDriver } from './local';
import { S3GlacierDriver } from './s3-glacier';

class StorageAdapter {
  private driver: StorageDriver;

  constructor() {
    const driverType = process.env.STORAGE_DRIVER || 'local';
    
    switch (driverType) {
      case 'local':
        this.driver = new LocalStorageDriver();
        break;
      case 's3-glacier':
        this.driver = new S3GlacierDriver();
        break;
      default:
        throw new Error(`Unsupported storage driver: ${driverType}. Use 'local' or 's3-glacier'`);
    }
  }

  async upload(file: Buffer, filename: string, mimeType: string, userId: string): Promise<StorageResult> {
    return this.driver.upload(file, filename, mimeType, userId);
  }

  async delete(key: string): Promise<void> {
    return this.driver.delete(key);
  }
}

export const storageAdapter = new StorageAdapter();
// export { StorageResult, StorageDriver };

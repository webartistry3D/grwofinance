export interface StorageResult {
  key: string;
  url: string;
}

export interface StorageDriver {
  upload(file: Buffer, filename: string, mimeType: string, userId: string): Promise<StorageResult>;
  delete(key: string): Promise<void>;
}

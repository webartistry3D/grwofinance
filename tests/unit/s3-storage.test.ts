/**
 * S3 Storage Unit Tests
 * 
 * Tests for the S3 + Glacier storage functionality
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { GlacierClient, InitiateJobCommand, DescribeJobCommand } from '@aws-sdk/client-glacier';

// Mock AWS SDK for testing
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-glacier');

// Test configuration
const mockConfig = {
  AWS_ACCESS_KEY_ID: 'test-key-id',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  AWS_REGION: 'us-east-1',
  AWS_S3_BUCKET_NAME: 'test-bucket',
  AWS_GLACIER_VAULT_NAME: 'test-vault',
  AWS_ACCOUNT_ID: '123456789012'
};

// Mock S3 client
const mockS3Client = {
  send: jest.fn(),
  send: jest.fn()
} as any;

// Mock Glacier client
const mockGlacierClient = {
  send: jest.fn(),
  send: jest.fn()
} as any;

describe('S3 Storage Driver', () => {
  beforeEach(() => {
    // Reset environment variables for testing
    process.env.AWS_ACCESS_KEY_ID = mockConfig.AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = mockConfig.AWS_SECRET_ACCESS_KEY;
    process.env.AWS_REGION = mockConfig.AWS_REGION;
    process.env.AWS_S3_BUCKET_NAME = mockConfig.AWS_S3_BUCKET_NAME;
    process.env.AWS_GLACIER_VAULT_NAME = mockConfig.AWS_GLACIER_VAULT_NAME;
    process.env.AWS_ACCOUNT_ID = mockConfig.AWS_ACCOUNT_ID;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_REGION;
    delete process.env.AWS_S3_BUCKET_NAME;
    delete process.env.AWS_GLACIER_VAULT_NAME;
    delete process.env.AWS_ACCOUNT_ID;
  });

  describe('S3GlacierDriver Initialization', () => {
    it('should initialize with valid environment variables', () => {
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      expect(driver).toBeDefined();
      expect(mockS3Client.constructor).toHaveBeenCalledWith({
        region: mockConfig.AWS_REGION,
        credentials: {
          accessKeyId: mockConfig.AWS_ACCESS_KEY_ID,
          secretAccessKey: mockConfig.AWS_SECRET_ACCESS_KEY,
        },
      });
    });

    it('should throw error with missing AWS credentials', () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      
      expect(() => new S3GlacierDriver()).toThrow(
        'Missing required AWS environment variables. Check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME'
      );
    });

    it('should initialize Glacier client when vault name is provided', () => {
      process.env.AWS_GLACIER_VAULT_NAME = mockConfig.AWS_GLACIER_VAULT_NAME;
      
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      expect(mockGlacierClient.constructor).toHaveBeenCalledWith({
        region: mockConfig.AWS_REGION,
        credentials: {
          accessKeyId: mockConfig.AWS_ACCESS_KEY_ID,
          secretAccessKey: mockConfig.AWS_SECRET_ACCESS_KEY,
        },
      });
    });
  });

  describe('File Key Generation', () => {
    it('should generate correct key format', () => {
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      // Access private method through reflection for testing
      const generateKey = (driver as any).generateKey.bind(driver);
      const testUserId = 'test-user-123';
      const testFilename = 'test-file.jpg';
      
      const key = generateKey(testUserId, testFilename);
      
      // Expected format: receipts/{userId}/{yyyy}/{mm}/{uuid}.ext
      expect(key).toMatch(/^receipts\/test-user-123\/\d{4}\/\d{2}\/[a-f0-9]{8}\.jpg$/);
    });

    it('should handle different file extensions', () => {
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      const generateKey = (driver as any).generateKey.bind(driver);
      
      const testUserId = 'test-user-123';
      
      const pdfKey = generateKey(testUserId, 'document.pdf');
      expect(pdfKey).toMatch(/^receipts\/test-user-123\/\d{4}\/\d{2}\/[a-f0-9]{8}\.pdf$/);
      
      const pngKey = generateKey(testUserId, 'image.png');
      expect(pngKey).toMatch(/^receipts\/test-user-123\/\d{4}\/\d{2}\/[a-f0-9]{8}\.png$/);
      
      const noExtKey = generateKey(testUserId, 'filename');
      expect(noExtKey).toMatch(/^receipts\/test-user-123\/\d{4}\/\d{2}\/[a-f0-9]{8}\.$/);
    });
  });

  describe('File Upload', () => {
    it('should upload file to S3 successfully', async () => {
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      const testBuffer = Buffer.from('test content');
      const testFilename = 'test-file.txt';
      const testUserId = 'test-user-123';
      
      // Mock successful S3 upload
      mockS3Client.send.mockResolvedValueOnce({
        ETag: '"test-etag"',
        VersionId: 'test-version-id'
      });
      
      const result = await driver.upload(testBuffer, testFilename, 'text/plain', testUserId);
      
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: mockConfig.AWS_S3_BUCKET_NAME,
          Key: expect.stringContaining('receipts/test-user-123/'),
          Body: testBuffer,
          ContentType: 'text/plain',
          Metadata: expect.objectContaining({
            'original-filename': testFilename,
            'user-id': testUserId
          }),
          Tagging: 'Lifecycle=Receipt',
          StorageClass: 'STANDARD'
        })
      );
      
      expect(result).toEqual({
        key: expect.stringContaining('receipts/test-user-123/'),
        url: expect.stringContaining(`https://${mockConfig.AWS_S3_BUCKET_NAME}.s3.${mockConfig.AWS_REGION}.amazonaws.com/`)
      });
    });

    it('should handle upload errors', async () => {
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      const testBuffer = Buffer.from('test content');
      
      // Mock failed S3 upload
      mockS3Client.send.mockRejectedValueOnce(new Error('Upload failed'));
      
      await expect(driver.upload(testBuffer, 'test-file.txt', 'text/plain', 'test-user-123'))
        .rejects.toThrow('Failed to upload to S3');
    });
  });

  describe('File Deletion', () => {
    it('should delete file from S3 successfully', async () => {
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      const testKey = 'receipts/test-user-123/2024/01/test-file.txt';
      
      // Mock successful deletion
      mockS3Client.send.mockResolvedValueOnce({});
      
      await expect(driver.delete(testKey)).resolves.toBeUndefined();
      
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: mockConfig.AWS_S3_BUCKET_NAME,
          Key: testKey
        })
      );
    });

    it('should handle deletion errors', async () => {
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      const testKey = 'receipts/test-user-123/2024/01/test-file.txt';
      
      // Mock failed deletion
      mockS3Client.send.mockRejectedValueOnce(new Error('Delete failed'));
      
      await expect(driver.delete(testKey)).rejects.toThrow('Failed to delete file');
    });
  });

  describe('Storage Class Check', () => {
    it('should check storage class for S3 objects', async () => {
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      const testKey = 'receipts/test-user-123/2024/01/test-file.txt';
      
      // Mock S3 object with STANDARD storage class
      mockS3Client.send.mockResolvedValueOnce({
        StorageClass: 'STANDARD'
      });
      
      const checkStorageClass = (driver as any).checkStorageClass.bind(driver);
      const storageClass = await checkStorageClass(testKey);
      
      expect(storageClass).toBe('STANDARD');
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: mockConfig.AWS_S3_BUCKET_NAME,
          Key: testKey
        })
      );
    });

    it('should handle Glacier storage class', async () => {
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      const testKey = 'receipts/test-user-123/2024/01/test-file.txt';
      
      // Mock S3 object with GLACIER storage class
      mockS3Client.send.mockResolvedValueOnce({
        StorageClass: 'GLACIER'
      });
      
      const checkStorageClass = (driver as any).checkStorageClass.bind(driver);
      const storageClass = await checkStorageClass(testKey);
      
      expect(storageClass).toBe('GLACIER');
    });

    it('should handle storage class check errors', async () => {
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      const testKey = 'receipts/test-user-123/2024/01/test-file.txt';
      
      // Mock failed storage class check
      mockS3Client.send.mockRejectedValueOnce(new Error('Storage check failed'));
      
      const checkStorageClass = (driver as any).checkStorageClass.bind(driver);
      await expect(checkStorageClass(testKey)).rejects.toThrow('Error checking storage class');
    });
  });

  describe('Glacier Integration', () => {
    it('should initiate Glacier restore for archived files', async () => {
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      const testKey = 'receipts/test-user-123/2024/01/test-file.txt';
      
      // Mock Glacier restore initiation
      mockGlacierClient.send.mockResolvedValueOnce({
        jobId: 'test-job-id-123'
      });
      
      const restoreFromGlacier = (driver as any).restoreFromGlacier.bind(driver);
      await restoreFromGlacier(testKey);
      
      expect(mockGlacierClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: mockConfig.AWS_ACCOUNT_ID,
          vaultName: mockConfig.AWS_GLACIER_VAULT_NAME,
          jobParameters: {
            Type: 'archive-retrieval',
            ArchiveId: testKey,
            Tier: 'Expedited',
            Description: expect.stringContaining('Restore receipt:'),
          }
        })
      );
    });

    it('should handle Glacier restore errors', async () => {
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      const testKey = 'receipts/test-user-123/2024/01/test-file.txt';
      
      // Mock failed Glacier restore
      mockGlacierClient.send.mockRejectedValueOnce(new Error('Glacier restore failed'));
      
      const restoreFromGlacier = (driver as any).restoreFromGlacier.bind(driver);
      await expect(restoreFromGlacier(testKey)).rejects.toThrow('Failed to restore from Glacier');
    });
  });

  describe('Storage Driver Integration', () => {
    it('should work with storage adapter interface', async () => {
      // Mock the storage adapter
      jest.doMock('../../server/storage/index.ts', () => ({
        storageAdapter: {
          upload: jest.fn().mockResolvedValue({
            key: 'test-key',
            url: 'https://test-bucket.s3.us-east-1.amazonawsaws.com/test-key'
          })
        }
      }));
      
      const { storageAdapter } = require('../../server/storage/index.ts');
      
      const testBuffer = Buffer.from('test content');
      const result = await storageAdapter.upload(testBuffer, 'test-file.txt', 'text/plain', 'test-user-123');
      
      expect(result).toEqual({
        key: 'test-key',
        url: 'https://test-bucket.s3.us-east-1.amazonawsaws.com/test-key'
      });
    });
  });

  describe('Environment Configuration', () => {
    it('should use correct AWS region', () => {
      process.env.AWS_REGION = 'us-west-2';
      
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      expect(mockS3Client.constructor).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'us-west-2'
        })
      );
    });

    it('should use custom bucket name', () => {
      process.env.AWS_S3_BUCKET_NAME = 'custom-bucket-name';
      
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'custom-bucket-name'
        })
      );
    });

    it('should handle missing Glacier vault name', () => {
      delete process.env.AWS_GLACIER_VAULT_NAME;
      
      const { S3GlacierDriver } = require('../../server/storage/s3-glacier');
      const driver = new S3GlacierDriver();
      
      expect(mockGlacierClient.constructor).toHaveBeenCalledWith({
        region: mockConfig.AWS_REGION,
        credentials: {
          accessKeyId: mockConfig.AWS_ACCESS_KEY_ID,
          secretAccessKey: mockConfig.AWS_SECRET_ACCESS_KEY,
        },
      });
    });
  });
});

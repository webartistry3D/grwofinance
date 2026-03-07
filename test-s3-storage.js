#!/usr/bin/env node

/**
 * AWS S3 Storage Test Script
 * 
 * This script tests the S3 + Glacier storage functionality
 * to verify the configuration and basic operations.
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_S3_BUCKET_NAME,
  AWS_GLACIER_VAULT_NAME,
  AWS_ACCOUNT_ID,
  STORAGE_DRIVER
} = process.env;

// Test configuration
const TEST_CONFIG = {
  testFileName: `test-${Date.now()}.txt`,
  testFileContent: 'Hello from S3 Storage Test!',
  testUserId: 'test-user-123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Initialize S3 client
function initializeS3Client() {
  try {
    logInfo('Initializing S3 client...');
    
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET_NAME) {
      throw new Error('Missing required AWS credentials or bucket name');
    }

    const s3Client = new S3Client({
      region: AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    logSuccess(`S3 client initialized for bucket: ${AWS_S3_BUCKET_NAME}`);
    logInfo(`Region: ${AWS_REGION || 'us-east-1'}`);
    
    return s3Client;
  } catch (error) {
    logError(`Failed to initialize S3 client: ${error.message}`);
    throw error;
  }
}

// Test file upload
async function testFileUpload(s3Client) {
  try {
    logInfo('Testing file upload...');
    
    const key = `receipts/${TEST_CONFIG.testUserId}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${TEST_CONFIG.testFileName}`;
    
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(TEST_CONFIG.testFileContent),
      ContentType: 'text/plain',
      Metadata: {
        'original-filename': TEST_CONFIG.testFileName,
        'user-id': TEST_CONFIG.testUserId,
        'upload-date': new Date().toISOString(),
        'test-upload': 'true'
      },
      Tagging: 'TestFile=true',
      StorageClass: 'STANDARD'
    });

    const result = await s3Client.send(command);
    
    logSuccess(`File uploaded successfully!`);
    logInfo(`Key: ${key}`);
    logInfo(`ETag: ${result.ETag}`);
    logInfo(`Version ID: ${result.VersionId}`);
    
    const publicUrl = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    logInfo(`Public URL: ${publicUrl}`);
    
    return { key, url: publicUrl };
  } catch (error) {
    logError(`File upload failed: ${error.message}`);
    throw error;
  }
}

// Test file download
async function testFileDownload(s3Client, key) {
  try {
    logInfo('Testing file download...');
    
    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key
    });

    const result = await s3Client.send(command);
    const content = result.Body.toString();
    
    logSuccess(`File downloaded successfully!`);
    logInfo(`Content: ${content}`);
    logInfo(`Content Length: ${result.ContentLength}`);
    logInfo(`Last Modified: ${result.LastModified}`);
    logInfo(`Storage Class: ${result.StorageClass}`);
    
    return content;
  } catch (error) {
    logError(`File download failed: ${error.message}`);
    throw error;
  }
}

// Test file metadata
async function testFileMetadata(s3Client, key) {
  try {
    logInfo('Testing file metadata...');
    
    const command = new HeadObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key
    });

    const result = await s3Client.send(command);
    
    logSuccess(`Metadata retrieved successfully!`);
    logInfo(`Storage Class: ${result.StorageClass}`);
    logInfo(`Content Type: ${result.ContentType}`);
    logInfo(`Metadata: ${JSON.stringify(result.Metadata)}`);
    
    return result;
  } catch (error) {
    logError(`Metadata retrieval failed: ${error.message}`);
    throw error;
  }
}

// Test file deletion
async function testFileDeletion(s3Client, key) {
  try {
    logInfo('Testing file deletion...');
    
    const command = new DeleteObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    
    logSuccess(`File deleted successfully!`);
    logInfo(`Deleted key: ${key}`);
    
    return true;
  } catch (error) {
    logError(`File deletion failed: ${error.message}`);
    throw error;
  }
}

// List bucket contents
async function testBucketListing(s3Client) {
  try {
    logInfo('Testing bucket listing...');
    
    const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
    const command = new ListObjectsV2Command({
      Bucket: AWS_S3_BUCKET_NAME,
      MaxKeys: 10
    });

    const result = await s3Client.send(command);
    
    logSuccess(`Bucket listing successful!`);
    logInfo(`Total objects: ${result.KeyCount || 0}`);
    logInfo(`Objects:`);
    
    if (result.Contents && result.Contents.length > 0) {
      result.Contents.forEach((obj, index) => {
        logInfo(`  ${index + 1}. ${obj.Key} (${obj.Size} bytes, ${new Date(obj.LastModified).toLocaleString()})`);
      });
    }
    
    return result.Contents || [];
  } catch (error) {
    logError(`Bucket listing failed: ${error.message}`);
    throw error;
  }
}

// Test storage driver integration
async function testStorageDriverIntegration() {
  try {
    logInfo('Testing storage driver integration...');
    
    // Import the storage adapter
    const { storageAdapter } = require('./server/storage/index.ts');
    
    // Test upload through storage adapter
    const testBuffer = Buffer.from(TEST_CONFIG.testFileContent);
    const result = await storageAdapter.upload(
      testBuffer,
      TEST_CONFIG.testFileName,
      'text/plain',
      TEST_CONFIG.testUserId
    );
    
    logSuccess(`Storage adapter upload successful!`);
    logInfo(`Storage key: ${result.key}`);
    logInfo(`Storage URL: ${result.url}`);
    
    return result;
  } catch (error) {
    logError(`Storage adapter integration failed: ${error.message}`);
    throw error;
  }
}

// Cleanup test files
async function cleanupTestFiles(s3Client, keys) {
  try {
    logInfo('Cleaning up test files...');
    
    for (const key of keys) {
      await testFileDeletion(s3Client, key);
    }
    
    logSuccess('Test files cleaned up successfully!');
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
  }
}

// Main test function
async function runTests() {
  console.log('\n🚀 Starting AWS S3 Storage Tests\n');
  console.log('='.repeat(50));
  
  try {
    // Check storage Driver
    logInfo(`Current STORAGE_DRIVER: ${STORAGE_DRIVER || 'not set'}`);
    
    if (STORAGE_DRIVER !== 's3-glacier') {
      logWarning('Storage driver is not set to s3-glacier. Set STORAGE_DRIVER=s3-glacier in .env to test S3 functionality.');
      logInfo('Current configuration supports:');
      logInfo('  - local: Local filesystem storage');
      logInfo('  - s3-glacier: AWS S3 + Glacier storage');
      return;
    }
    
    // Initialize S3 client
    const s3Client = initializeS3Client();
    
    // Test 1: File Upload
    console.log('\n📤 Test 1: File Upload');
    console.log('-'.repeat(30));
    const uploadResult = await testFileUpload(s3Client);
    
    // Test 2: File Download
    console.log('\n📥 Test 2: File Download');
    console.log('-'.repeat(30));
    await testFileDownload(s3Client, uploadResult.key);
    
    // Test 3: File Metadata
    console.log('\n📋 Test 3: File Metadata');
    console.log('-'.repeat(30));
    await testFileMetadata(s3Client, uploadResult.key);
    
    // Test 4: Bucket Listing
    console.log('\n📋 Test 4: Bucket Listing');
    console.log('-'.repeat(30));
    const bucketContents = await testBucketListing(s3Client);
    
    // Test 5: Storage Driver Integration
    console.log('\n🔧 Test 5: Storage Driver Integration');
    console.log('-'.repeat(30));
    await testStorageDriverIntegration();
    
    // Test 6: File Deletion
    console.log('\n🗑️ Test 6: File Deletion');
    console.log('-'.repeat(30));
    await testFileDeletion(s3Client, uploadResult.key);
    
    // Cleanup
    await cleanupTestFiles(s3Client, [uploadResult.key]);
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    logSuccess(`  ✓ S3 Client Initialization`);
    logSuccess(`  ✓ File Upload (${TEST_CONFIG.testFileName})`);
    logSuccess(`  ✓ File Download`);
    logSuccess(`  ✓ File Metadata`);
    logSuccess(`  ✓ Bucket Listing (${bucketContents.length} objects found)`);
    logSuccess(`  ✓ Storage Driver Integration`);
    logSuccess(`  ✓ File Deletion`);
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Display configuration info
function displayConfigInfo() {
  console.log('\n📋 Current Configuration:');
  console.log('='.repeat(30));
  logInfo(`Storage Driver: ${STORAGE_DRIVER || 'not set'}`);
  logInfo(`AWS Region: ${AWS_REGION || 'not set'}`);
  logInfo(`S3 Bucket: ${AWS_S3_BUCKET_NAME || 'not set'}`);
  logInfo(`Glacier Vault: ${AWS_GLACIER_VAULT_NAME || 'not set'}`);
  logInfo(`AWS Account ID: ${AWS_ACCOUNT_ID ? 'configured' : 'not set'}`);
  logInfo(`Access Key ID: ${AWS_ACCESS_KEY_ID ? 'configured' : 'not set'}`);
  logInfo(`Secret Access Key: ${AWS_SECRET_ACCESS_KEY ? 'configured' : 'not set'}`);
}

// Check if this is being run directly
if (require.main === module) {
  displayConfigInfo();
  
  if (process.argv.includes('--config')) {
    // Just show configuration and exit
    process.exit(0);
  }
  
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('\n📖 AWS S3 Storage Test Script');
    console.log('\nUsage:');
    console.log('  node test-s3-storage.js [options]');
    console.log('\nOptions:');
    console.log('  --config    Show current configuration');
    console.log('  --help      Show this help message');
    console.log('\nEnvironment Variables Required:');
    console.log('  STORAGE_DRIVER=s3-glacier');
    console.log('  AWS_ACCESS_KEY_ID=your_access_key');
    console.log('  AWS_SECRET_ACCESS_KEY=your_secret_key');
    console.log('  AWS_REGION=us-east-1');
    console.log('  AWS_S3_BUCKET_NAME=your_bucket_name');
    console.log('  AWS_GLACIER_VAULT_NAME=your_vault_name (optional)');
    console.log('  AWS_ACCOUNT_ID=your_account_id (optional)');
    process.exit(0);
  }
  
  runTests();
}

module.exports = {
  runTests,
  displayConfigInfo,
  initializeS3Client,
  testFileUpload,
  testFileDownload,
  testFileMetadata,
  testFileDeletion
};

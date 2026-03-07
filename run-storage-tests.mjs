#!/usr/bin/env node

/**
 * Simple Storage Test Runner
 * 
 * Runs basic S3 storage tests without Jest dependencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const {
  STORAGE_DRIVER,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_S3_BUCKET_NAME,
  AWS_GLACIER_VAULT_NAME,
  AWS_ACCOUNT_ID
} = process.env;

// Test configuration
const testConfig = {
  AWS_ACCESS_KEY_ID: 'test-key-id',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  AWS_REGION: 'us-east-1',
  AWS_S3_BUCKET_NAME: 'test-bucket',
  AWS_GLACIER_VAULT_NAME: 'test-vault',
  AWS_ACCOUNT_ID: '123456789012'
};

// Simple test runner without Jest
async function runBasicTests() {
  logInfo('Running basic S3 storage tests...');
  
  try {
    // Test 1: Check current configuration
    logInfo('Current Configuration:');
    logInfo(`  Storage Driver: ${STORAGE_DRIVER || 'not set'}`);
    logInfo(`  AWS Region: ${AWS_REGION || 'not set'}`);
    logInfo(`  S3 Bucket: ${AWS_S3_BUCKET_NAME || 'not set'}`);
    logInfo(`  AWS Access Key: ${AWS_ACCESS_KEY_ID ? '✅ configured' : '❌ missing'}`);
    logInfo(`  AWS Secret Key: ${AWS_SECRET_ACCESS_KEY ? '✅ configured' : '❌ missing'}`);
    
    // Test 2: Try to import and initialize S3 driver
    logInfo('\n📦 Testing S3 Driver Initialization...');
    
    // Set test environment variables
    process.env.AWS_ACCESS_KEY_ID = testConfig.AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = testConfig.AWS_SECRET_ACCESS_KEY;
    process.env.AWS_REGION = testConfig.AWS_REGION;
    process.env.AWS_S3_BUCKET_NAME = testConfig.AWS_S3_BUCKET_NAME;
    process.env.AWS_GLACIER_VAULT_NAME = testConfig.AWS_GLACIER_VAULT_NAME;
    process.env.AWS_ACCOUNT_ID = testConfig.AWS_ACCOUNT_ID;
    
    let driverInitialized = false;
    try {
      const { S3GlacierDriver } = await import('./server/dist/server/storage/s3-glacier.js');
      const driver = new S3GlacierDriver();
      
      if (driver && typeof driver.upload === 'function') {
        logSuccess('S3GlacierDriver initialized successfully');
        driverInitialized = true;
        
        // Test 3: File key generation
        logInfo('\n🔑 Testing File Key Generation...');
        const generateKey = driver.generateKey?.bind(driver);
        if (generateKey) {
          const testUserId = 'test-user-123';
          const testFilename = 'test-file.jpg';
          const key = generateKey(testUserId, testFilename);
          
          if (key.includes('receipts/test-user-123/')) {
            logSuccess('File key generation works correctly');
          } else {
            logError('File key generation failed');
          }
        } else {
          logError('generateKey method not found');
        }
        
        // Test 4: Method validation
        logInfo('\n🔧 Testing Method Validation...');
        if (typeof driver.upload === 'function' && typeof driver.delete === 'function') {
          logSuccess('All required methods are available');
        } else {
          logError('Missing required methods');
        }
        
      } else {
        logError('S3GlacierDriver initialization failed');
      }
      
    } catch (error) {
      logError(`Driver initialization failed: ${error.message}`);
    }
    
    // Test 5: Switch to S3 storage driver
    if (driverInitialized) {
      logInfo('\n🔄 Testing Storage Driver Switch...');
      
      // Read current .env file
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const envPath = path.join(__dirname, '.env');
      let envContent = '';
      
      try {
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf8');
        }
      } catch (error) {
        logError(`Failed to read .env file: ${error.message}`);
        return;
      }
      
      // Switch to S3 driver
      const lines = envContent.split('\n');
      const updatedLines = lines.map(line => {
        if (line.startsWith('STORAGE_DRIVER=')) {
          return 'STORAGE_DRIVER=s3-glacier';
        }
        return line;
      });
      
      const newEnvContent = updatedLines.join('\n');
      
      try {
        fs.writeFileSync(envPath, newEnvContent, 'utf8');
        logSuccess('Storage driver switched to s3-glacier');
        logWarning('Please restart your server for changes to take effect.');
      } catch (error) {
        logError(`Failed to update .env file: ${error.message}`);
      }
    }
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
  }
}

// Main function
async function main() {
  console.log('\n🚀 S3 Storage Test Runner');
  console.log('='.repeat(50));
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'test':
      return await runBasicTests();
    case 'switch':
      logInfo('Switching to S3 storage driver...');
      // The switch functionality is handled in runBasicTests
      return await runBasicTests();
    case 'status':
      logInfo('Current Configuration:');
      logInfo(`  Storage Driver: ${STORAGE_DRIVER || 'not set'}`);
      logInfo(`  AWS Region: ${AWS_REGION || 'not set'}`);
      logInfo(`  S3 Bucket: ${AWS_S3_BUCKET_NAME || 'not set'}`);
      logInfo(`  AWS Access Key: ${AWS_ACCESS_KEY_ID ? '✅ configured' : '❌ missing'}`);
      logInfo(`  AWS Secret Key: ${AWS_SECRET_ACCESS_KEY ? '✅ configured' : '❌ missing'}`);
      break;
    default:
      logInfo('Usage:');
      logInfo('  node run-storage-tests.mjs [command]');
      logInfo('');
      logInfo('Commands:');
      logInfo('  test    - Run basic S3 storage tests');
      logInfo('  switch  - Switch to S3 storage driver');
      logInfo('  status  - Show current storage configuration');
      break;
  }
}

// Check if this is being run directly
if (import.meta.url) {
  main();
}

export { runBasicTests, main };

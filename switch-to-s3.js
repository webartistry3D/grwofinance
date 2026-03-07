#!/usr/bin/env node

/**
 * Switch to S3 Storage Script
 * 
 * This script switches the storage driver from local to S3-Glacier
 * and runs basic functionality tests.
 */

const fs = require('fs');
const path = require('path');

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

// Read current .env file
function readEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      return fs.readFileSync(envPath, 'utf8');
    }
  } catch (error) {
    logError(`Failed to read .env file: ${error.message}`);
    return null;
  }
}

// Write .env file
function writeEnvFile(content) {
  try {
    const envPath = path.join(__dirname, '.env');
    fs.writeFileSync(envPath, content, 'utf8');
    logSuccess('.env file updated successfully!');
  } catch (error) {
    logError(`Failed to write .env file: ${error.message}`);
  }
}

// Switch storage driver to S3
function switchToS3() {
  logInfo('Switching storage driver to S3-Glacier...');
  
  let envContent = readEnvFile();
  if (!envContent) {
    logError('No .env file found. Please create one first.');
    return false;
  }
  
  // Replace STORAGE_DRIVER line
  const lines = envContent.split('\n');
  const updatedLines = lines.map(line => {
    if (line.startsWith('STORAGE_DRIVER=')) {
      return 'STORAGE_DRIVER=s3-glacier';
    }
    return line;
  });
  
  const newEnvContent = updatedLines.join('\n');
  writeEnvFile(newEnvContent);
  
  logSuccess('Storage driver switched to s3-glacier');
  logWarning('Please restart your server for changes to take effect.');
  
  return true;
}

// Check if AWS credentials are configured
function checkAwsCredentials() {
  const envContent = readEnvFile();
  if (!envContent) {
    logError('No .env file found.');
    return false;
  }
  
  const hasAccessKey = envContent.includes('AWS_ACCESS_KEY_ID=');
  const hasSecretKey = envContent.includes('AWS_SECRET_ACCESS_KEY=');
  const hasBucket = envContent.includes('AWS_S3_BUCKET_NAME=');
  const hasRegion = envContent.includes('AWS_REGION=');
  
  logInfo('AWS Configuration Check:');
  logInfo(`  Access Key ID: ${hasAccessKey ? '✅ configured' : '❌ missing'}`);
  logInfo(`  Secret Access Key: ${hasSecretKey ? '✅ configured' : '❌ missing'}`);
  logInfo(`  S3 Bucket Name: ${hasBucket ? '✅ configured' : '❌ missing'}`);
  logInfo(`  AWS Region: ${hasRegion ? '✅ configured' : '❌ missing'}`);
  
  return hasAccessKey && hasSecretKey && hasBucket && hasRegion;
}

// Show configuration status
function showStatus() {
  const envContent = readEnvFile();
  if (!envContent) {
    logError('No .env file found.');
    return;
  }
  
  logInfo('Current Configuration:');
  const storageDriver = envContent.split('\n')
    .find(line => line.startsWith('STORAGE_DRIVER='))
    ?.split('=')[1] || 'not set';
  
  logInfo(`  Storage Driver: ${storageDriver}`);
  
  if (storageDriver === 's3-glacier') {
    logSuccess('  ✓ Already using S3-Glacier storage');
  } else if (storageDriver === 'local') {
    logWarning('  ✓ Currently using local storage');
  } else {
    logError(`  ✗ Unknown storage driver: ${storageDriver}`);
  }
  
  const awsConfigured = checkAwsCredentials();
  if (awsConfigured) {
    logSuccess('  ✓ AWS credentials are configured');
  } else {
    logWarning('  ⚠ AWS credentials need to be configured');
  }
}

// Main function
function main() {
  console.log('\n🔄 S3 Storage Switch Utility');
  console.log('='.repeat(40));
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'switch':
      return switchToS3();
    case 'status':
      return showStatus();
    case 'check':
      return checkAwsCredentials();
    default:
      logInfo('Usage:');
      logInfo('  node switch-to-s3.js [command]');
      logInfo('');
      logInfo('Commands:');
      logInfo('  switch   - Switch storage driver to S3-Glacier');
      logInfo('  status   - Show current storage configuration');
      logInfo('  check    - Check AWS credentials configuration');
      break;
  }
}

// Check if this is being run directly
if (require.main === module) {
  main();
}

module.exports = {
  switchToS3,
  checkAwsCredentials,
  showStatus
};

// Database cleanup script for income records
// Run this script in your Node.js environment with proper database connection

const { PrismaClient } = require('@prisma/client');

async function cleanupIncomeRecords() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🗑️ Starting income records cleanup...');
    
    // Get all income records
    const incomeRecords = await prisma.income.findMany();
    console.log(`📊 Found ${incomeRecords.length} income records`);
    
    // Get all invoice records
    const invoiceRecords = await prisma.invoice.findMany();
    console.log(`📋 Found ${invoiceRecords.length} invoice records`);
    
    // Option 1: Delete ALL income records
    if (process.argv.includes('--delete-all-income')) {
      const deletedIncome = await prisma.income.deleteMany({});
      console.log(`🗑️ Deleted ${deletedIncome.count} income records`);
    }
    
    // Option 2: Delete ALL invoice records
    if (process.argv.includes('--delete-all-invoices')) {
      const deletedInvoices = await prisma.invoice.deleteMany({});
      console.log(`🗑️ Deleted ${deletedInvoices.count} invoice records`);
    }
    
    // Option 3: Delete records older than X days
    if (process.argv.includes('--delete-older-than')) {
      const daysArg = process.argv.indexOf('--delete-older-than') + 1;
      const days = parseInt(process.argv[daysArg]);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const deletedOldIncome = await prisma.income.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });
      
      const deletedOldInvoices = await prisma.invoice.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });
      
      console.log(`🗑️ Deleted ${deletedOldIncome.count} income records older than ${days} days`);
      console.log(`🗑️ Deleted ${deletedOldInvoices.count} invoice records older than ${days} days`);
    }
    
    // Option 4: Delete specific records by ID
    if (process.argv.includes('--delete-income-id')) {
      const idArg = process.argv.indexOf('--delete-income-id') + 1;
      const incomeId = process.argv[idArg];
      
      const deletedSpecific = await prisma.income.delete({
        where: { id: incomeId }
      });
      
      console.log(`🗑️ Deleted income record: ${incomeId}`);
    }
    
    if (process.argv.includes('--delete-invoice-id')) {
      const idArg = process.argv.indexOf('--delete-invoice-id') + 1;
      const invoiceId = process.argv[idArg];
      
      const deletedInvoice = await prisma.invoice.delete({
        where: { id: invoiceId }
      });
      
      console.log(`🗑️ Deleted invoice record: ${invoiceId}`);
    }
    
    console.log('✅ Cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Show usage
if (process.argv.includes('--help')) {
  console.log(`
🗑️ Income Records Cleanup Script

Usage:
  node cleanup-income-records.js [options]

Options:
  --delete-all-income      Delete ALL income records
  --delete-all-invoices    Delete ALL invoice records
  --delete-older-than X    Delete records older than X days
  --delete-income-id ID    Delete specific income record by ID
  --delete-invoice-id ID   Delete specific invoice record by ID
  --help                  Show this help message

Examples:
  node cleanup-income-records.js --delete-all-income
  node cleanup-income-records.js --delete-all-invoices
  node cleanup-income-records.js --delete-older-than 30
  node cleanup-income-records.js --delete-income-id "abc-123-def"
  node cleanup-income-records.js --delete-invoice-id "xyz-789-uvw"
  `);
  process.exit(0);
}

cleanupIncomeRecords();

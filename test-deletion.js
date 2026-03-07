/**
 * Test Script for Debugging Record Deletion
 * 
 * This script tests the deletion functionality directly against the database
 * to identify any issues with the deleteInvoice method.
 */

import { db } from './server/db.js';
import { eq, and } from 'drizzle-orm';
import { invoices, whtTransactions } from './shared/schema.js';

async function testDeletion() {
  console.log('🧪 Starting deletion test script...\n');
  
  try {
    // Step 1: Get all invoices to see what we have
    console.log('📋 Step 1: Fetching all invoices...');
    const allInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, '6edf4b6e-2b0a-4e50-a7cf-bc369c67dfa8')); // Using the user ID from logs
    
    console.log(`📊 Found ${allInvoices.length} invoices:`);
    allInvoices.forEach(inv => {
      console.log(`  - ID: ${inv.id}, Number: ${inv.invoiceNumber}, Status: ${inv.status}`);
    });
    
    if (allInvoices.length === 0) {
      console.log('❌ No invoices found to test deletion');
      return;
    }
    
    // Step 2: Test deletion of first invoice
    const firstInvoice = allInvoices[0];
    console.log(`\n🗑️ Step 2: Testing deletion of invoice ${firstInvoice.invoiceNumber} (ID: ${firstInvoice.id})`);
    
    // Check for related WHT transactions first
    console.log('📋 Step 2a: Checking for related WHT transactions...');
    const relatedWHT = await db
      .select()
      .from(whtTransactions)
      .where(eq(whtTransactions.invoiceId, firstInvoice.id));
    
    console.log(`📊 Found ${relatedWHT.length} related WHT transactions:`);
    if (relatedWHT.length > 0) {
      relatedWHT.forEach(wht => {
        console.log(`  - WHT ID: ${wht.id}, Amount: ${wht.whtAmount}`);
      });
    }
    
    // Step 3: Attempt deletion using our method
    console.log('🔄 Step 3: Calling deleteInvoice method...');
    try {
      const deleteResult = await deleteInvoice(firstInvoice.id, '6edf4b6e-2b0a-4e50-a7cf-bc369c67dfa8');
      console.log(`✅ Delete result: ${deleteResult}`);
    } catch (error) {
      console.error(`❌ Delete failed with error:`, error.message);
    }
    
    // Step 4: Verify deletion
    console.log('\n🔍 Step 4: Verifying deletion...');
    const remainingInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, '6edf4b6e-2b0a-4e50-a7cf-bc369c67dfa8'));
    
    console.log(`📊 Remaining invoices: ${remainingInvoices.length}`);
    const deletedInvoice = remainingInvoices.find(inv => inv.id === firstInvoice.id);
    
    if (deletedInvoice) {
      console.log('❌ DELETION FAILED: Invoice still exists in database');
    } else {
      console.log('✅ DELETION SUCCESS: Invoice removed from database');
    }
    
    // Step 5: Check WHT transactions
    console.log('\n🔍 Step 5: Checking WHT transactions after deletion...');
    const remainingWHT = await db
      .select()
      .from(whtTransactions)
      .where(eq(whtTransactions.invoiceId, firstInvoice.id));
    
    console.log(`📊 Remaining WHT transactions: ${remainingWHT.length}`);
    if (remainingWHT.length > 0) {
      console.log('❌ WHT TRANSACTIONS NOT DELETED: Orphaned records remain');
    } else {
      console.log('✅ WHT TRANSACTIONS DELETED: No orphaned records');
    }
    
  } catch (error) {
    console.error('💥 Test script failed:', error.message);
    console.error(error.stack);
  }
}

// Import our deleteInvoice method for testing
async function deleteInvoice(id, userId) {
  console.log(`🔄 Starting invoice deletion process:`, { invoiceId: id, userId });
  
  try {
    // First check if invoice exists and get related WHT transactions
    const existingInvoice = await db
      .select()
        .from(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
        .limit(1);
    
    if (!existingInvoice || existingInvoice.length === 0) {
      console.log(`❌ Invoice not found:`, { invoiceId: id, userId });
      return false;
    }
    
    console.log(`📋 Found invoice:`, { invoiceId: id, invoiceNumber: existingInvoice[0].invoiceNumber });
    
    // Check for related WHT transactions
    const relatedWHT = await db
      .select()
        .from(whtTransactions)
        .where(eq(whtTransactions.invoiceId, id));
    
    console.log(`📊 Related WHT transactions found:`, { invoiceId: id, count: relatedWHT.length });
    
    if (relatedWHT && relatedWHT.length > 0) {
      console.log(`🔄 Deleting ${relatedWHT.length} related WHT transactions first...`);
      
      // Delete related WHT transactions to avoid foreign key constraint
      const whtDeleteResult = await db
        .delete(whtTransactions)
        .where(eq(whtTransactions.invoiceId, id));
      
      console.log(`📋 WHT transactions deleted:`, { 
        invoiceId: id, 
        deletedCount: whtDeleteResult.rowCount,
        success: (whtDeleteResult.rowCount ?? 0) > 0
      });
      
      // Wait a moment for the deletion to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Then delete the invoice
    console.log(`🔄 Now deleting invoice:`, { invoiceId: id });
    const result = await db
      .delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
    
    console.log(`📋 Invoice deletion result:`, { 
      invoiceId: id, 
      deleted: (result.rowCount ?? 0) > 0,
      rowCount: result.rowCount
    });
    
    return (result.rowCount ?? 0) > 0;
    
  } catch (error) {
    console.error(`💥 Critical error in deleteInvoice:`, { 
      invoiceId: id, 
      userId: userId, 
      error: error.message || error,
      stack: error.stack
    });
    throw error;
  }
}

// Run the test
testDeletion()
  .then(() => {
    console.log('\n🎯 Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });

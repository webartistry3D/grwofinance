const { Storage } = require('./server/storage');

async function testDeleteLogic() {
  console.log('🧪 Testing delete logic directly...');
  
  try {
    const storage = new Storage();
    
    // First, get all invoices to see what we have
    const allInvoices = await storage.getAllInvoices('test-user-id');
    console.log('📋 All invoices:', allInvoices.length);
    
    if (allInvoices.length > 0) {
      const firstInvoice = allInvoices[0];
      console.log('🔍 First invoice:', {
        id: firstInvoice.id,
        invoiceNumber: firstInvoice.invoiceNumber,
        clientName: firstInvoice.clientName
      });
      
      // Try to delete the first invoice
      console.log('🗑️  Attempting to delete invoice:', firstInvoice.id);
      const deleteResult = await storage.deleteInvoice(firstInvoice.id, 'test-user-id');
      console.log('✅ Delete result:', deleteResult);
      
      // Check if it's actually deleted
      const deletedInvoice = await storage.getInvoiceById(firstInvoice.id, 'test-user-id');
      console.log('🔍 Invoice after deletion:', deletedInvoice);
      
      // Get all invoices again to see the count
      const remainingInvoices = await storage.getAllInvoices('test-user-id');
      console.log('📊 Remaining invoices:', remainingInvoices.length);
    } else {
      console.log('❌ No invoices found to test with');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDeleteLogic();

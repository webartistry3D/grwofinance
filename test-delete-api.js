// Test the delete API endpoint directly
async function testDeleteAPI() {
  console.log('🧪 Testing delete API directly...');
  
  try {
    // First, get all invoices to find one to delete
    const getResponse = await fetch('http://localhost:5173/api/invoices', {
      method: 'GET',
      headers: {
        'Cookie': 'connect.sid=test-session' // You'll need to authenticate properly
      }
    });
    
    if (!getResponse.ok) {
      console.log('❌ Failed to get invoices:', getResponse.status);
      return;
    }
    
    const invoices = await getResponse.json();
    console.log('📋 Found invoices:', invoices.length);
    
    if (invoices.length > 0) {
      const firstInvoice = invoices[0];
      console.log('🔍 First invoice:', {
        id: firstInvoice.id,
        invoiceNumber: firstInvoice.invoiceNumber,
        clientName: firstInvoice.clientName
      });
      
      // Try to delete the first invoice
      console.log('🗑️  Attempting to delete invoice:', firstInvoice.id);
      const deleteResponse = await fetch(`http://localhost:5173/api/invoices/${firstInvoice.id}`, {
        method: 'DELETE',
        headers: {
          'Cookie': 'connect.sid=test-session' // You'll need to authenticate properly
        }
      });
      
      console.log('📊 Delete response status:', deleteResponse.status);
      console.log('📊 Delete response text:', await deleteResponse.text());
      
      // Check if it's actually deleted by getting invoices again
      const getAfterResponse = await fetch('http://localhost:5173/api/invoices', {
        method: 'GET',
        headers: {
          'Cookie': 'connect.sid=test-session'
        }
      });
      
      if (getAfterResponse.ok) {
        const remainingInvoices = await getAfterResponse.json();
        console.log('📊 Remaining invoices:', remainingInvoices.length);
      }
    } else {
      console.log('❌ No invoices found to test with');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDeleteAPI();

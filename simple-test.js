/**
 * Simple Deletion Test
 * Tests if we can delete invoices directly via API
 */

console.log('🧪 Starting simple deletion test...');

// Test 1: Try to delete an invoice via API call
async function testDeleteViaAPI() {
  try {
    console.log('📋 Testing API deletion...');
    
    const response = await fetch('http://localhost:5173/api/invoices/20633252-57aa-4fc2-87d4-09bc2529c109', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session_id=your-session-id-here' // You'll need to get actual session ID
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response text:', await response.text());
    
    if (response.status === 204) {
      console.log('✅ API deletion successful');
    } else {
      console.log('❌ API deletion failed');
    }
    
  } catch (error) {
    console.error('💥 API test failed:', error.message);
  }
}

// Test 2: Check if invoice still exists
async function checkInvoiceExists() {
  try {
    console.log('🔍 Checking if invoice still exists...');
    
    const response = await fetch('http://localhost:5173/api/invoices/20633252-57aa-4fc2-87d4-09bc2529c109', {
      headers: {
        'Cookie': 'session_id=your-session-id-here'
      }
    });
    
    if (response.status === 200) {
      const invoices = await response.json();
      const exists = invoices.some(inv => inv.id === '20633252-57aa-4fc2-87d4-09bc2529c109');
      
      if (exists) {
        console.log('❌ Invoice still exists in API - deletion failed');
      } else {
        console.log('✅ Invoice deleted from API - deletion successful');
      }
    } else {
      console.log('❌ Failed to check invoice status');
    }
    
  } catch (error) {
    console.error('💥 Check failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testDeleteViaAPI();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  await checkInvoiceExists();
  
  console.log('\n🎯 Simple test completed!');
}

runTests().catch(console.error);

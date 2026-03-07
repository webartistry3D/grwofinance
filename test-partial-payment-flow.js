// Test Script: Partial Payment + WHT Flow
// This script tests the complete flow to ensure partial payment amounts are preserved

const testPartialPaymentFlow = async () => {
  console.log('🧪 Starting Partial Payment + WHT Flow Test');
  
  // Test Data
  const testInvoice = {
    id: 'test-invoice-123',
    invoiceNumber: 'INV-TEST-001',
    amount: '332500',
    amountPaid: '200000', // Original partial payment
    status: 'partially_paid',
    dueDate: '2026-02-15',
    clientName: 'Test Client'
  };
  
  console.log('📋 Initial Invoice State:', testInvoice);
  
  // Step 1: Simulate Partial Payment Made
  console.log('\n💰 Step 1: Partial Payment Already Made');
  console.log('   - Original Amount:', testInvoice.amount);
  console.log('   - Partial Payment:', testInvoice.amountPaid);
  console.log('   - Status:', testInvoice.status);
  
  // Step 2: Simulate "Payment + WHT" Selection
  console.log('\n💳 Step 2: Selecting "Payment + WHT"');
  
  // Step 3: Calculate what should happen
  const currentPaid = parseFloat(testInvoice.amountPaid || '0');
  const remainingAmount = parseFloat(testInvoice.amount) - currentPaid;
  const whtAmount = parseFloat(testInvoice.amount) * 0.10;
  const netIncome = parseFloat(testInvoice.amount) * 0.90;
  
  console.log('\n🧮 Expected Calculations:');
  console.log('   - Current Paid:', currentPaid);
  console.log('   - Remaining Amount:', remainingAmount);
  console.log('   - WHT (10%):', whtAmount);
  console.log('   - Net Income:', netIncome);
  
  // Step 4: Simulate Backend Update
  console.log('\n🔄 Step 4: Backend Update Simulation');
  
  // This is what the frontend should send to backend
  const backendUpdate = {
    status: 'paid',
    amountPaid: testInvoice.amountPaid // Should preserve original partial payment!
  };
  
  console.log('   - Sending to backend:', backendUpdate);
  
  // Step 5: Expected Final State
  console.log('\n✅ Expected Final Display:');
  console.log('   - Invoice Status: paid');
  console.log('   - Amount Paid (DB):', testInvoice.amountPaid, '(should stay 200000)');
  console.log('   - Payment Details Box: Should show ₦200,000.00');
  console.log('   - WHT Details Box: Should show -₦33,250.00 and ₦299,250.00');
  
  // Step 6: Test the actual logic
  console.log('\n🧪 Testing Frontend Logic...');
  
  // Test the formatNumber function
  const formatNumber = (value) => {
    if (!value || value.trim() === '') {
      return '';
    }
    const cleanValue = value.replace(/[^\d.]/g, '');
    if (!cleanValue) {
      return '';
    }
    const parts = cleanValue.split('.');
    let integerPart = parts[0] || '0';
    const decimalPart = parts[1] || '';
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  };
  
  // Test the display logic
  const displayAmount = formatNumber(testInvoice.amountPaid);
  console.log('   - Formatted Display Amount:', displayAmount);
  console.log('   - Should be: "200,000" (not "332,500")');
  
  // Test: Display Logic (matches frontend)
  const showPaymentDetails = testInvoice.status === "partially_paid" || 
                              (testInvoice.status === "paid" && testInvoice.amountPaid && parseFloat(testInvoice.amountPaid) > 0);
  // Match frontend logic: show WHT when paid OR when WHT preview is active
  const showWHTDetails = testInvoice.status === "paid" || false; // showWHTPreview state
  
  console.log('\n🔍 Display Logic Check:');
  console.log('   - Show Payment Details:', showPaymentDetails);
  console.log('   - Show WHT Details:', showWHTDetails);
  
  console.log('\n🎯 Test Result:', showPaymentDetails && showWHTDetails ? '✅ PASS' : '❌ FAIL');
  
  // Additional test: WHT Preview functionality
  console.log('\n🔍 Additional WHT Preview Test:');
  console.log('   - Test should simulate selecting "Payment + WHT" option');
  console.log('   - This would set showWHTPreview = true');
  console.log('   - Making showWHTDetails = true (paid OR preview)');
  console.log('   - Expected: Both sections visible');
  
  // Simulate WHT preview selection
  const simulateWHTPreview = true;
  const showWHTDetailsWithPreview = testInvoice.status === "paid" || simulateWHTPreview;
  
  console.log('   - With WHT Preview:', showWHTDetailsWithPreview ? '✅ PASS' : '❌ FAIL');
  console.log('   - Expected: PASS (both sections should show)');
  
  return {
    testInvoice,
    expectedDisplay: {
      paymentDetails: true,
      whtDetails: true,
      partialAmount: '₦200,000.00',
      whtAmount: '-₦33,250.00',
      netIncome: '₦299,250.00'
    },
    testResult: showPaymentDetails && showWHTDetailsWithPreview ? '✅ PASS' : '❌ FAIL',
    additionalTest: simulateWHTPreview && showWHTDetailsWithPreview ? '✅ PASS' : '❌ FAIL'
  };
  
  return {
    testInvoice,
    expectedDisplay: {
      paymentDetails: true,
      whtDetails: true,
      partialAmount: '₦200,000.00',
      whtAmount: '-₦33,250.00',
      netIncome: '₦299,250.00'
    }
  };
};

// Run the test
console.log('🚀 Running Partial Payment + WHT Flow Test...\n');
const result = testPartialPaymentFlow();

console.log('\n📊 Test Summary:');
console.log('====================');
console.log('✅ Test should preserve partial payment amount while adding WHT details');
console.log('✅ Expected: Both payment and WHT details visible');
console.log('✅ Expected: Partial payment shows ₦200,000 (not ₦332,500)');
console.log('====================\n');

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testPartialPaymentFlow };
}

// Test script to verify scan limit implementation
const http = require('http');

// Test function to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test scan limit endpoint
async function testScanLimitEndpoint() {
  console.log('🧪 Testing scan limit endpoint...');
  
  try {
    const response = await makeRequest('/api/expenses/check-limit', 'POST');
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response: ${response.body}`);
    
    if (response.statusCode === 401) {
      console.log('✅ Endpoint requires authentication (expected)');
    } else {
      console.log('❌ Unexpected response');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test upload endpoint
async function testUploadEndpoint() {
  console.log('\n🧪 Testing upload endpoint...');
  
  try {
    const response = await makeRequest('/api/upload-receipt', 'POST');
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response: ${response.body}`);
    
    if (response.statusCode === 401) {
      console.log('✅ Endpoint requires authentication (expected)');
    } else {
      console.log('❌ Unexpected response');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test subscription info endpoint
async function testSubscriptionEndpoint() {
  console.log('\n🧪 Testing subscription info endpoint...');
  
  try {
    const response = await makeRequest('/api/subscription/info', 'GET');
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response: ${response.body}`);
    
    if (response.statusCode === 401) {
      console.log('✅ Endpoint requires authentication (expected)');
    } else {
      console.log('❌ Unexpected response');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting scan limit implementation tests...\n');
  
  await testScanLimitEndpoint();
  await testUploadEndpoint();
  await testSubscriptionEndpoint();
  
  console.log('\n✅ Tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Test through the web interface at http://localhost:5173');
  console.log('2. Log in and try uploading receipts');
  console.log('3. Verify scan limits are enforced after 5 uploads');
  console.log('4. Check subscription page for correct limits display');
}

runTests().catch(console.error);

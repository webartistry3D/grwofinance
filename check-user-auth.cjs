const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://grwofinance:grwofinance1706@localhost:5432/grwofinance'
});

async function checkUserAuth() {
  try {
    console.log('Checking test user authentication data...');
    
    // Check if test user exists
    const userResult = await pool.query('SELECT id, email, password, created_at FROM users WHERE email = $1', ['user@example.com']);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Test user user@example.com NOT found in database');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ Test user found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Password hash exists:', !!user.password);
    console.log('  Password hash length:', user.password ? user.password.length : 0);
    console.log('  Created at:', user.created_at);
    
    // Check if there are any session tokens or auth records
    const sessionResult = await pool.query('SELECT * FROM sessions WHERE user_id = $1', [user.id]);
    console.log('📋 Active sessions:', sessionResult.rows.length);
    
    // Check auth logs if table exists
    try {
      const authResult = await pool.query('SELECT * FROM auth_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [user.id]);
      console.log('🔐 Recent auth attempts:', authResult.rows.length);
      authResult.rows.forEach(log => {
        console.log('  -', log.created_at, log.action, log.success);
      });
    } catch (err) {
      console.log('ℹ️  No auth_logs table found');
    }
    
  } catch (error) {
    console.error('❌ Error checking user auth:', error);
  } finally {
    await pool.end();
  }
}

checkUserAuth();

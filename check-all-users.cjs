const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://grwofinance:grwofinance1706@localhost:5432/grwofinance'
});

async function checkAllUsers() {
  try {
    console.log('Checking all users in database...');
    
    const result = await pool.query('SELECT id, email, is_admin, is_active, created_at FROM users ORDER BY created_at DESC');
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`✅ Found ${result.rows.length} users:`);
    result.rows.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}, Admin: ${user.is_admin}, Active: ${user.is_active}, Created: ${user.created_at})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await pool.end();
  }
}

checkAllUsers();

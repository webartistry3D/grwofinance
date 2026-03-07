const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://grwofinance:grwofinance1706@localhost:5432/grwofinance'
});

async function checkUsers() {
  try {
    const result = await pool.query('SELECT COUNT(*) as total_users FROM users');
    console.log('Total users:', result.rows[0].total_users);
    
    if (result.rows[0].total_users > 0) {
      const users = await pool.query(`
        SELECT id, email, first_name, last_name, is_admin, is_active, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      
      console.log('\nRecent users:');
      users.rows.forEach(user => {
        console.log(`ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}, Admin: ${user.is_admin}, Active: ${user.is_active}, Created: ${user.created_at}`);
      });
    }
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await pool.end();
  }
}

checkUsers();

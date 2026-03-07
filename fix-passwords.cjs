const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://grwofinance:grwofinance1706@localhost:5432/grwofinance'
});

async function fixPasswords() {
  try {
    // Get current user data
    const result = await pool.query(`
      SELECT id, email, password 
      FROM users 
      WHERE email IN ('test@example.com', 'test2@example.com', 'new@user1.com')
    `);
    
    console.log('Found users to fix:');
    result.rows.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Current password: ${user.password.substring(0, 20)}...`);
    });
    
    // Update passwords with proper hashing
    const testUsers = [
      { email: 'test@example.com', password: 'UserPassword123' },
      { email: 'test2@example.com', password: 'UserPassword123' },
      { email: 'new@user1.com', password: 'UserPassword123' }
    ];
    
    for (const testUser of testUsers) {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      await pool.query(`
        UPDATE users 
        SET password = $1 
        WHERE email = $2
      `, [hashedPassword, testUser.email]);
      
      console.log(`✓ Updated password for ${testUser.email}`);
    }
    
    // Verify the updates
    const verifyResult = await pool.query(`
      SELECT id, email, password 
      FROM users 
      WHERE email IN ('test@example.com', 'test2@example.com', 'new@user1.com')
    `);
    
    console.log('\nUpdated users:');
    verifyResult.rows.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Hashed: ${user.password.substring(0, 20)}...`);
    });
    
  } catch (error) {
    console.error('Error fixing passwords:', error);
  } finally {
    await pool.end();
  }
}

fixPasswords();

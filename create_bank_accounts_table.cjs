const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createBankAccountsTable() {
  try {
    const client = await pool.connect();
    console.log('Connected to database');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bank_name VARCHAR(255) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        account_type VARCHAR(50) DEFAULT 'savings',
        currency VARCHAR(10) DEFAULT 'NGN',
        is_default BOOLEAN DEFAULT false,
        include_in_invoice BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
    `;
    
    await client.query(createTableSQL);
    console.log('Bank accounts table created successfully!');
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error creating bank accounts table:', error);
    process.exit(1);
  }
}

createBankAccountsTable();

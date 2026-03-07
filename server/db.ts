// Import pg properly in ESM
import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Initialize database tables that might be missing
export async function initializeDatabase() {
  try {
    console.log("🔍 Checking database tables...");
    
    // Create WHT transactions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wht_transactions (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id),
          invoice_id UUID REFERENCES invoices(id),
          invoice_number TEXT NOT NULL,
          client_name TEXT NOT NULL,
          invoice_amount DECIMAL(10, 2) NOT NULL,
          wht_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.1,
          wht_amount DECIMAL(10, 2) NOT NULL,
          net_amount DECIMAL(10, 2) NOT NULL,
          transaction_date TIMESTAMP DEFAULT NOW() NOT NULL,
          payment_method TEXT DEFAULT 'Bank Transfer',
          status TEXT DEFAULT 'deducted' CHECK (status IN ('deducted', 'paid_to_firs', 'refunded')),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create indexes for performance - handle permission errors gracefully
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_wht_user_id ON wht_transactions(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_wht_invoice_id ON wht_transactions(invoice_id);`,
      `CREATE INDEX IF NOT EXISTS idx_wht_transaction_date ON wht_transactions(transaction_date);`,
      `CREATE INDEX IF NOT EXISTS idx_wht_status ON wht_transactions(status);`
    ];
    
    for (const query of indexQueries) {
      try {
        await pool.query(query);
      } catch (indexError: any) {
        // Log index creation errors but don't fail the whole initialization
        if (indexError.code === '42501') { // Permission denied
          console.warn(`⚠️  Index creation skipped due to permissions: ${query}`);
        } else {
          console.warn(`⚠️  Index creation failed: ${indexError.message}`);
        }
      }
    }
    
    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize database tables:", error);
    // Don't throw error - let server continue even if table creation fails
    // The table might already exist with different permissions
  }
}

/*import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });*/

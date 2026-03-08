-- Add invoice tracking fields to users table
ALTER TABLE users 
ADD COLUMN monthly_invoices_used TEXT DEFAULT '0' NOT NULL,
ADD COLUMN last_invoice_reset_date TIMESTAMP DEFAULT NOW() NOT NULL;

-- Create index for better performance on invoice limits
CREATE INDEX IF NOT EXISTS idx_users_monthly_invoices_used ON users(monthly_invoices_used);

-- Update existing users to have default values
UPDATE users 
SET monthly_invoices_used = '0', 
    last_invoice_reset_date = NOW() 
WHERE monthly_invoices_used IS NULL OR last_invoice_reset_date IS NULL;

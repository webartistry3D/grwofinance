-- Migration script for subscription privilege enforcement
-- Run these commands to update your database schema

-- Add invoice tracking fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS monthly_invoices_used TEXT DEFAULT '0' NOT NULL,
ADD COLUMN IF NOT EXISTS last_invoice_reset_date TIMESTAMP DEFAULT NOW() NOT NULL;

-- Add savings goals tracking field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS savings_goals_count INTEGER DEFAULT 0 NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_monthly_invoices_used ON users(monthly_invoices_used);
CREATE INDEX IF NOT EXISTS idx_users_savings_goals_count ON users(savings_goals_count);

-- Update existing users to have default values
UPDATE users 
SET monthly_invoices_used = '0', 
    last_invoice_reset_date = NOW() 
WHERE monthly_invoices_used IS NULL OR last_invoice_reset_date IS NULL;

UPDATE users 
SET savings_goals_count = 0 
WHERE savings_goals_count IS NULL;

-- Verify the changes
SELECT 
    id,
    email,
    subscription_plan,
    monthly_scans_used,
    monthly_invoices_used,
    savings_goals_count
FROM users 
LIMIT 5;

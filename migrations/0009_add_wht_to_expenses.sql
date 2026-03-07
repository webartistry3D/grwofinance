-- Add missing WHT fields to expenses table
-- This migration adds WHT tracking to expenses for proper tax compliance

-- Step 1: Add WHT fields to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS wht_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL, -- WHT deducted from expense
ADD COLUMN IF NOT EXISTS wht_rate DECIMAL(5, 4) DEFAULT 0.0000 NOT NULL, -- WHT rate on expense
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL; -- Amount after WHT deduction

-- Step 2: Update existing expenses to calculate net amount (amount - WHT)
-- For now, set net_amount = amount since most expenses don't have WHT
UPDATE expenses 
SET net_amount = amount 
WHERE net_amount = 0 AND amount > 0;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN expenses.wht_amount IS 'WHT deducted from expense payments';
COMMENT ON COLUMN expenses.wht_rate IS 'WHT rate applied to expense (5%, 10%, etc.)';
COMMENT ON COLUMN expenses.net_amount IS 'Amount after WHT deduction';

-- Step 4: Verify the new structure
SELECT 
    'expenses' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses' 
    AND column_name IN ('vat_amount', 'vat_rate', 'wht_amount', 'wht_rate', 'net_amount')
ORDER BY column_name;

-- Step 5: Verify data integrity
SELECT 
    COUNT(*) as total_expenses,
    COUNT(CASE WHEN vat_amount > 0 THEN 1 END) as with_vat,
    COUNT(CASE WHEN wht_amount > 0 THEN 1 END) as with_wht,
    ROUND(SUM(vat_amount), 2) as total_vat,
    ROUND(SUM(wht_amount), 2) as total_wht,
    ROUND(SUM(amount), 2) as total_amount,
    ROUND(SUM(net_amount), 2) as total_net_amount
FROM expenses;

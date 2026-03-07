-- Corrected migration to properly separate VAT and WHT
-- This fixes the previous migration and ensures proper tax compliance

-- Step 1: Remove incorrect VAT fields from income table (should only have WHT)
ALTER TABLE income DROP COLUMN IF EXISTS vat_amount;

-- Step 2: Add proper WHT fields to income table
ALTER TABLE income 
ADD COLUMN IF NOT EXISTS wht_rate DECIMAL(5, 4) DEFAULT 0.0000 NOT NULL; -- WHT rate (5%, 10%, etc.)

-- Step 3: Add VAT tracking to expenses table (for input VAT)
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL, -- VAT paid on purchases (input VAT)
ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5, 4) DEFAULT 0.0000 NOT NULL; -- VAT rate on expense

-- Step 4: Update income records - remove VAT calculations, keep only WHT logic
UPDATE income 
SET 
    gross_amount = ROUND(amount / (1 - COALESCE(wht_rate, 0)), 2), -- Calculate gross before WHT
    wht_amount = ROUND(amount * COALESCE(wht_rate, 0) / (1 - COALESCE(wht_rate, 0)), 2), -- Calculate WHT amount
    net_amount = amount -- Current amount is already after WHT
WHERE gross_amount > 0 AND amount > 0;

-- Step 5: Update expense records - add VAT tracking for tax-deductible expenses
UPDATE expenses 
SET 
    vat_amount = ROUND(amount * 0.075, 2), -- Assume 7.5% VAT on tax-deductible expenses
    vat_rate = 0.075
WHERE category = 'Tax Deductible' AND vat_amount = 0 AND amount > 0;

-- Step 6: Update comments for proper documentation
COMMENT ON COLUMN invoices.vat_amount IS 'VAT collected on sales (output VAT)';
COMMENT ON COLUMN invoices.vat_rate IS 'VAT rate on sales (7.5%)';
COMMENT ON COLUMN invoices.net_amount IS 'Amount before VAT (base amount)';
COMMENT ON COLUMN invoices.vat_paid IS 'VAT remitted to tax authority';

COMMENT ON COLUMN income.gross_amount IS 'Amount before WHT deduction';
COMMENT ON COLUMN income.wht_amount IS 'WHT deducted at source';
COMMENT ON COLUMN income.wht_rate IS 'WHT rate (5%, 10%, etc.)';
COMMENT ON COLUMN income.net_amount IS 'Amount after WHT deduction';

COMMENT ON COLUMN expenses.vat_amount IS 'VAT paid on purchases (input VAT)';
COMMENT ON COLUMN expenses.vat_rate IS 'VAT rate on expense';

-- Step 7: Verify the corrected structure
SELECT 
    'invoices' as table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'invoices' 
    AND column_name IN ('vat_amount', 'vat_rate', 'net_amount', 'vat_paid')
UNION ALL
SELECT 
    'income' as table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'income' 
    AND column_name IN ('gross_amount', 'wht_amount', 'wht_rate', 'net_amount')
UNION ALL
SELECT 
    'expenses' as table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
    AND column_name IN ('vat_amount', 'vat_rate')
ORDER BY table_name, column_name;

-- Step 8: Verify data separation
SELECT 
    '=== VAT Tracking ===' as section,
    'Invoices (Output VAT)' as description,
    COUNT(*) as total_records,
    COUNT(CASE WHEN vat_amount > 0 THEN 1 END) as with_vat,
    ROUND(SUM(vat_amount), 2) as total_vat
FROM invoices
WHERE vat_amount > 0
UNION ALL
SELECT 
    '=== VAT Tracking ===' as section,
    'Expenses (Input VAT)' as description,
    COUNT(*) as total_records,
    COUNT(CASE WHEN vat_amount > 0 THEN 1 END) as with_vat,
    ROUND(SUM(vat_amount), 2) as total_vat
FROM expenses
WHERE vat_amount > 0
UNION ALL
SELECT 
    '=== WHT Tracking ===' as section,
    'Income (WHT Deducted)' as description,
    COUNT(*) as total_records,
    COUNT(CASE WHEN wht_amount > 0 THEN 1 END) as with_wht,
    ROUND(SUM(wht_amount), 2) as total_wht
FROM income
WHERE wht_amount > 0;

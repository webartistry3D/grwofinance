-- Safe migration to add VAT/WHT columns without data loss
-- This migration adds new columns with proper defaults and updates existing records

-- Step 1: Add new columns to invoices table with DEFAULT values
ALTER TABLE invoices 
ADD COLUMN vat_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN vat_rate DECIMAL(5, 4) DEFAULT 0.075 NOT NULL,
ADD COLUMN net_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN vat_paid DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Step 2: Add new columns to income table with DEFAULT values
ALTER TABLE income 
ADD COLUMN gross_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN vat_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN wht_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN net_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Step 3: Update existing invoice records
-- Calculate VAT breakdown for existing invoices (7.5% VAT rate)
UPDATE invoices 
SET 
    vat_rate = 0.075,
    net_amount = ROUND(amount / 1.075, 2),
    vat_amount = ROUND(amount - (amount / 1.075), 2),
    vat_paid = 0
WHERE vat_amount = 0 AND amount > 0;

-- Step 4: Update existing income records
-- For existing income records, assume amount is already net amount
UPDATE income 
SET 
    gross_amount = ROUND(amount * 1.075, 2),
    vat_amount = ROUND(amount * 0.075, 2),
    wht_amount = 0,
    net_amount = amount
WHERE gross_amount = 0 AND amount > 0;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN invoices.vat_amount IS 'VAT collected on this invoice (output VAT)';
COMMENT ON COLUMN invoices.vat_rate IS 'VAT rate applied (default 7.5%)';
COMMENT ON COLUMN invoices.net_amount IS 'Amount before VAT (base amount)';
COMMENT ON COLUMN invoices.vat_paid IS 'VAT amount paid to tax authority';

COMMENT ON COLUMN income.gross_amount IS 'Amount before VAT/WHT deductions';
COMMENT ON COLUMN income.vat_amount IS 'VAT portion of the income';
COMMENT ON COLUMN income.wht_amount IS 'WHT deducted from income';
COMMENT ON COLUMN income.net_amount IS 'Final amount after VAT/WHT deductions';

-- Step 6: Verify the migration
SELECT 
    'invoices' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN vat_amount > 0 THEN 1 END) as records_with_vat
FROM invoices
UNION ALL
SELECT 
    'income' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN vat_amount > 0 THEN 1 END) as records_with_vat
FROM income;

-- Verification script to check VAT/WHT migration success
-- Run this after the migration to verify everything worked correctly

echo '=== VAT/WHT Migration Verification ===';

-- Check invoices table structure
echo 'Invoices table structure:';
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'invoices' 
    AND column_name IN ('vat_amount', 'vat_rate', 'net_amount', 'vat_paid')
ORDER BY column_name;

echo '';
echo 'Income table structure:';
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'income' 
    AND column_name IN ('gross_amount', 'vat_amount', 'wht_amount', 'net_amount')
ORDER BY column_name;

echo '';
echo '=== Data Verification ===';

-- Check invoices data
echo 'Invoices VAT breakdown:';
SELECT 
    COUNT(*) as total_invoices,
    COUNT(CASE WHEN vat_amount > 0 THEN 1 END) as invoices_with_vat,
    ROUND(AVG(vat_amount), 2) as avg_vat_amount,
    ROUND(AVG(vat_rate), 4) as avg_vat_rate,
    ROUND(SUM(vat_amount), 2) as total_vat_collected
FROM invoices;

echo '';
echo 'Income VAT/WHT breakdown:';
SELECT 
    COUNT(*) as total_income_records,
    COUNT(CASE WHEN vat_amount > 0 THEN 1 END) as records_with_vat,
    COUNT(CASE WHEN wht_amount > 0 THEN 1 END) as records_with_wht,
    ROUND(AVG(vat_amount), 2) as avg_vat_amount,
    ROUND(AVG(wht_amount), 2) as avg_wht_amount,
    ROUND(SUM(vat_amount), 2) as total_vat_from_income,
    ROUND(SUM(wht_amount), 2) as total_wht_deducted
FROM income;

echo '';
echo 'Sample invoice records (first 5):';
SELECT 
    invoice_number,
    amount,
    net_amount,
    vat_amount,
    vat_rate,
    vat_paid
FROM invoices 
ORDER BY created_at DESC 
LIMIT 5;

echo '';
echo 'Sample income records (first 5):';
SELECT 
    source,
    amount,
    gross_amount,
    vat_amount,
    wht_amount,
    net_amount
FROM income 
ORDER BY created_at DESC 
LIMIT 5;

echo '';
echo '=== Migration Status ===';
SELECT 
    CASE 
        WHEN COUNT(CASE WHEN i.vat_amount IS NOT NULL THEN 1 END) > 0 
        THEN 'SUCCESS: VAT/WHT columns added successfully'
        ELSE 'ERROR: VAT/WHT columns not found'
    END as migration_status
FROM invoices i
LIMIT 1;

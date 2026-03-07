-- Add amount_paid column to invoices table
ALTER TABLE invoices ADD COLUMN amount_paid DECIMAL(10, 2) DEFAULT 0.00 NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN invoices.amount_paid IS 'Amount paid for partial payments tracking';

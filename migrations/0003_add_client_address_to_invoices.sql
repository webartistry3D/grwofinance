-- Add client_address column to invoices table
ALTER TABLE invoices ADD COLUMN client_address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN invoices.client_address IS 'Client billing address for invoice';

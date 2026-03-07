-- Create WHT (Withholding Tax) tracking table
CREATE TABLE wht_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    invoice_id UUID REFERENCES invoices(id),
    invoice_number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    invoice_amount DECIMAL(10, 2) NOT NULL,
    wht_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.05, -- 5% default
    wht_amount DECIMAL(10, 2) NOT NULL,
    net_amount DECIMAL(10, 2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT NOW() NOT NULL,
    payment_method TEXT DEFAULT 'Bank Transfer',
    status TEXT DEFAULT 'deducted' CHECK (status IN ('deducted', 'paid_to_firs', 'refunded')),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_wht_user_id ON wht_transactions(user_id);
CREATE INDEX idx_wht_invoice_id ON wht_transactions(invoice_id);
CREATE INDEX idx_wht_transaction_date ON wht_transactions(transaction_date);
CREATE INDEX idx_wht_status ON wht_transactions(status);

-- Add comments for documentation
COMMENT ON TABLE wht_transactions IS 'Tracks withholding tax deductions from invoice payments';
COMMENT ON COLUMN wht_transactions.wht_rate IS 'Withholding tax rate (e.g., 0.05 for 5%)';
COMMENT ON COLUMN wht_transactions.wht_amount IS 'Amount deducted as withholding tax';
COMMENT ON COLUMN wht_transactions.net_amount IS 'Net amount received after WHT deduction';
COMMENT ON COLUMN wht_transactions.status IS 'WHT status: deducted, paid_to_firs, or refunded';

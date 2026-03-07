-- Tax Compliance Tables Migration

-- Tax Calendar for filing deadlines and reminders
CREATE TABLE IF NOT EXISTS tax_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    tax_type TEXT NOT NULL, -- 'VAT', 'WHT', 'CIT', 'PAYE'
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    reminder_date DATE,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'completed', 'overdue'
    is_recurring BOOLEAN DEFAULT false NOT NULL,
    recurring_frequency TEXT, -- 'monthly', 'quarterly', 'yearly'
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Withholding Tax (WHT) tracking
CREATE TABLE IF NOT EXISTS withholding_tax (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    invoice_id UUID REFERENCES invoices(id),
    income_id UUID REFERENCES income(id),
    amount DECIMAL(12,2) NOT NULL,
    wht_rate TEXT NOT NULL, -- '5%', '10%', etc.
    wht_amount DECIMAL(12,2) NOT NULL,
    deductee_name TEXT NOT NULL,
    deductee_tax_id TEXT,
    transaction_date DATE NOT NULL,
    payment_date DATE,
    certificate_number TEXT,
    status TEXT DEFAULT 'deducted' NOT NULL, -- 'deducted', 'remitted', 'certified'
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tax Reports generation tracking
CREATE TABLE IF NOT EXISTS tax_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    report_type TEXT NOT NULL, -- 'VAT_monthly', 'WHT_monthly', 'CIT_annual', 'tax_summary'
    title TEXT NOT NULL,
    description TEXT,
    report_period TEXT NOT NULL, -- '2024-01', 'Q1-2024', '2024'
    generated_date TIMESTAMP DEFAULT NOW() NOT NULL,
    file_url TEXT, -- Path to generated PDF/Excel file
    data JSONB, -- Report data in JSON format
    status TEXT DEFAULT 'generated' NOT NULL, -- 'generated', 'downloaded', 'archived'
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tax Receipts organization
CREATE TABLE IF NOT EXISTS tax_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    expense_id UUID REFERENCES expenses(id),
    invoice_id UUID REFERENCES invoices(id),
    receipt_type TEXT NOT NULL, -- 'vat_invoice', 'wht_certificate', 'tax_payment', 'deductible_expense'
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2),
    date DATE NOT NULL,
    category TEXT NOT NULL, -- 'input_vat', 'output_vat', 'wht_deducted', 'wht_paid', 'deductible'
    image_url TEXT,
    file_url TEXT,
    tags TEXT[], -- Array of tags
    is_deductible BOOLEAN DEFAULT true NOT NULL,
    tax_year TEXT NOT NULL, -- '2024'
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- FIRS Compliance tracking
CREATE TABLE IF NOT EXISTS firs_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    tax_id TEXT NOT NULL, -- Tax Identification Number
    business_name TEXT NOT NULL,
    registration_number TEXT, -- CAC/BN number
    tax_office TEXT NOT NULL, -- FIRS tax office
    tax_category TEXT NOT NULL, -- 'individual', 'company', 'partnership'
    filing_frequency TEXT NOT NULL, -- 'monthly', 'quarterly', 'annually'
    last_filing_date DATE,
    next_filing_date DATE,
    compliance_status TEXT DEFAULT 'compliant' NOT NULL, -- 'compliant', 'non_compliant', 'pending'
    outstanding_returns INTEGER DEFAULT 0 NOT NULL,
    total_tax_liability DECIMAL(12,2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tax_calendar_user_id ON tax_calendar(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_calendar_due_date ON tax_calendar(due_date);
CREATE INDEX IF NOT EXISTS idx_withholding_tax_user_id ON withholding_tax(user_id);
CREATE INDEX IF NOT EXISTS idx_withholding_tax_transaction_date ON withholding_tax(transaction_date);
CREATE INDEX IF NOT EXISTS idx_tax_reports_user_id ON tax_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_reports_generated_date ON tax_reports(generated_date);
CREATE INDEX IF NOT EXISTS idx_tax_receipts_user_id ON tax_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_receipts_date ON tax_receipts(date);
CREATE INDEX IF NOT EXISTS idx_tax_receipts_tax_year ON tax_receipts(tax_year);
CREATE INDEX IF NOT EXISTS idx_firs_compliance_user_id ON firs_compliance(user_id);

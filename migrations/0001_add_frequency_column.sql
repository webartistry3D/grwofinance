-- Add frequency column to income table
ALTER TABLE income ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'monthly' NOT NULL;

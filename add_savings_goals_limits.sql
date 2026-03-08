-- Add savings goals tracking field to users table
ALTER TABLE users 
ADD COLUMN savings_goals_count INTEGER DEFAULT 0 NOT NULL;

-- Create index for better performance on savings goals limits
CREATE INDEX IF NOT EXISTS idx_users_savings_goals_count ON users(savings_goals_count);

-- Update existing users to have default values
UPDATE users 
SET savings_goals_count = 0 
WHERE savings_goals_count IS NULL;

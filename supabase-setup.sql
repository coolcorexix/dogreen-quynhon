-- Create user_checklist_progress table for storing user's checklist progress
CREATE TABLE IF NOT EXISTS user_checklist_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_day INTEGER NOT NULL CHECK (activity_day >= 1 AND activity_day <= 30),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_day)
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_checklist_progress_user_id ON user_checklist_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_checklist_progress_activity_day ON user_checklist_progress(activity_day);

-- Enable Row Level Security (RLS)
ALTER TABLE user_checklist_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own progress
CREATE POLICY "Users can view own checklist progress" ON user_checklist_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checklist progress" ON user_checklist_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checklist progress" ON user_checklist_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checklist progress" ON user_checklist_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_user_checklist_progress_updated_at
  BEFORE UPDATE ON user_checklist_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

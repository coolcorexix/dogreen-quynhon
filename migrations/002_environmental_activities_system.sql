-- Migration 002: Environmental Activities Management System
-- This migration adds the new admin-controlled activities and programs system
-- Created: 2024
-- Description: Complete environmental activities management with admin controls, user progress tracking, and program management

-- 1. Create user_profiles table with role field
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  total_score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_checkpoint BOOLEAN NOT NULL DEFAULT false,
  reward TEXT, -- Description of the gift/reward for checkpoint activities
  score INTEGER NOT NULL DEFAULT 1 CHECK (score > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create program_activities table (junction table with ordering)
CREATE TABLE IF NOT EXISTS program_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  day_order INTEGER NOT NULL CHECK (day_order > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, day_order),
  UNIQUE(program_id, activity_id) -- Prevent duplicate activities in same program
);

-- 5. Create user_program_enrollment table
CREATE TABLE IF NOT EXISTS user_program_enrollment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, program_id)
);

-- 6. Create user_activity_completion table
CREATE TABLE IF NOT EXISTS user_activity_completion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, program_id, activity_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_activities_is_checkpoint ON activities(is_checkpoint);
CREATE INDEX IF NOT EXISTS idx_programs_created_by ON programs(created_by);
CREATE INDEX IF NOT EXISTS idx_programs_is_active ON programs(is_active);
CREATE INDEX IF NOT EXISTS idx_program_activities_program_id ON program_activities(program_id);
CREATE INDEX IF NOT EXISTS idx_program_activities_activity_id ON program_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_user_program_enrollment_user_id ON user_program_enrollment(user_id);
CREATE INDEX IF NOT EXISTS idx_user_program_enrollment_program_id ON user_program_enrollment(program_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_completion_user_id ON user_activity_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_completion_program_id ON user_activity_completion(program_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_completion_activity_id ON user_activity_completion(activity_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_completion_verified ON user_activity_completion(is_verified);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_program_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_completion ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for activities
CREATE POLICY "Anyone can view activities" ON activities
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert activities" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update activities" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete activities" ON activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for programs
CREATE POLICY "Anyone can view active programs" ON programs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all programs" ON programs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert programs" ON programs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update programs" ON programs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete programs" ON programs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for program_activities
CREATE POLICY "Anyone can view program activities" ON program_activities
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage program activities" ON program_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for user_program_enrollment
CREATE POLICY "Users can view own enrollments" ON user_program_enrollment
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in programs" ON user_program_enrollment
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments" ON user_program_enrollment
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments" ON user_program_enrollment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for user_activity_completion
CREATE POLICY "Users can view own completions" ON user_activity_completion
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" ON user_activity_completion
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all completions" ON user_activity_completion
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update completions" ON user_activity_completion
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create triggers for updating updated_at timestamps
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user score and level
CREATE OR REPLACE FUNCTION update_user_score()
RETURNS TRIGGER AS $$
DECLARE
  activity_score INTEGER;
  new_total_score INTEGER;
  new_level INTEGER;
BEGIN
  -- Only update if the completion is verified
  IF NEW.is_verified = true AND (OLD.is_verified = false OR OLD.is_verified IS NULL) THEN
    -- Get the activity score
    SELECT score INTO activity_score
    FROM activities
    WHERE id = NEW.activity_id;
    
    -- Update user's total score
    UPDATE user_profiles
    SET total_score = total_score + activity_score,
        level = (total_score + activity_score) / 100 + 1, -- Level up every 100 points
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user score when activity is verified
CREATE TRIGGER update_user_score_trigger
  AFTER UPDATE ON user_activity_completion
  FOR EACH ROW
  EXECUTE FUNCTION update_user_score();

-- Migration 003: Fix RLS Policies
-- This migration fixes the infinite recursion issue in user_profiles policies
-- Created: 2024
-- Description: Removes circular references in RLS policies

-- Drop the problematic admin policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create a better admin policy that doesn't cause recursion
-- This policy allows admins to view all profiles by checking if the current user has admin role
-- We'll use a function to avoid the circular reference
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user exists and has admin role
  -- This avoids the circular reference by not using the same table in the policy
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the admin policy using the function
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (is_admin(auth.uid()));

-- Also add an INSERT policy for user profiles (needed for signup)
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add an admin policy for INSERT (admins can create profiles for others)
CREATE POLICY "Admins can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Add an admin policy for UPDATE (admins can update any profile)
CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- Add an admin policy for DELETE (admins can delete any profile)
CREATE POLICY "Admins can delete profiles" ON user_profiles
  FOR DELETE USING (is_admin(auth.uid()));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON activities TO authenticated;
GRANT ALL ON programs TO authenticated;
GRANT ALL ON program_activities TO authenticated;
GRANT ALL ON user_program_enrollment TO authenticated;
GRANT ALL ON user_activity_completion TO authenticated;

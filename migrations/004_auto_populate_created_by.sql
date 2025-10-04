-- Migration 004: Auto-populate created_by field
-- This migration makes the created_by field automatically populate with the current user
-- Created: 2024
-- Description: Automatically sets created_by to the current authenticated user

-- Create a function to get the current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the programs table to auto-populate created_by
ALTER TABLE programs 
ALTER COLUMN created_by SET DEFAULT get_current_user_id();

-- Create a trigger to automatically set created_by if it's NULL
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- If created_by is NULL, set it to the current user
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for programs table
DROP TRIGGER IF EXISTS set_programs_created_by ON programs;
CREATE TRIGGER set_programs_created_by
  BEFORE INSERT ON programs
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

-- Update existing programs that might have NULL created_by
-- (This will only work if you have admin privileges)
UPDATE programs 
SET created_by = get_current_user_id() 
WHERE created_by IS NULL;

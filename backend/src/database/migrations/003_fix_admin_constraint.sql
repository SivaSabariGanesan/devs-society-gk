-- Migration: Fix admin college constraint
-- This removes the constraint that prevents regular admins from being created without college assignment

-- Drop the existing constraint
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admin_college_check;

-- Create a simple constraint that just validates the role is valid
ALTER TABLE admins 
ADD CONSTRAINT admin_role_check 
CHECK (role IN ('super-admin', 'admin'));

-- Add a comment explaining the change
COMMENT ON CONSTRAINT admin_role_check ON admins IS 
'Validates admin role - allows regular admins without college assignment for flexible assignment later'; 
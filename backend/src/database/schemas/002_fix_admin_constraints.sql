-- Fix admin constraints to allow admins without initial college assignment
-- This allows creating admins and assigning them to colleges later via tenure system

-- Drop the existing constraint
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admin_college_check;

-- Create a new constraint that only requires super-admins to NOT have assigned colleges
-- Regular admins can be created without college assignment initially
ALTER TABLE admins ADD CONSTRAINT admin_college_check CHECK (
    (role = 'super-admin' AND assigned_college_id IS NULL) OR 
    (role = 'admin')
);

-- Update existing constraint to be more flexible
-- Admins can be created without tenure info initially
ALTER TABLE admins ALTER COLUMN tenure_start_date DROP NOT NULL;
ALTER TABLE admins ALTER COLUMN tenure_is_active SET DEFAULT false; 
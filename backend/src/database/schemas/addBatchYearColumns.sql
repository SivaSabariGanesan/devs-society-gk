-- Add batch_year column to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS batch_year INTEGER;

-- Add batch_year column to college_tenure_heads table  
ALTER TABLE college_tenure_heads ADD COLUMN IF NOT EXISTS batch_year INTEGER;

-- Add comments to document the columns
COMMENT ON COLUMN admins.batch_year IS 'Year of the batch this admin represents (e.g., 2024, 2025)';
COMMENT ON COLUMN college_tenure_heads.batch_year IS 'Year of the batch for this tenure period';

-- Update existing admins with batch years based on their information
-- You can run these individually or modify as needed

-- Update hursun admin to batch 2024
UPDATE admins SET batch_year = 2024 WHERE email LIKE '%hursun%' OR username = 'hursun';

-- Update gokul admin to batch 2025  
UPDATE admins SET batch_year = 2025 WHERE email LIKE '%gokul%' OR username = 'gokul';

-- Update other admins to batch 2024 (default)
UPDATE admins SET batch_year = 2024 WHERE batch_year IS NULL AND role = 'admin';

-- Update college_tenure_heads with corresponding batch years
UPDATE college_tenure_heads 
SET batch_year = admins.batch_year 
FROM admins 
WHERE college_tenure_heads.admin_id = admins.id 
AND college_tenure_heads.batch_year IS NULL;

-- Verify the updates
SELECT 
  a.id,
  a.full_name,
  a.username,
  a.batch_year,
  c.name as college_name
FROM admins a
LEFT JOIN colleges c ON a.assigned_college_id = c.id
WHERE a.role = 'admin'
ORDER BY c.name, a.batch_year; 
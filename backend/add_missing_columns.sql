-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_code VARCHAR;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP;

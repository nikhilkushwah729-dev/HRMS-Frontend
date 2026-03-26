-- Fix social_logins table for OAuth (add missing columns)
-- Run: mysql -u root -p hrms_db < database/fix_social_logins_schema.sql

USE hrms_db;  -- Replace with your DB name

ALTER TABLE social_logins 
ADD COLUMN IF NOT EXISTS `is_primary` BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS `last_login_at` TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Verify table structure
DESCRIBE social_logins;

-- Ensure indexes
ALTER TABLE social_logins ADD INDEX idx_provider_user (provider, provider_user_id);
ALTER TABLE social_logins ADD INDEX idx_employee (employee_id);


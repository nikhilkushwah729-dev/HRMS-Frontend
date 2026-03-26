-- Add updated_at column to employee_invitations table if it doesn't exist
-- For MySQL - run this in your MySQL client or phpMyAdmin
ALTER TABLE employee_invitations ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;


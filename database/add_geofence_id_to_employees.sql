-- =====================================================
-- Add geofence_id column to employees table
-- This fixes the error: Cannot preload "geofence", value of "Employee.geofenceId" is undefined
-- =====================================================

-- Add geofence_id column to employees table (nullable with null default)
ALTER TABLE employees 
ADD COLUMN geofence_id INT NULL DEFAULT NULL;

-- Add index for faster geofence lookups
ALTER TABLE employees 
ADD INDEX idx_geofence (geofence_id);


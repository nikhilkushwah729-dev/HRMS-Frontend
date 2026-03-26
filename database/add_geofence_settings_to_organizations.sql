-- =====================================================
-- Add geofence settings to organizations table
-- =====================================================

-- Add geofence columns (if they don't exist)
ALTER TABLE organizations 
ADD COLUMN geofence_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE organizations 
ADD COLUMN require_geofence_for_all BOOLEAN DEFAULT FALSE;

ALTER TABLE organizations 
ADD COLUMN default_geofence_id INT NULL DEFAULT NULL;

-- Update existing organization with default values
UPDATE organizations SET 
    geofence_enabled = FALSE,
    require_geofence_for_all = FALSE,
    default_geofence_id = NULL
WHERE geofence_enabled IS NULL;

-- =====================================================
-- Geo-Fencing Settings Module
-- Angular + Node/Express/Adonis-style API compatible schema
-- =====================================================

CREATE TABLE IF NOT EXISTS geo_fences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    radius INT UNSIGNED NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_geo_fences_org (org_id),
    KEY idx_geo_fences_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employee_geo_fence_map (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT UNSIGNED NOT NULL,
    geo_fence_id INT NOT NULL,
    org_id INT UNSIGNED NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_employee_geofence (employee_id, geo_fence_id),
    KEY idx_employee_geofence_org (org_id),
    KEY idx_employee_geofence_employee (employee_id),
    KEY idx_employee_geofence_fence (geo_fence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS geofence_violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT UNSIGNED NOT NULL,
    employee_id INT UNSIGNED NULL,
    geo_fence_id INT NULL,
    action_type VARCHAR(40) NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    distance_meters DECIMAL(10, 2) NULL,
    violation_message VARCHAR(255) NULL,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_geofence_violations_org (org_id),
    KEY idx_geofence_violations_employee (employee_id),
    KEY idx_geofence_violations_time (occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS geofence_enabled TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS require_geofence_for_all TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS geofence_id INT NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS requires_geofence TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE attendances
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7) NULL,
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7) NULL,
    ADD COLUMN IF NOT EXISTS is_within_geo_fence TINYINT(1) NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS geofence_distance_meters DECIMAL(10, 2) NULL,
    ADD COLUMN IF NOT EXISTS geofence_zone_id INT NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS geofence_checked_at DATETIME NULL,
    ADD COLUMN IF NOT EXISTS geofence_message VARCHAR(255) NULL;

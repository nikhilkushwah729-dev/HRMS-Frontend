-- HRMS Social Login & Phone Authentication SQL
-- Add support for Google/Microsoft social login and phone number authentication

-- ============================================
-- 1. Add phone and social login columns to employees
-- ============================================

ALTER TABLE `employees` 
ADD COLUMN `phone_verified` tinyint(1) NOT NULL DEFAULT 0 AFTER `phone`,
ADD COLUMN `phone_auth_enabled` tinyint(1) NOT NULL DEFAULT 0 AFTER `phone_verified`,
ADD COLUMN `login_type` enum('email','google','microsoft','phone') DEFAULT 'email' AFTER `phone_auth_enabled`,
ADD COLUMN `is_international` tinyint(1) NOT NULL DEFAULT 0 AFTER `login_type`;

-- ============================================
-- 2. Create phone login OTP table
-- ============================================

CREATE TABLE IF NOT EXISTS `phone_otp_logins` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) NOT NULL,
  `org_id` int(10) UNSIGNED DEFAULT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `attempts` tinyint(4) NOT NULL DEFAULT 0,
  `max_attempts` tinyint(4) NOT NULL DEFAULT 3,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `phone` (`phone`),
  KEY `phone_org` (`phone`,`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. Update social_logins table structure
-- ============================================

ALTER TABLE `social_logins` 
ADD COLUMN `phone` varchar(20) DEFAULT NULL AFTER `provider_user_id`,
ADD COLUMN `is_primary` tinyint(1) NOT NULL DEFAULT 0 AFTER `phone`,
ADD COLUMN `last_login_at` timestamp NULL DEFAULT NULL AFTER `is_primary`;

-- ============================================
-- 4. Add organization type (international/national)
-- ============================================

ALTER TABLE `organizations` 
ADD COLUMN `org_type` enum('national','international') DEFAULT 'national' AFTER `default_geofence_id`,
ADD COLUMN `default_language` varchar(10) DEFAULT 'en' AFTER `org_type`,
ADD COLUMN `allowed_login_methods` set('email','google','microsoft','phone') DEFAULT 'email,google,microsoft,phone' AFTER `default_language`;

-- ============================================
-- 5. Create role-permission mapping for employees
-- ============================================

-- Employee role gets limited permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.role_name = 'Employee' 
AND p.permission_key IN (
  'view_own_profile',
  'edit_own_profile',
  'view_own_attendance',
  'mark_attendance',
  'view_own_leaves',
  'apply_leave',
  'view_own_reports',
  'view_own_documents',
  'view_announcements'
) ON DUPLICATE KEY UPDATE granted_at = CURRENT_TIMESTAMP;

-- ============================================
-- 6. Create permissions table data
-- ============================================

INSERT INTO `permissions` (`permission_key`, `description`, `module`) VALUES
-- Self Service / Employee permissions
('view_own_profile', 'View own profile', 'profile'),
('edit_own_profile', 'Edit own profile', 'profile'),
('view_own_attendance', 'View own attendance', 'attendance'),
('mark_attendance', 'Mark attendance', 'attendance'),
('view_own_leaves', 'View own leaves', 'leaves'),
('apply_leave', 'Apply for leave', 'leaves'),
('view_own_reports', 'View own reports', 'reports'),
('view_own_documents', 'View own documents', 'documents'),
('view_announcements', 'View announcements', 'announcements'),
-- Manager permissions
('view_team_attendance', 'View team attendance', 'attendance'),
('approve_leave', 'Approve/reject leaves', 'leaves'),
('view_team_leaves', 'View team leaves', 'leaves'),
('view_team_reports', 'View team reports', 'reports'),
-- HR permissions
('manage_employees', 'Manage employees', 'employees'),
('manage_all_attendance', 'Manage all attendance', 'attendance'),
('manage_leaves', 'Manage all leaves', 'leaves'),
('manage_documents', 'Manage documents', 'documents'),
('view_all_reports', 'View all reports', 'reports'),
-- Admin permissions
('manage_organizations', 'Manage organization settings', 'organization'),
('manage_roles', 'Manage roles', 'roles'),
('manage_permissions', 'Manage permissions', 'roles'),
('manage_geofence', 'Manage geofence', 'geofence'),
('view_audit_logs', 'View audit logs', 'audit'),
('manage_settings', 'Manage settings', 'settings')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ============================================
-- 7. Insert default role permissions for org 4 (new org)
-- ============================================

-- Role 4 = Employee for org 1 (needs permission for org 4)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 4, p.id 
FROM permissions p 
WHERE p.permission_key IN (
  'view_own_profile', 'edit_own_profile', 'view_own_attendance', 
  'mark_attendance', 'view_own_leaves', 'apply_leave', 
  'view_own_reports', 'view_own_documents', 'view_announcements'
) AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = 4 AND rp.permission_id = p.id
);

-- ============================================
-- 8. Update employees for org 4 with role 4 (Employee)
-- ============================================

UPDATE `employees` SET `login_type` = 'email' WHERE `org_id` = 4;

-- Set existing employee as Admin (role 2)
UPDATE `employees` SET `role_id` = 2 WHERE `id` = 6 AND `org_id` = 4;

-- ============================================
-- 9. Configure organization login methods
-- ============================================

UPDATE `organizations` 
SET `org_type` = 'international', 
    `allowed_login_methods` = 'email,google,microsoft,phone' 
WHERE `id` = 4;

COMMIT;


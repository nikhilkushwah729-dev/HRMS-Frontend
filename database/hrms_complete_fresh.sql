-- ============================================================
-- HRMS COMPLETE DATABASE - DROP ALL & CREATE FRESH
-- ============================================================
-- Version: 2.0
-- Last Updated: 2026-03-05
-- Features: Attendance, Leave, Payroll, Projects, Face Recognition, Geofencing, Reports
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Drop all tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS `api_rate_limits`;
DROP TABLE IF EXISTS `data_erasure_requests`;
DROP TABLE IF EXISTS `document_access_logs`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `leave_balances`;
DROP TABLE IF EXISTS `attendance_breaks`;
DROP TABLE IF EXISTS `project_members`;
DROP TABLE IF EXISTS `employee_shifts`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `payroll`;
DROP TABLE IF EXISTS `password_history`;
DROP TABLE IF EXISTS `refresh_tokens`;
DROP TABLE IF EXISTS `user_sessions`;
DROP TABLE IF EXISTS `trusted_devices`;
DROP TABLE IF EXISTS `auth_access_tokens`;
DROP TABLE IF EXISTS `magic_link_tokens`;
DROP TABLE IF EXISTS `social_logins`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `otp_tokens`;
DROP TABLE IF EXISTS `email_verification_tokens`;
DROP TABLE IF EXISTS `login_attempts`;
DROP TABLE IF EXISTS `employee_locations`;
DROP TABLE IF EXISTS `face_embeddings`;
DROP TABLE IF EXISTS `geofences`;
DROP TABLE IF EXISTS `employee_invitations`;
DROP TABLE IF EXISTS `org_ip_whitelist`;
DROP TABLE IF EXISTS `organization_addons`;
DROP TABLE IF EXISTS `timesheets`;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `attendance_requests`;
DROP TABLE IF EXISTS `attendance_regularizations`;
DROP TABLE IF EXISTS `leaves`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `documents`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `payroll_settings`;
DROP TABLE IF EXISTS `leave_types`;
DROP TABLE IF EXISTS `holidays`;
DROP TABLE IF EXISTS `shifts`;
DROP TABLE IF EXISTS `designations`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `plans`;
DROP TABLE IF EXISTS `addon_prices`;
DROP TABLE IF EXISTS `organizations`;
DROP TABLE IF EXISTS `org_registrations`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `adonis_schema_versions`;
DROP TABLE IF EXISTS `adonis_schema`;
DROP TABLE IF EXISTS `adonis_schema`;
DROP TABLE IF EXISTS `adonis_schema_versions`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `api_rate_limits`;
DROP TABLE IF EXISTS `attendance`;
DROP TABLE IF EXISTS `attendances`;
DROP TABLE IF EXISTS `attendance_breaks`;
DROP TABLE IF EXISTS `attendance_regularizations`;
DROP TABLE IF EXISTS `attendance_requests`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `auth_access_tokens`;
DROP TABLE IF EXISTS `data_erasure_requests`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `designations`;
DROP TABLE IF EXISTS `documents`;
DROP TABLE IF EXISTS `document_access_logs`;
DROP TABLE IF EXISTS `email_verification_tokens`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `employee_invitations`;
DROP TABLE IF EXISTS `employee_locations`;
DROP TABLE IF EXISTS `employee_shifts`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `face_embeddings`;
DROP TABLE IF EXISTS `geofences`;
DROP TABLE IF EXISTS `holidays`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `leaves`;
DROP TABLE IF EXISTS `leave_balances`;
DROP TABLE IF EXISTS `leave_requests`;
DROP TABLE IF EXISTS `leave_types`;
DROP TABLE IF EXISTS `login_attempts`;
DROP TABLE IF EXISTS `magic_link_tokens`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `organizations`;
DROP TABLE IF EXISTS `organization_addons`;
DROP TABLE IF EXISTS `org_ip_whitelist`;
DROP TABLE IF EXISTS `org_registrations`;
DROP TABLE IF EXISTS `otp_tokens`;
DROP TABLE IF EXISTS `password_history`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `payroll`;
DROP TABLE IF EXISTS `payroll_settings`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `plans`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `project_members`;
DROP TABLE IF EXISTS `refresh_tokens`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `shifts`;
DROP TABLE IF EXISTS `social_logins`;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `timesheets`;
DROP TABLE IF EXISTS `trusted_devices`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `user_sessions`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Organizations
CREATE TABLE `organizations` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `plan_id` int(10) UNSIGNED DEFAULT NULL,
  `plan_status` tinyint(1) NOT NULL DEFAULT 0,
  `plan_end_date` date DEFAULT NULL,
  `user_limit` int(11) NOT NULL DEFAULT 10,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `timezone` varchar(50) NOT NULL DEFAULT 'Asia/Kolkata',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles
CREATE TABLE `roles` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED DEFAULT NULL,
  `role_name` varchar(100) NOT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_org_role` (`org_id`,`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions
CREATE TABLE `permissions` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `permission_key` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `module` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_key` (`permission_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role Permissions
CREATE TABLE `role_permissions` (
  `role_id` int(10) UNSIGNED NOT NULL,
  `permission_id` int(10) UNSIGNED NOT NULL,
  `granted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`role_id`,`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Departments
CREATE TABLE `departments` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `parent_id` int(10) UNSIGNED DEFAULT NULL,
  `department_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`),
  KEY `parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Designations
CREATE TABLE `designations` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `department_id` int(10) UNSIGNED DEFAULT NULL,
  `designation_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`),
  KEY `department_id` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employees
CREATE TABLE `employees` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `department_id` int(10) UNSIGNED DEFAULT NULL,
  `designation_id` int(10) UNSIGNED DEFAULT NULL,
  `role_id` int(10) UNSIGNED DEFAULT NULL,
  `manager_id` int(10) UNSIGNED DEFAULT NULL,
  `employee_code` varchar(50) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT 1,
  `is_locked` tinyint(1) NOT NULL DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `gender` enum('male','female','other','prefer_not_to_say') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `emergency_phone` varchar(20) DEFAULT NULL,
  `salary` decimal(12,2) NOT NULL DEFAULT 0.00,
  `bank_account` varchar(100) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `pan_number` varchar(20) DEFAULT NULL,
  `aadhar_last4` char(4) DEFAULT NULL,
  `join_date` date DEFAULT NULL,
  `exit_date` date DEFAULT NULL,
  `exit_reason` text DEFAULT NULL,
  `status` enum('active','inactive','on_leave','terminated') NOT NULL DEFAULT 'active',
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `department_id` (`department_id`),
  KEY `designation_id` (`designation_id`),
  KEY `role_id` (`role_id`),
  KEY `manager_id` (`manager_id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SHIFTS & HOLIDAYS
-- ============================================================

-- Shifts
CREATE TABLE `shifts` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `grace_time` int(11) DEFAULT 15,
  `work_days` varchar(50) DEFAULT '1,2,3,4,5',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Shifts
CREATE TABLE `employee_shifts` (
  `employee_id` int(10) UNSIGNED NOT NULL,
  `shift_id` int(10) UNSIGNED NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`employee_id`,`shift_id`),
  KEY `shift_id` (`shift_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Holidays
CREATE TABLE `holidays` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `holiday_date` date NOT NULL,
  `type` enum('national','company','optional') DEFAULT 'company',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_org_date` (`org_id`,`holiday_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ATTENDANCE
-- ============================================================

-- Attendances
CREATE TABLE `attendances` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `shift_id` int(10) UNSIGNED DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `check_in` datetime DEFAULT NULL,
  `check_out` datetime DEFAULT NULL,
  `work_hours` decimal(5,2) GENERATED ALWAYS AS (round(timestampdiff(MINUTE,`check_in`,`check_out`) / 60,2)) STORED,
  `check_in_lat` decimal(10,8) DEFAULT NULL,
  `check_in_lng` decimal(11,8) DEFAULT NULL,
  `check_out_lat` decimal(10,8) DEFAULT NULL,
  `check_out_lng` decimal(11,8) DEFAULT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `selfie_url` varchar(500) DEFAULT NULL,
  `biometric_ref` varchar(255) DEFAULT NULL,
  `status` enum('present','absent','half_day','late','on_leave','holiday','weekend') DEFAULT 'present',
  `is_late` tinyint(1) DEFAULT 0,
  `is_half_day` tinyint(1) DEFAULT 0,
  `is_overtime` tinyint(1) DEFAULT 0,
  `total_break_min` int(11) DEFAULT 0,
  `net_work_hours` decimal(5,2) DEFAULT 0.00,
  `source` enum('manual','biometric','mobile','web','geo_fence','camera','face') DEFAULT 'web',
  `notes` varchar(500) DEFAULT NULL,
  `modified_by` int(10) UNSIGNED DEFAULT NULL,
  `modified_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_date_shift` (`employee_id`,`attendance_date`,`shift_id`,`check_in`),
  KEY `org_id` (`org_id`),
  KEY `shift_id` (`shift_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Breaks
CREATE TABLE `attendance_breaks` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `attendance_id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `break_start` datetime NOT NULL,
  `break_end` datetime DEFAULT NULL,
  `break_duration_min` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `attendance_id` (`attendance_id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Regularizations
CREATE TABLE `attendance_regularizations` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `attendance_id` int(10) UNSIGNED DEFAULT NULL,
  `regularization_date` date NOT NULL,
  `type` enum('missed_punch','late_arrival','half_day','other') NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `approved_by` int(10) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Requests
CREATE TABLE `attendance_requests` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `request_type` enum('check_in','check_out','both') NOT NULL,
  `requested_time` datetime NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int(10) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LEAVE MANAGEMENT
-- ============================================================

-- Leave Types
CREATE TABLE `leave_types` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `days_allowed` int(11) NOT NULL DEFAULT 0,
  `carry_forward` tinyint(1) DEFAULT 0,
  `max_carry_days` int(11) DEFAULT 0,
  `is_paid` tinyint(1) DEFAULT 1,
  `requires_doc` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Balances
CREATE TABLE `leave_balances` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `leave_type_id` int(10) UNSIGNED NOT NULL,
  `year` year NOT NULL,
  `total_days` decimal(4,1) NOT NULL DEFAULT 0.0,
  `used_days` decimal(4,1) NOT NULL DEFAULT 0.0,
  `remaining_days` decimal(4,1) NOT NULL DEFAULT 0.0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_type_year` (`employee_id`,`leave_type_id`,`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leaves / Leave Requests
CREATE TABLE `leaves` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `leave_type_id` int(10) UNSIGNED DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` decimal(4,1) DEFAULT 0.0,
  `reason` text DEFAULT NULL,
  `supporting_doc` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `approved_by` int(10) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_note` text DEFAULT NULL,
  `cancelled_by` int(10) UNSIGNED DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `org_id` (`org_id`),
  KEY `leave_type_id` (`leave_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PAYROLL
-- ============================================================

-- Payroll
CREATE TABLE `payroll` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `month` tinyint(4) NOT NULL,
  `year` smallint(6) NOT NULL,
  `basic_salary` decimal(12,2) NOT NULL DEFAULT 0.00,
  `hra` decimal(12,2) DEFAULT 0.00,
  `allowances` decimal(12,2) DEFAULT 0.00,
  `bonus` decimal(12,2) DEFAULT 0.00,
  `gross_salary` decimal(12,2) GENERATED ALWAYS AS (`basic_salary` + `hra` + `allowances` + `bonus`) STORED,
  `pf_deduction` decimal(12,2) DEFAULT 0.00,
  `esi_deduction` decimal(12,2) DEFAULT 0.00,
  `tds_deduction` decimal(12,2) DEFAULT 0.00,
  `other_deductions` decimal(12,2) DEFAULT 0.00,
  `total_deductions` decimal(12,2) GENERATED ALWAYS AS (`pf_deduction` + `esi_deduction` + `tds_deduction` + `other_deductions`) STORED,
  `net_salary` decimal(12,2) GENERATED ALWAYS AS (`gross_salary` - `total_deductions`) STORED,
  `payment_date` date DEFAULT NULL,
  `payment_mode` enum('bank_transfer','cash','cheque') DEFAULT 'bank_transfer',
  `payment_ref` varchar(100) DEFAULT NULL,
  `status` enum('draft','processed','paid','failed','reversed') DEFAULT 'draft',
  `processed_by` int(10) UNSIGNED DEFAULT NULL,
  `is_locked` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_month` (`employee_id`,`month`,`year`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Settings
CREATE TABLE `payroll_settings` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `pf_percent` decimal(5,2) DEFAULT 12.00,
  `esi_percent` decimal(5,2) DEFAULT 0.75,
  `tax_slabs` longtext DEFAULT NULL,
  `pay_day` tinyint(4) DEFAULT 1,
  `currency` varchar(10) DEFAULT 'INR',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses
CREATE TABLE `expenses` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `project_id` int(10) UNSIGNED DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `expense_date` date NOT NULL,
  `description` text DEFAULT NULL,
  `receipt_url` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int(10) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PROJECTS & TIMESHEETS
-- ============================================================

-- Projects
CREATE TABLE `projects` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `client_name` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(14,2) DEFAULT NULL,
  `status` enum('planned','in_progress','completed','on_hold') DEFAULT 'planned',
  `priority` enum('low','medium','high','critical') DEFAULT 'medium',
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project Members
CREATE TABLE `project_members` (
  `project_id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `role` varchar(100) DEFAULT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`project_id`,`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks
CREATE TABLE `tasks` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `project_id` int(10) UNSIGNED NOT NULL,
  `assigned_to` int(10) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('low','medium','high','critical') DEFAULT 'medium',
  `status` enum('todo','in_progress','testing','completed','cancelled','on_hold') DEFAULT 'todo',
  `due_date` date DEFAULT NULL,
  `estimated_hours` decimal(5,2) DEFAULT NULL,
  `actual_hours` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`),
  KEY `project_id` (`project_id`),
  KEY `assigned_to` (`assigned_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Timesheets
CREATE TABLE `timesheets` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `project_id` int(10) UNSIGNED NOT NULL,
  `task_id` int(10) UNSIGNED DEFAULT NULL,
  `work_date` date NOT NULL,
  `duration_minutes` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `status` enum('draft','submitted','approved','rejected') DEFAULT 'draft',
  `approved_by` int(10) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`),
  KEY `employee_id` (`employee_id`),
  KEY `project_id` (`project_id`),
  KEY `work_date` (`work_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- FACE RECOGNITION & GEOFENCING
-- ============================================================

-- Face Embeddings
CREATE TABLE `face_embeddings` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `embedding` longtext NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Geofences
CREATE TABLE `geofences` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `radius_meters` int(11) NOT NULL DEFAULT 100,
  `address` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Locations
CREATE TABLE `employee_locations` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `captured_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AUTHENTICATION
-- ============================================================

-- OTP Tokens
CREATE TABLE `otp_tokens` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED DEFAULT NULL,
  `org_id` int(10) UNSIGNED DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `purpose` enum('login_2fa','password_reset','email_verify','phone_verify','withdrawal','org_signup') NOT NULL,
  `channel` enum('email','sms','authenticator') NOT NULL DEFAULT 'email',
  `attempts` tinyint(4) NOT NULL DEFAULT 0,
  `max_attempts` tinyint(4) NOT NULL DEFAULT 3,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `email_purpose` (`email`,`purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Verification Tokens
CREATE TABLE `email_verification_tokens` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED DEFAULT NULL,
  `org_id` int(10) UNSIGNED DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `purpose` enum('signup','email_change','org_registration') NOT NULL DEFAULT 'signup',
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `used_at` datetime DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password Reset Tokens
CREATE TABLE `password_reset_tokens` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Magic Link Tokens
CREATE TABLE `magic_link_tokens` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social Logins
CREATE TABLE `social_logins` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `provider` varchar(50) NOT NULL,
  `provider_user_id` varchar(255) NOT NULL,
  `profile_data` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_provider_user` (`provider`,`provider_user_id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trusted Devices
CREATE TABLE `trusted_devices` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `device_id` varchar(255) NOT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `trusted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_used_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_device` (`employee_id`,`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login Attempts
CREATE TABLE `login_attempts` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED DEFAULT NULL,
  `org_id` int(10) UNSIGNED DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `attempt_type` enum('password','otp','magic_link') NOT NULL DEFAULT 'password',
  `status` enum('success','failed','blocked') NOT NULL,
  `failure_reason` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `email_ip` (`email`,`ip_address`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Sessions
CREATE TABLE `user_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `refresh_token` varchar(255) DEFAULT NULL,
  `device_info` varchar(500) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `last_activity` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` datetime NOT NULL,
  `is_revoked` tinyint(1) NOT NULL DEFAULT 0,
  `revoked_at` datetime DEFAULT NULL,
  `revoked_reason` enum('logout','password_change','admin_action','expired','security') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `employee_id` (`employee_id`),
  KEY `expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh Tokens
CREATE TABLE `refresh_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `parent_token_hash` varchar(255) DEFAULT NULL,
  `device_id` varchar(100) DEFAULT NULL,
  `is_remember_me` tinyint(1) NOT NULL DEFAULT 0,
  `is_revoked` tinyint(1) NOT NULL DEFAULT 0,
  `revoked_at` datetime DEFAULT NULL,
  `revoked_reason` enum('logout','rotation','password_change','admin_action','suspicious') DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `last_used_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password History
CREATE TABLE `password_history` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLANS & ADDONS
-- ============================================================

-- Plans
CREATE TABLE `plans` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `user_limit` int(11) NOT NULL DEFAULT 10,
  `duration_days` int(11) NOT NULL DEFAULT 30,
  `features` longtext DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Addon Prices
CREATE TABLE `addon_prices` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `plan_type` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Organization Addons
CREATE TABLE `organization_addons` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `addon_id` int(10) UNSIGNED NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_org_addon` (`org_id`,`addon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ORGANIZATIONS & REGISTRATIONS
-- ============================================================

-- Org Registrations
CREATE TABLE `org_registrations` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `admin_first_name` varchar(100) DEFAULT NULL,
  `admin_last_name` varchar(100) DEFAULT NULL,
  `admin_password_hash` varchar(255) DEFAULT NULL,
  `plan_id` int(10) UNSIGNED DEFAULT NULL,
  `email_token` varchar(100) DEFAULT NULL,
  `email_token_expires` datetime DEFAULT NULL,
  `phone_otp_hash` varchar(255) DEFAULT NULL,
  `phone_otp_expires` datetime DEFAULT NULL,
  `step_completed` tinyint(4) NOT NULL DEFAULT 1,
  `status` enum('pending','email_verified','phone_verified','active','rejected','expired') NOT NULL DEFAULT 'pending',
  `org_id` int(10) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `expires_at` datetime NOT NULL DEFAULT (current_timestamp() + interval 48 hour),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Invitations
CREATE TABLE `employee_invitations` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `role_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('pending','accepted','expired','revoked') NOT NULL DEFAULT 'pending',
  `expires_at` datetime NOT NULL,
  `invited_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Org IP Whitelist
CREATE TABLE `org_ip_whitelist` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `ip_cidr` varchar(50) NOT NULL,
  `label` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NOTIFICATIONS & ANNOUNCEMENTS
-- ============================================================

-- Notifications
CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Announcements
CREATE TABLE `announcements` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `target` enum('all','department','role') NOT NULL DEFAULT 'all',
  `target_id` int(10) UNSIGNED DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'low',
  `published_at` datetime NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DOCUMENTS
-- ============================================================

-- Documents
CREATE TABLE `documents` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `category` enum('policy','contract','id_proof','education','other') DEFAULT 'other',
  `is_public` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document Access Logs
CREATE TABLE `document_access_logs` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `doc_id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `action` enum('view','download','share','delete') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `accessed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `doc_id` (`doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PAYMENTS & INVOICES
-- ============================================================

-- Payments
CREATE TABLE `payments` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `plan_id` int(10) UNSIGNED DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `payment_method` varchar(50) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','success','failed','refunded','disputed') DEFAULT 'pending',
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices
CREATE TABLE `invoices` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `tax_percent` decimal(5,2) DEFAULT 18.00,
  `tax_amount` decimal(12,2) GENERATED ALWAYS AS (round(`subtotal` * `tax_percent` / 100,2)) STORED,
  `total` decimal(12,2) GENERATED ALWAYS AS (`subtotal` + round(`subtotal` * `tax_percent` / 100,2)) STORED,
  `is_void` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `payment_id` (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AUDIT & SECURITY
-- ============================================================

-- Audit Logs
CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED DEFAULT NULL,
  `employee_id` int(10) UNSIGNED DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `entity_name` varchar(100) DEFAULT NULL,
  `entity_id` varchar(50) DEFAULT NULL,
  `old_values` longtext DEFAULT NULL,
  `new_values` longtext DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `is_immutable` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `module` (`module`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API Rate Limits
CREATE TABLE `api_rate_limits` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `endpoint` varchar(255) DEFAULT NULL,
  `hits` int(11) DEFAULT 1,
  `reset_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ip_address` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data Erasure Requests
CREATE TABLE `data_erasure_requests` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','processing','completed','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LEGACY TABLES (for compatibility)
-- ============================================================

-- Users (legacy)
CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) DEFAULT NULL,
  `email` varchar(254) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auth Access Tokens (legacy)
CREATE TABLE `auth_access_tokens` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_id` int(10) UNSIGNED NOT NULL,
  `type` varchar(100) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `hash` varchar(255) NOT NULL,
  `abilities` text NOT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tokenable_id` (`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adonis Schema (legacy)
CREATE TABLE `adonis_schema` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  `migration_time` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adonis Schema Versions (legacy)
CREATE TABLE `adonis_schema_versions` (
  `version` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert Plans
INSERT INTO `plans` (`name`, `price`, `user_limit`, `duration_days`, `features`, `is_active`) VALUES
('Starter', 0.00, 10, 30, '{"attendance":true,"leave":true}', 1),
('Professional', 2999.00, 50, 30, '{"attendance":true,"leave":true,"payroll":true}', 1),
('Enterprise', 9999.00, 500, 365, '{"all":true}', 1);

-- Insert Addon Prices
INSERT INTO `addon_prices` (`name`, `slug`, `description`, `price`, `is_active`) VALUES
('Advanced Payroll & Tax', 'payroll-advance', 'Statutory compliance, TDS, and automated tax filing.', 999.00, 1),
('Recruitment & ATS', 'recruitment', 'Applicant tracking system, job portals, and interview scheduling.', 1499.00, 1),
('Performance & OKRs', 'performance', 'Quarterly reviews, OKR tracking, and 360-degree feedback.', 799.00, 1),
('Asset Management', 'assets', 'Track company assets, assignments, and depreciation.', 499.00, 1),
('Biometric Integration', 'biometric', 'Hardware sync for biometric attendance devices.', 1999.00, 1),
('Geo-fencing Attendance', 'geofencing', 'Restricted attendance marking based on GPS coordinates.', 299.00, 1),
('Face Recognition', 'face-recognition', 'AI-powered face recognition for touchless attendance.', 2499.00, 1),
('Employee Tracking', 'tracking', 'Real-time GPS tracking and route history for field staff.', 699.00, 1),
('Advanced Analytics', 'analytics', 'Custom reports and predictive HR dashboard.', 599.00, 1),
('Learning Management (LMS)', 'lms', 'Employee training, courses, and certifications.', 1299.00, 1),
('Document Management (Advanced)', 'dms-advance', 'Unlimited storage and version control for documents.', 399.00, 1),
('AI HR Assistant', 'ai-hr', 'Resume parsing and sentiment analysis features.', 899.00, 1);

-- Insert Organizations
INSERT INTO `organizations` (`company_name`, `slug`, `email`, `phone`, `country`, `plan_id`, `plan_status`, `user_limit`, `is_active`, `is_verified`, `timezone`) VALUES
('apple test', 'apple-test', 'nikhilkushwah729@gmail.com', '6266330976', 'India', 1, 1, 10, 1, 1, 'Asia/Kolkata'),
('Acme Technologies', 'acme-tech', 'admin@acmetech.in', NULL, 'India', 2, 1, 50, 1, 1, 'Asia/Kolkata'),
('Global Solutions', 'global-sol', 'contact@globalsol.com', NULL, 'USA', 3, 1, 500, 1, 1, 'America/New_York');

-- Insert Roles
INSERT INTO `roles` (`org_id`, `role_name`, `is_system`) VALUES
(1, 'Admin', 1),
(1, 'HR', 1),
(1, 'Manager', 1),
(1, 'Employee', 1),
(2, 'Admin', 1),
(2, 'HR', 1),
(2, 'Employee', 1),
(3, 'Admin', 1),
(3, 'HR', 1),
(3, 'Manager', 1),
(3, 'Employee', 1);

-- Insert Departments
INSERT INTO `departments` (`org_id`, `department_name`, `is_active`) VALUES
(1, 'Technical', 1),
(1, 'HR', 1),
(1, 'Sales', 1),
(2, 'Engineering', 1),
(2, 'Marketing', 1),
(3, 'Operations', 1);

-- Insert Leave Types
INSERT INTO `leave_types` (`org_id`, `type_name`, `days_allowed`, `carry_forward`, `max_carry_days`, `is_paid`, `requires_doc`) VALUES
(1, 'Casual Leave', 12, 0, 0, 1, 0),
(1, 'Sick Leave', 8, 0, 0, 1, 1),
(1, 'Earned Leave', 15, 1, 30, 1, 0),
(2, 'Casual Leave', 10, 0, 0, 1, 0),
(2, 'Sick Leave', 10, 0, 0, 1, 1),
(3, 'Annual Leave', 20, 1, 10, 1, 0);

-- Insert Shifts
INSERT INTO `shifts` (`org_id`, `name`, `start_time`, `end_time`, `grace_time`, `work_days`) VALUES
(1, 'General Shift', '09:00:00', '18:00:00', 15, '1,2,3,4,5'),
(1, 'Night Shift', '22:00:00', '06:00:00', 10, '1,2,3,4,5,6,0'),
(2, 'Morning Shift', '08:00:00', '17:00:00', 30, '1,2,3,4,5');

-- Insert Holidays
INSERT INTO `holidays` (`org_id`, `name`, `holiday_date`, `type`) VALUES
(1, 'Republic Day', '2026-01-26', 'national'),
(1, 'Independence Day', '2026-08-15', 'national'),
(1, 'Diwali', '2026-10-20', 'company'),
(2, 'New Year', '2026-01-01', 'national'),
(3, 'Thanksgiving', '2026-11-26', 'national');

-- Insert Employees
INSERT INTO `employees` (`org_id`, `department_id`, `role_id`, `first_name`, `last_name`, `email`, `phone`, `status`, `email_verified`, `join_date`) VALUES
(1, 1, 1, 'Nikhil', 'Kushwah', 'nikhilkushwah729@gmail.com', '6266330976', 'active', 1, '2026-01-01'),
(1, 1, 4, 'John', 'Doe', 'john@appletest.com', '1234567890', 'active', 1, '2026-01-15'),
(2, 4, 5, 'Rahul', 'Sharma', 'rahul.sharma@acmetech.in', NULL, 'active', 1, '2025-06-01'),
(2, 4, 7, 'Amit', 'Verma', 'amit.verma@acmetech.in', NULL, 'active', 1, '2025-08-15'),
(3, 6, 9, 'Sarah', 'Conner', 'sarah@globalsol.com', NULL, 'active', 1, '2025-03-01');

-- Insert Announcements
INSERT INTO `announcements` (`org_id`, `created_by`, `title`, `content`, `target`, `priority`, `published_at`, `expires_at`) VALUES
(1, 1, 'Welcome to HRMS', 'Welcome to the new HR Management System!', 'all', 'high', '2026-01-01 09:00:00', '2026-12-31 23:59:59'),
(1, 1, 'Office Timing Update', 'Office timing is now 9:30 AM to 6:30 PM', 'all', 'medium', '2026-03-01 09:00:00', '2026-04-01 09:00:00'),
(2, 3, 'Quarterly Meeting', 'All hands quarterly meeting on Friday', 'all', 'medium', '2026-03-01 10:00:00', '2026-03-07 10:00:00');


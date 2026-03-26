-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Mar 05, 2026 at 12:06 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hrms_complete`
--

-- --------------------------------------------------------

--
-- Table structure for table `addon_prices`
--

CREATE TABLE `addon_prices` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `plan_type` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `addon_prices`
--

INSERT INTO `addon_prices` (`id`, `name`, `slug`, `description`, `price`, `plan_type`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Advanced Payroll & Tax', 'payroll-advance', 'Statutory compliance, TDS, and automated tax filing.', 999.00, NULL, 1, '2026-03-04 14:55:14', '2026-03-04 14:55:14'),
(2, 'Recruitment & ATS', 'recruitment', 'Applicant tracking system, job portals, and interview scheduling.', 1499.00, NULL, 1, '2026-03-04 14:55:14', '2026-03-04 14:55:14'),
(3, 'Performance & OKRs', 'performance', 'Quarterly reviews, OKR tracking, and 360-degree feedback.', 799.00, NULL, 1, '2026-03-04 14:55:14', '2026-03-04 14:55:14'),
(4, 'Asset Management', 'assets', 'Track company assets, assignments, and depreciation.', 499.00, NULL, 1, '2026-03-04 14:55:14', '2026-03-04 14:55:14'),
(5, 'Biometric Integration', 'biometric', 'Hardware sync for biometric attendance devices.', 1999.00, NULL, 1, '2026-03-04 14:55:14', '2026-03-04 14:55:14'),
(6, 'Geo-fencing Attendance', 'geofencing', 'Restricted attendance marking based on GPS coordinates.', 299.00, NULL, 1, '2026-03-04 14:55:14', '2026-03-04 14:55:14'),
(7, 'Face Recognition', 'face-recognition', 'AI-powered face recognition for touchless attendance.', 2499.00, NULL, 1, '2026-03-04 14:55:14', '2026-03-04 14:55:14'),
(8, 'Employee Tracking', 'tracking', 'Real-time GPS tracking and route history for field staff.', 699.00, NULL, 1, '2026-03-04 14:55:14', '2026-03-04 14:55:14'),
(9, 'Advanced Analytics', 'analytics', 'Custom reports and predictive HR dashboard.', 599.00, NULL, 1, '2026-03-04 14:55:14', '2026-03-04 14:55:14'),
(10, 'Learning Management (LMS)', 'lms', 'Employee training, courses, and certifications.', 1299.00, NULL, 1, '2026-03-04 14:55:14', '2026-03-04 14:55:14'),
(11, 'Document Management (Advanced)', 'dms-advance', 'Unlimited storage and version control for documents.', 399.00, NULL, 1, '2026-03-04 14:55:14', '2026-03-04 14:55:14'),
(12, 'AI HR Assistant', 'ai-hr', 'Resume parsing and sentiment analysis features.', 899.00, NULL, 1, '2026-03-04 14:55:14', '2026-03-04 14:55:14');

-- --------------------------------------------------------

--
-- Table structure for table `adonis_schema`
--

CREATE TABLE `adonis_schema` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  `migration_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `adonis_schema`
--

INSERT INTO `adonis_schema` (`id`, `name`, `batch`, `migration_time`) VALUES
(1, 'database/migrations/1761885935168_create_users_table', 1, '2026-03-01 09:55:50'),
(2, 'database/migrations/1768620764696_create_access_tokens_table', 1, '2026-03-01 10:02:40');

-- --------------------------------------------------------

--
-- Table structure for table `adonis_schema_versions`
--

CREATE TABLE `adonis_schema_versions` (
  `version` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `adonis_schema_versions`
--

INSERT INTO `adonis_schema_versions` (`version`) VALUES
(2);

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `org_id`, `created_by`, `title`, `content`, `target`, `target_id`, `priority`, `published_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 3, 1, 'Office Timing Update', 'Starting from next Monday, office timing will be 9:30 AM to 6:30 PM.', 'all', NULL, 'medium', '2026-03-04 22:27:26', '2026-04-03 22:27:26', '2026-03-04 16:57:26', '2026-03-04 16:58:16'),
(2, 1, 1, 'Urgent Server Maintenance', 'Server maintenance is scheduled tonight from 11 PM to 2 AM. System may be unavailable.', 'all', NULL, 'urgent', '2026-03-04 22:27:26', '2026-03-06 22:27:26', '2026-03-04 16:57:26', '2026-03-04 16:57:26'),
(3, 1, 2, 'HR Policy Update', 'Leave policy has been updated. Please check the HR portal for details.', 'department', 3, 'high', '2026-03-04 22:27:26', '2026-03-19 22:27:26', '2026-03-04 16:57:26', '2026-03-04 16:57:26'),
(4, 1, 3, 'Sales Target Announcement', 'New quarterly sales targets have been assigned. Please review your dashboard.', 'role', 2, 'high', '2026-03-04 22:27:26', '2026-05-03 22:27:26', '2026-03-04 16:57:26', '2026-03-04 16:57:26'),
(5, 3, 1, 'Holiday Notice', 'Office will remain closed on Holi festival.', 'all', NULL, 'low', '2026-03-04 22:27:26', '2026-03-14 22:27:26', '2026-03-04 16:57:26', '2026-03-04 16:59:16');

-- --------------------------------------------------------

--
-- Table structure for table `api_rate_limits`
--

CREATE TABLE `api_rate_limits` (
  `id` int(10) UNSIGNED NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `endpoint` varchar(255) DEFAULT NULL,
  `hits` int(11) DEFAULT 1,
  `reset_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `attendance_date` date NOT NULL,
  `check_in` datetime DEFAULT NULL,
  `check_out` datetime DEFAULT NULL,
  `work_hours` decimal(5,2) GENERATED ALWAYS AS (round(timestampdiff(MINUTE,`check_in`,`check_out`) / 60,2)) STORED,
  `check_in_lat` decimal(10,8) DEFAULT NULL,
  `check_in_lng` decimal(11,8) DEFAULT NULL,
  `check_out_lat` decimal(10,8) DEFAULT NULL,
  `check_out_lng` decimal(11,8) DEFAULT NULL,
  `status` enum('present','absent','half_day','late','on_leave','holiday','weekend') DEFAULT 'present',
  `source` enum('manual','biometric','mobile','web','geo_fence') DEFAULT 'web',
  `notes` varchar(500) DEFAULT NULL,
  `modified_by` int(10) UNSIGNED DEFAULT NULL,
  `modified_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendances`
--

CREATE TABLE `attendances` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendances`
--

INSERT INTO `attendances` (`id`, `employee_id`, `org_id`, `shift_id`, `attendance_date`, `check_in`, `check_out`, `check_in_lat`, `check_in_lng`, `check_out_lat`, `check_out_lng`, `device_info`, `selfie_url`, `biometric_ref`, `status`, `is_late`, `is_half_day`, `is_overtime`, `total_break_min`, `net_work_hours`, `source`, `notes`, `modified_by`, `modified_at`, `created_at`) VALUES
(5, 4, 3, NULL, '2026-03-04', '2026-03-04 15:55:37', NULL, 0.00000000, 0.00000000, NULL, NULL, 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36', NULL, NULL, 'present', 0, 0, 0, 0, 0.00, 'web', NULL, NULL, NULL, '2026-03-04 10:25:37'),
(6, 4, 3, NULL, '2026-03-04', '2026-03-04 15:56:59', NULL, 0.00000000, 0.00000000, NULL, NULL, 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36', 'mock-uploaded-url.jpg', NULL, 'present', 0, 0, 0, 0, 0.00, 'camera', NULL, NULL, NULL, '2026-03-04 10:26:59'),
(7, 4, 3, NULL, '2026-03-04', '2026-03-04 15:59:45', NULL, 0.00000000, 0.00000000, NULL, NULL, 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36', NULL, 'BIO-TD3LOQ', 'present', 0, 0, 0, 0, 0.00, 'biometric', NULL, NULL, NULL, '2026-03-04 10:29:45'),
(8, 4, 3, NULL, '2026-03-04', '2026-03-04 16:04:19', NULL, 0.00000000, 0.00000000, NULL, NULL, 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36', 'mock-uploaded-url.jpg', NULL, 'present', 0, 0, 0, 0, 0.00, 'face', NULL, NULL, NULL, '2026-03-04 10:34:20'),
(9, 4, 3, NULL, '2026-03-04', '2026-03-04 16:15:16', NULL, 26.17839665, 78.13968268, NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, 'BIO-SCRKIV', 'present', 0, 0, 0, 0, 0.00, 'biometric', NULL, NULL, NULL, '2026-03-04 10:45:16'),
(10, 4, 3, NULL, '2026-03-04', '2026-03-04 16:46:46', NULL, 26.17840785, 78.13969914, NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', NULL, NULL, 'present', 0, 0, 0, 0, 0.00, 'web', NULL, NULL, NULL, '2026-03-04 11:16:46'),
(11, 4, 3, NULL, '2026-03-05', '2026-03-05 11:02:38', NULL, 26.17831758, 78.13941018, NULL, NULL, NULL, '/uploads/attendances/f257feeb-688c-4bf6-b4bf-54fbd0e6cc44-4.jpg', NULL, 'present', 0, 0, 0, 0, 0.00, 'camera', NULL, NULL, NULL, '2026-03-05 05:32:38');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_regularizations`
--

CREATE TABLE `attendance_regularizations` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED DEFAULT NULL,
  `employee_id` int(10) UNSIGNED DEFAULT NULL,
  `action` varchar(100) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, etc.',
  `module` varchar(50) NOT NULL COMMENT 'employees, payroll, etc.',
  `entity_name` varchar(100) DEFAULT NULL,
  `entity_id` varchar(50) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `is_immutable` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_access_tokens`
--

CREATE TABLE `auth_access_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
  `tokenable_id` int(10) UNSIGNED NOT NULL,
  `type` varchar(100) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `hash` varchar(255) NOT NULL,
  `abilities` text NOT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `data_erasure_requests`
--

CREATE TABLE `data_erasure_requests` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','processing','completed','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `parent_id` int(10) UNSIGNED DEFAULT NULL,
  `department_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designations`
--

CREATE TABLE `designations` (
  `id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `department_id` int(10) UNSIGNED DEFAULT NULL,
  `designation_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `category` enum('policy','contract','id_proof','education','other') DEFAULT 'other',
  `is_public` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_access_logs`
--

CREATE TABLE `document_access_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `doc_id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `action` enum('view','download','share','delete') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `accessed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_verification_tokens`
--

CREATE TABLE `email_verification_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_invitations`
--

CREATE TABLE `employee_invitations` (
  `id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `role_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('pending','accepted','expired','revoked') NOT NULL DEFAULT 'pending',
  `expires_at` datetime NOT NULL,
  `invited_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_locations`
--

CREATE TABLE `employee_locations` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `captured_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_shifts`
--

CREATE TABLE `employee_shifts` (
  `employee_id` int(10) UNSIGNED NOT NULL,
  `shift_id` int(10) UNSIGNED NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `holidays`
--

CREATE TABLE `holidays` (
  `id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `holiday_date` date NOT NULL,
  `type` enum('national','company','optional') DEFAULT 'company',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(10) UNSIGNED NOT NULL,
  `payment_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `tax_percent` decimal(5,2) DEFAULT 18.00,
  `tax_amount` decimal(12,2) GENERATED ALWAYS AS (round(`subtotal` * `tax_percent` / 100,2)) STORED,
  `total` decimal(12,2) GENERATED ALWAYS AS (`subtotal` + round(`subtotal` * `tax_percent` / 100,2)) STORED,
  `is_void` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leaves`
--

CREATE TABLE `leaves` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_types`
--

CREATE TABLE `leave_types` (
  `id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `days_allowed` int(11) NOT NULL DEFAULT 0,
  `carry_forward` tinyint(1) DEFAULT 0,
  `max_carry_days` int(11) DEFAULT 0,
  `is_paid` tinyint(1) DEFAULT 1,
  `requires_doc` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED DEFAULT NULL,
  `org_id` int(10) UNSIGNED DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `attempt_type` enum('password','otp','magic_link') NOT NULL DEFAULT 'password',
  `status` enum('success','failed','blocked') NOT NULL,
  `failure_reason` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `magic_link_tokens`
--

CREATE TABLE `magic_link_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `organizations`
--

CREATE TABLE `organizations` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `organization_addons`
--

CREATE TABLE `organization_addons` (
  `id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `addon_id` int(10) UNSIGNED NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `org_ip_whitelist`
--

CREATE TABLE `org_ip_whitelist` (
  `id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `ip_cidr` varchar(50) NOT NULL,
  `label` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `org_registrations`
--

CREATE TABLE `org_registrations` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `otp_tokens`
--

CREATE TABLE `otp_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_history`
--

CREATE TABLE `password_history` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `plan_id` int(10) UNSIGNED DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `payment_method` varchar(50) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','success','failed','refunded','disputed') DEFAULT 'pending',
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payroll`
--

CREATE TABLE `payroll` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `is_locked` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payroll_settings`
--

CREATE TABLE `payroll_settings` (
  `id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `pf_percent` decimal(5,2) DEFAULT 12.00,
  `esi_percent` decimal(5,2) DEFAULT 0.75,
  `tax_slabs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tax_slabs`)),
  `pay_day` tinyint(4) DEFAULT 1,
  `currency` varchar(10) DEFAULT 'INR',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(10) UNSIGNED NOT NULL,
  `permission_key` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `module` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

CREATE TABLE `plans` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `user_limit` int(11) NOT NULL DEFAULT 10,
  `duration_days` int(11) NOT NULL DEFAULT 30,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for--

CREATE TABLE `projects` (
  `id` int table `projects`
(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_members`
--

CREATE TABLE `project_members` (
  `project_id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `role` varchar(100) DEFAULT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED DEFAULT NULL,
  `role_name` varchar(100) NOT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int(10) UNSIGNED NOT NULL,
  `permission_id` int(10) UNSIGNED NOT NULL,
  `granted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shifts`
--

CREATE TABLE `shifts` (
  `id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `grace_time` int(11) DEFAULT 15,
  `work_days` varchar(50) DEFAULT '1,2,3,4,5',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `social_logins`
--

CREATE TABLE `social_logins` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `provider` varchar(50) NOT NULL COMMENT 'google, github, microsoft, etc.',
  `provider_user_id` varchar(255) NOT NULL,
  `profile_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`profile_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `timesheets`
--

CREATE TABLE `timesheets` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trusted_devices`
--

CREATE TABLE `trusted_devices` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `device_id` varchar(255) NOT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `trusted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_used_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `email` varchar(254) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


-- ============================================================
-- HRMS COMPLETE DATABASE - ALL IN ONE (FIXED)
-- Version: 1.0
-- ============================================================

DROP DATABASE IF EXISTS hrms_complete;
CREATE DATABASE hrms_complete;
USE hrms_complete;

-- ============================================================
-- CORE TABLES (No Foreign Keys)
-- ============================================================

CREATE TABLE organizations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(500),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    role_id INT DEFAULT 4,
    employee_code VARCHAR(50) UNIQUE,
    department_id INT,
    phone VARCHAR(20),
    photo VARCHAR(500),
    status ENUM('active', 'inactive', 'on_leave', 'terminated') DEFAULT 'active',
    organization_id INT DEFAULT 1,
    is_locked BOOLEAN DEFAULT FALSE,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE shifts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    late_threshold_minutes INT DEFAULT 15,
    half_day_threshold_hours DECIMAL(4,2) DEFAULT 4.00,
    full_day_threshold_hours DECIMAL(4,2) DEFAULT 8.00,
    is_night_shift BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_shifts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    shift_id INT NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    organization_id INT DEFAULT 1,
    date DATE NOT NULL,
    check_in_time DATETIME,
    check_out_time DATETIME,
    check_in_latitude DECIMAL(10, 8),
    check_in_longitude DECIMAL(11, 8),
    check_out_latitude DECIMAL(10, 8),
    check_out_longitude DECIMAL(11, 8),
    check_in_photo VARCHAR(500),
    check_out_photo VARCHAR(500),
    check_in_source ENUM('web', 'mobile', 'face', 'biometric', 'gps') DEFAULT 'web',
    check_out_source ENUM('web', 'mobile', 'face', 'biometric', 'gps') DEFAULT 'web',
    shift_id INT,
    status ENUM('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday', 'weekend') DEFAULT 'absent',
    late_minutes INT DEFAULT 0,
    early_leave_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    work_hours DECIMAL(5,2) DEFAULT 0.00,
    break_minutes INT DEFAULT 0,
    remarks TEXT,
    approved_by INT,
    approved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_attendance (employee_id, date)
);

CREATE TABLE attendance_breaks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attendance_id INT NOT NULL,
    employee_id INT NOT NULL,
    break_type ENUM('lunch', 'short', 'other') DEFAULT 'short',
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_minutes INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    requested_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    approved_at DATETIME,
    rejection_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE leave_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT DEFAULT 1,
    type_name VARCHAR(100) NOT NULL,
    type_code VARCHAR(20) NOT NULL,
    description TEXT,
    days_per_year INT DEFAULT 0,
    is_paid BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    color VARCHAR(20) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leave_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    year INT NOT NULL,
    total_days DECIMAL(5,2) DEFAULT 0.00,
    used_days DECIMAL(5,2) DEFAULT 0.00,
    pending_days DECIMAL(5,2) DEFAULT 0.00,
    remaining_days DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_balance (employee_id, leave_type_id, year)
);

CREATE TABLE leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(5,2) NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    approved_by INT,
    approved_at DATETIME,
    rejection_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE face_embeddings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    organization_id INT DEFAULT 1,
    embedding_data JSON NOT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_verified_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_employee_face (employee_id)
);

CREATE TABLE geofences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INT DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
    target_audience ENUM('all', 'employees', 'admins') DEFAULT 'all',
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    entity_id INT,
    entity_name VARCHAR(100),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE holidays (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- AUTH TABLES (No Foreign Keys)
-- ============================================================

CREATE TABLE plans (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    max_employees INT DEFAULT 10,
    features JSON,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE org_registrations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    country VARCHAR(100),
    admin_first_name VARCHAR(100),
    admin_last_name VARCHAR(100),
    admin_password_hash VARCHAR(255),
    plan_id INT UNSIGNED,
    email_token VARCHAR(100) UNIQUE,
    step_completed TINYINT NOT NULL DEFAULT 1,
    status ENUM('pending','email_verified','active','rejected','expired') NOT NULL DEFAULT 'pending',
    expires_at DATETIME NOT NULL DEFAULT (DATE_ADD(NOW(), INTERVAL 48 HOUR)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE email_verification_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(100) NOT NULL UNIQUE,
    token_hash VARCHAR(255) NOT NULL,
    purpose ENUM('signup','email_change','org_registration') NOT NULL DEFAULT 'signup',
    is_used TINYINT(1) NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_reset_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    is_used TINYINT(1) NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otp_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose ENUM('login_2fa','password_reset','email_verify','phone_verify') NOT NULL,
    channel ENUM('email','sms','authenticator_app') NOT NULL DEFAULT 'email',
    attempts TINYINT NOT NULL DEFAULT 0,
    is_used TINYINT(1) NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id INT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    is_remember_me TINYINT(1) NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    is_revoked TINYINT(1) NOT NULL DEFAULT 0,
    revoked_at DATETIME DEFAULT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE social_logins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id INT UNSIGNED NOT NULL,
    provider ENUM('google','microsoft','github','linkedin') NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_provider_id (provider, provider_id)
);

CREATE TABLE magic_link_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    is_used TINYINT(1) NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trusted_devices (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id INT UNSIGNED NOT NULL,
    device_token VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(255),
    device_type ENUM('desktop','mobile','tablet','unknown') DEFAULT 'unknown',
    is_trusted TINYINT(1) NOT NULL DEFAULT 1,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_invitations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    invite_token VARCHAR(100) NOT NULL UNIQUE,
    token_hash VARCHAR(255) NOT NULL,
    status ENUM('pending','accepted','expired','revoked') NOT NULL DEFAULT 'pending',
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE login_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    status ENUM('success','failed','locked','2fa_required') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO roles (id, name, permissions) VALUES 
(1, 'Super Admin', '["all"]'),
(2, 'Admin', '["employees.view", "employees.create", "employees.edit", "attendance.view", "leaves.view", "leaves.approve", "reports.view"]'),
(3, 'HR', '["employees.view", "employees.create", "attendance.view", "leaves.view", "leaves.approve"]'),
(4, 'Employee', '["attendance.view", "leaves.view", "leaves.apply"]');

INSERT INTO leave_types (type_name, type_code, days_per_year, is_paid, color) VALUES 
('Annual Leave', 'AL', 20, 1, '#22C55E'),
('Sick Leave', 'SL', 10, 1, '#EF4444'),
('Casual Leave', 'CL', 5, 1, '#3B82F6'),
('Maternity Leave', 'ML', 90, 1, '#EC4899'),
('Paternity Leave', 'PL', 7, 1, '#8B5CF6'),
('Unpaid Leave', 'UL', 0, 0, '#6B7280');

INSERT INTO shifts (name, start_time, end_time, late_threshold_minutes) VALUES 
('General Shift', '09:00:00', '18:00:00', 15),
('Morning Shift', '06:00:00', '14:00:00', 10),
('Night Shift', '22:00:00', '06:00:00', 0);

-- Admin user (password: admin123)
INSERT INTO users (email, password, first_name, last_name, role_id, employee_code, status) VALUES 
('admin@company.com', '$2a$10$xGJ9Q7K5Y8F3R4P6L8N0O.1cE9D2F3G4H5I6J7K8L9M0N1O2P', 'Super', 'Admin', 1, 'EMP001', 'active');

INSERT INTO plans (name, description, price_monthly, price_yearly, max_employees, features, is_active) VALUES
('Free', 'For small teams', 0, 0, 10, '["attendance", "leaves"]', 1),
('Pro', 'For growing businesses', 29, 290, 100, '["attendance", "leaves", "reports", "face"]', 1),
('Enterprise', 'Full features', 99, 990, 999999, '["all"]', 1);

-- ============================================================
-- DONE!
-- ============================================================
SELECT 'Database created successfully!' AS message;
</parameter>
</create_file>

-- =====================================================
-- HRMS Complete Database Schema
-- =====================================================

-- ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
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

-- DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    manager_id INT,
    parent_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org (organization_id)
);

-- ROLES
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USERS / EMPLOYEES
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    role_id INT DEFAULT 4,
    employee_code VARCHAR(50) UNIQUE,
    department_id INT,
    manager_id INT,
    phone VARCHAR(20),
    photo VARCHAR(500),
    status ENUM('active', 'inactive', 'on_leave', 'terminated') DEFAULT 'active',
    organization_id INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_employee_code (employee_code),
    INDEX idx_status (status),
    INDEX idx_department (department_id)
);

-- SHIFTS
CREATE TABLE IF NOT EXISTS shifts (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_org (organization_id)
);

CREATE TABLE IF NOT EXISTS employee_shifts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    shift_id INT NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_employee (employee_id),
    INDEX idx_shift (shift_id)
);

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS attendances (
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
    UNIQUE KEY unique_attendance (employee_id, date),
    INDEX idx_employee_date (employee_id, date),
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_month (year(date), month(date))
);

-- ATTENDANCE BREAKS
CREATE TABLE IF NOT EXISTS attendance_breaks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attendance_id INT NOT NULL,
    employee_id INT NOT NULL,
    break_type ENUM('lunch', 'short', 'other') DEFAULT 'short',
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_minutes INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attendance (attendance_id),
    INDEX idx_employee (employee_id)
);

-- MANUAL ATTENDANCE REQUESTS
CREATE TABLE IF NOT EXISTS attendance_requests (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employee (employee_id),
    INDEX idx_status (status)
);

-- LEAVE TYPES
CREATE TABLE IF NOT EXISTS leave_types (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_org (organization_id)
);

-- LEAVE BALANCES
CREATE TABLE IF NOT EXISTS leave_balances (
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
    UNIQUE KEY unique_balance (employee_id, leave_type_id, year),
    INDEX idx_employee (employee_id),
    INDEX idx_leave_type (leave_type_id)
);

-- LEAVE REQUESTS
CREATE TABLE IF NOT EXISTS leave_requests (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
);

-- FACE RECOGNITION
CREATE TABLE IF NOT EXISTS face_embeddings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    organization_id INT DEFAULT 1,
    embedding_data JSON NOT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_verified_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_employee_face (employee_id),
    INDEX idx_employee (employee_id),
    INDEX idx_org (organization_id)
);

-- GEOFENCES
CREATE TABLE IF NOT EXISTS geofences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INT DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_org (organization_id)
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_is_read (is_read)
);

-- ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org (organization_id)
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_module (module),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
);

-- HOLIDAYS
CREATE TABLE IF NOT EXISTS holidays (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_org (organization_id),
    INDEX idx_date (date)
);

-- DEFAULT DATA
INSERT INTO organizations (id, name, email, phone) VALUES (1, 'Default Organization', 'admin@company.com', '+1234567890')
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO roles (id, name, permissions) VALUES 
(1, 'Super Admin', '["all"]'),
(2, 'Admin', '["employees.view", "employees.create", "employees.edit", "employees.delete", "attendance.view", "attendance.manage", "leaves.view", "leaves.approve", "reports.view", "settings.manage"]'),
(3, 'HR', '["employees.view", "employees.create", "employees.edit", "attendance.view", "leaves.view", "leaves.approve", "reports.view"]'),
(4, 'Employee', '["attendance.view", "leaves.view", "leaves.apply"]')
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO leave_types (organization_id, type_name, type_code, days_per_year, is_paid, color) VALUES 
(1, 'Annual Leave', 'AL', 20, TRUE, '#22C55E'),
(1, 'Sick Leave', 'SL', 10, TRUE, '#EF4444'),
(1, 'Casual Leave', 'CL', 5, TRUE, '#3B82F6'),
(1, 'Maternity Leave', 'ML', 90, TRUE, '#EC4899'),
(1, 'Paternity Leave', 'PL', 7, TRUE, '#8B5CF6'),
(1, 'Unpaid Leave', 'UL', 0, FALSE, '#6B7280')
ON DUPLICATE KEY UPDATE type_name = type_name;

INSERT INTO shifts (organization_id, name, start_time, end_time, late_threshold_minutes) VALUES 
(1, 'General Shift', '09:00:00', '18:00:00', 15),
(1, 'Morning Shift', '06:00:00', '14:00:00', 10),
(1, 'Night Shift', '22:00:00', '06:00:00', 0)
ON DUPLICATE KEY UPDATE name = name;

-- Default admin (password: admin123)
INSERT INTO users (id, email, password, first_name, last_name, role_id, employee_code, organization_id, status) VALUES 
(1, 'admin@company.com', '$2a$10$xGJ9Q7K5Y8F3R4P6L8N0O.1cE9D2F3G4H5I6J7K8L9M0N1O2P', 'Super', 'Admin', 1, 'EMP001', 1, 'active')
ON DUPLICATE KEY UPDATE email = email;</parameter>
</create_file>

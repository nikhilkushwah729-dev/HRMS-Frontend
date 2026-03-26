-- ============================================================
-- ATTENDANCE TABLE
-- Complete Attendance tracking with all features
-- ============================================================

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
);</parameter>
</create_file>

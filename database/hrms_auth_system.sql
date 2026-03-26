-- ============================================================
-- HRMS - COMPLETE AUTH SYSTEM (SignIn / SignUp)
-- Version: 1.0
-- Compatible: MySQL 8.0+ / MariaDB 10.4+
--
-- COVERS:
-- [A1]  Organization Registration (Super Admin Signup)
-- [A2]  Employee Login (with org subdomain/code)
-- [A3]  Email Verification (after signup)
-- [A4]  Forgot Password / Reset Password
-- [A5]  OTP / 2FA (Two-Factor Auth)
-- [A6]  Remember Me / Persistent Sessions
-- [A7]  Social Login (Google / Microsoft OAuth)
-- [A8]  Magic Link Login (passwordless)
-- [A9]  Account Lockout after failed attempts
-- [A10] Refresh Token Rotation
-- [A11] Device Trust / Known Devices
-- [A12] Invitation System (HR invites employee)
-- ============================================================

USE `hrms_complete`;

-- ============================================================
-- [A1] ORG REGISTRATION
-- Jab ek naya company signup karta hai (Super Admin)
-- Status: pending → verified → active
-- ============================================================
CREATE TABLE IF NOT EXISTS org_registrations (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_name      VARCHAR(255) NOT NULL,
  email             VARCHAR(255) NOT NULL UNIQUE,
  phone             VARCHAR(20),
  country           VARCHAR(100),
  admin_first_name  VARCHAR(100),
  admin_last_name   VARCHAR(100),
  admin_password_hash VARCHAR(255),
  plan_id           INT UNSIGNED DEFAULT NULL,
  email_token       VARCHAR(100) UNIQUE,
  email_token_expires DATETIME,
  phone_otp_hash    VARCHAR(255),
  phone_otp_expires DATETIME,
  step_completed    TINYINT NOT NULL DEFAULT 1,
  status            ENUM('pending','email_verified','phone_verified','active','rejected','expired') NOT NULL DEFAULT 'pending',
  org_id            INT UNSIGNED DEFAULT NULL,
  approved_at       DATETIME DEFAULT NULL,
  rejection_reason  VARCHAR(255),
  ip_address        VARCHAR(45),
  user_agent        VARCHAR(500),
  expires_at        DATETIME NOT NULL DEFAULT (DATE_ADD(NOW(), INTERVAL 48 HOUR)),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email       (email),
  INDEX idx_token       (email_token),
  INDEX idx_status      (status),
  INDEX idx_expires     (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- [A3] EMAIL VERIFICATION TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id  INT UNSIGNED DEFAULT NULL,
  org_id       INT UNSIGNED DEFAULT NULL,
  email        VARCHAR(255) NOT NULL,
  token        VARCHAR(100) NOT NULL UNIQUE,
  token_hash   VARCHAR(255) NOT NULL,
  purpose      ENUM('signup','email_change','org_registration') NOT NULL DEFAULT 'signup',
  is_used      TINYINT(1) NOT NULL DEFAULT 0,
  used_at      DATETIME DEFAULT NULL,
  expires_at   DATETIME NOT NULL,
  ip_address   VARCHAR(45),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token      (token),
  INDEX idx_email      (email),
  INDEX idx_expires    (expires_at),
  INDEX idx_employee   (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- [A4] PASSWORD RESET TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id  INT UNSIGNED NOT NULL,
  org_id       INT UNSIGNED NOT NULL,
  email        VARCHAR(255) NOT NULL,
  token_hash   VARCHAR(255) NOT NULL UNIQUE,
  is_used      TINYINT(1) NOT NULL DEFAULT 0,
  used_at      DATETIME DEFAULT NULL,
  expires_at   DATETIME NOT NULL,
  ip_requested VARCHAR(45),
  ip_used      VARCHAR(45),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token    (token_hash),
  INDEX idx_employee (employee_id),
  INDEX idx_expires  (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- [A5] OTP TOKENS (2FA + Login OTP + Phone verify)
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_tokens (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id  INT UNSIGNED DEFAULT NULL,
  org_id       INT UNSIGNED DEFAULT NULL,
  email        VARCHAR(255) NOT NULL,
  otp_hash     VARCHAR(255) NOT NULL,
  purpose      ENUM('login_2fa','password_reset','email_verify','phone_verify','withdrawal','org_signup') NOT NULL,
  channel      ENUM('email','sms','authenticator_app') NOT NULL DEFAULT 'email',
  attempts     TINYINT NOT NULL DEFAULT 0,
  max_attempts TINYINT NOT NULL DEFAULT 3,
  is_used      TINYINT(1) NOT NULL DEFAULT 0,
  expires_at   DATETIME NOT NULL,
  used_at      DATETIME DEFAULT NULL,
  ip_address   VARCHAR(45),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_purpose (email, purpose),
  INDEX idx_expires       (expires_at),
  INDEX idx_employee      (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- [A6][A10] REFRESH TOKENS (Remember Me + JWT Refresh)
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT UNSIGNED NOT NULL,
  org_id          INT UNSIGNED NOT NULL,
  token_hash      VARCHAR(255) NOT NULL UNIQUE,
  parent_token_hash VARCHAR(255) DEFAULT NULL,
  device_id       VARCHAR(100) DEFAULT NULL,
  is_remember_me  TINYINT(1) NOT NULL DEFAULT 0,
  expires_at      DATETIME NOT NULL,
  is_revoked      TINYINT(1) NOT NULL DEFAULT 0,
  revoked_at      DATETIME DEFAULT NULL,
  revoked_reason  ENUM('logout','rotation','password_change','admin_action','suspicious') DEFAULT NULL,
  ip_address      VARCHAR(45),
  user_agent      VARCHAR(500),
  last_used_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token      (token_hash),
  INDEX idx_employee   (employee_id),
  INDEX idx_expires    (expires_at),
  INDEX idx_revoked    (is_revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- [A7] SOCIAL LOGINS (Google / Microsoft / GitHub)
-- ============================================================
CREATE TABLE IF NOT EXISTS social_logins (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT UNSIGNED NOT NULL,
  org_id          INT UNSIGNED NOT NULL,
  provider        ENUM('google','microsoft','github','linkedin') NOT NULL,
  provider_id     VARCHAR(255) NOT NULL,
  provider_email  VARCHAR(255),
  access_token    TEXT,
  refresh_token   TEXT,
  token_expires_at DATETIME DEFAULT NULL,
  raw_profile     JSON,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  linked_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at    DATETIME DEFAULT NULL,
  UNIQUE KEY uk_provider_id (provider, provider_id),
  INDEX idx_employee (employee_id),
  INDEX idx_provider (provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- [A8] MAGIC LINK TOKENS (Passwordless login)
-- ============================================================
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id  INT UNSIGNED DEFAULT NULL,
  org_id       INT UNSIGNED DEFAULT NULL,
  email        VARCHAR(255) NOT NULL,
  token_hash   VARCHAR(255) NOT NULL UNIQUE,
  redirect_url VARCHAR(500) DEFAULT NULL,
  is_used      TINYINT(1) NOT NULL DEFAULT 0,
  used_at      DATETIME DEFAULT NULL,
  expires_at   DATETIME NOT NULL,
  ip_requested VARCHAR(45),
  ip_used      VARCHAR(45),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token   (token_hash),
  INDEX idx_email   (email),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- [A11] TRUSTED DEVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS trusted_devices (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id   INT UNSIGNED NOT NULL,
  org_id        INT UNSIGNED NOT NULL,
  device_token  VARCHAR(255) NOT NULL UNIQUE,
  device_name   VARCHAR(255),
  device_type   ENUM('desktop','mobile','tablet','unknown') DEFAULT 'unknown',
  browser       VARCHAR(100),
  os            VARCHAR(100),
  ip_address    VARCHAR(45),
  is_trusted    TINYINT(1) NOT NULL DEFAULT 1,
  trusted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME NOT NULL,
  last_seen_at  DATETIME DEFAULT NULL,
  revoked_at    DATETIME DEFAULT NULL,
  revoked_by    ENUM('user','admin','auto_expire','suspicious') DEFAULT NULL,
  INDEX idx_token    (device_token),
  INDEX idx_employee (employee_id),
  INDEX idx_expires  (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- [A12] EMPLOYEE INVITATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_invitations (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id          INT UNSIGNED NOT NULL,
  invited_by      INT UNSIGNED NOT NULL,
  email           VARCHAR(255) NOT NULL,
  first_name      VARCHAR(100),
  last_name       VARCHAR(100),
  role_id         INT UNSIGNED DEFAULT NULL,
  department_id   INT UNSIGNED DEFAULT NULL,
  designation_id  INT UNSIGNED DEFAULT NULL,
  invite_token    VARCHAR(100) NOT NULL UNIQUE,
  token_hash      VARCHAR(255) NOT NULL,
  status          ENUM('pending','accepted','expired','revoked') NOT NULL DEFAULT 'pending',
  accepted_at     DATETIME DEFAULT NULL,
  employee_id     INT UNSIGNED DEFAULT NULL,
  expires_at      DATETIME NOT NULL,
  resent_count    TINYINT NOT NULL DEFAULT 0,
  last_resent_at  DATETIME DEFAULT NULL,
  ip_address      VARCHAR(45),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_org_email_pending (org_id, email, status),
  INDEX idx_token   (invite_token),
  INDEX idx_email   (email),
  INDEX idx_status  (status),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LOGIN ATTEMPTS (Track failed logins for lockout)
-- ============================================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id   INT UNSIGNED DEFAULT NULL,
  org_id        INT UNSIGNED DEFAULT NULL,
  email         VARCHAR(255) NOT NULL,
  ip_address    VARCHAR(45),
  user_agent    VARCHAR(500),
  status        ENUM('success','failed','locked','2fa_required') NOT NULL,
  failure_reason VARCHAR(100),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email   (email),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USER SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT UNSIGNED NOT NULL,
  session_token   VARCHAR(255) NOT NULL UNIQUE,
  device_info     VARCHAR(500),
  ip_address      VARCHAR(45),
  is_revoked      TINYINT(1) NOT NULL DEFAULT 0,
  revoked_at      DATETIME DEFAULT NULL,
  revoked_reason  VARCHAR(100),
  expires_at      DATETIME NOT NULL,
  last_activity   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_employee (employee_id),
  INDEX idx_token    (session_token),
  INDEX idx_expires  (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLANS (for org registration)
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  price_monthly   DECIMAL(10,2) DEFAULT 0,
  price_yearly    DECIMAL(10,2) DEFAULT 0,
  max_employees   INT DEFAULT 10,
  features        JSON,
  is_active       TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default plans
INSERT INTO plans (name, description, price_monthly, price_yearly, max_employees, features, is_active) VALUES
('Free', 'For small teams', 0, 0, 10, '["attendance", "leaves", "employees"]', 1),
('Pro', 'For growing businesses', 29, 290, 100, '["attendance", "leaves", "employees", "reports", "face_recognition"]', 1),
('Enterprise', 'Full features', 99, 990, 999999, '["all"]', 1);

-- ============================================================
-- SEED DATA (Auth tables)
-- ============================================================

-- [A1] Sample org registration
INSERT INTO org_registrations (company_name, email, phone, country, admin_first_name, admin_last_name, plan_id, step_completed, status, ip_address, expires_at)
VALUES ('Demo Company', 'admin@democorp.com', '+91-9900000001', 'India', 'John', 'Doe', 1, 1, 'pending', '192.168.1.1', DATE_ADD(NOW(), INTERVAL 48 HOUR))
ON DUPLICATE KEY UPDATE company_name = company_name;

-- [A3] Email verification tokens
INSERT INTO email_verification_tokens (employee_id, org_id, email, token, token_hash, purpose, is_used, expires_at)
VALUES (1, 1, 'admin@democorp.com', 'verify_123', SHA2('verify_123',256), 'signup', 0, DATE_ADD(NOW(), INTERVAL 24 HOUR))
ON DUPLICATE KEY UPDATE email = email;

-- [A4] Password reset tokens
INSERT INTO password_reset_tokens (employee_id, org_id, email, token_hash, is_used, expires_at, ip_requested)
VALUES (1, 1, 'admin@democorp.com', SHA2('reset_123',256), 0, DATE_ADD(NOW(), INTERVAL 1 HOUR), '192.168.1.1')
ON DUPLICATE KEY UPDATE email = email;

-- [A5] OTP tokens
INSERT INTO otp_tokens (employee_id, org_id, email, otp_hash, purpose, channel, attempts, is_used, expires_at)
VALUES (1, 1, 'admin@democorp.com', '$2b$10$demo', 'login_2fa', 'email', 0, 0, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
ON DUPLICATE KEY UPDATE email = email;

-- [A12] Employee invitations
INSERT INTO employee_invitations (org_id, invited_by, email, first_name, last_name, role_id, department_id, invite_token, token_hash, status, expires_at)
VALUES (1, 1, 'new@democorp.com', 'New', 'Employee', 4, 1, 'inv_123', SHA2('inv_123',256), 'pending', DATE_ADD(NOW(), INTERVAL 7 DAY))
ON DUPLICATE KEY UPDATE email = email;

-- ============================================================
-- SUMMARY
-- ============================================================
SELECT '=== AUTH SYSTEM TABLES CREATED ===' AS '';

SELECT 
  'org_registrations' as table_name, (SELECT COUNT(*) FROM org_registrations) as count
  UNION ALL
  SELECT 'email_verification_tokens', (SELECT COUNT(*) FROM email_verification_tokens)
  UNION ALL
  SELECT 'password_reset_tokens', (SELECT COUNT(*) FROM password_reset_tokens)
  UNION ALL
  SELECT 'otp_tokens', (SELECT COUNT(*) FROM otp_tokens)
  UNION ALL
  SELECT 'refresh_tokens', (SELECT COUNT(*) FROM refresh_tokens)
  UNION ALL
  SELECT 'social_logins', (SELECT COUNT(*) FROM social_logins)
  UNION ALL
  SELECT 'magic_link_tokens', (SELECT COUNT(*) FROM magic_link_tokens)
  UNION ALL
  SELECT 'trusted_devices', (SELECT COUNT(*) FROM trusted_devices)
  UNION ALL
  SELECT 'employee_invitations', (SELECT COUNT(*) FROM employee_invitations)
  UNION ALL
  SELECT 'login_attempts', (SELECT COUNT(*) FROM login_attempts)
  UNION ALL
  SELECT 'user_sessions', (SELECT COUNT(*) FROM user_sessions);

-- ============================================================
-- END OF AUTH SCRIPT
-- ============================================================
</parameter>
</create_file>

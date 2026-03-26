-- =====================================================
-- Required Roles & Permissions Seed for HRMS
-- Compatible with the current `hrms_complete_new` style schema:
--   roles(role_name, org_id, is_system)
--   permissions(permission_key, description, module)
--   role_permissions(role_id, permission_id)
-- =====================================================

START TRANSACTION;

-- -----------------------------------------------------
-- 1) Seed core permissions used by the frontend
-- -----------------------------------------------------
INSERT INTO permissions (permission_key, description, module)
SELECT 'dashboard.view', 'View dashboard and self-service home', 'dashboard'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'dashboard.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'employees.view', 'View employees and invitations', 'employees'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'employees.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'attendance.view', 'View attendance screens and team attendance', 'attendance'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'attendance.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'leaves.view', 'View leave screens', 'leaves'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'leaves.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'leaves.approve', 'Approve and manage leave requests', 'leaves'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'leaves.approve'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'reports.view', 'View reports and reports center', 'reports'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'reports.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'payroll.view', 'View payroll and payslips', 'payroll'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'payroll.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'projects.view', 'View projects', 'projects'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'projects.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'expenses.view', 'View expenses and claims', 'expenses'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'expenses.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'timesheets.view', 'View timesheets', 'timesheets'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'timesheets.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'audit.view', 'View audit logs', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'audit.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'settings.view', 'View system settings', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'settings.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'notifications.view', 'View notifications', 'system'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'notifications.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'search.employees', 'Use employee global search', 'search'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'search.employees'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'search.projects', 'Use project global search', 'search'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'search.projects'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'geofence.view', 'View geofence settings', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'geofence.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'regularization.view', 'View and process attendance regularization', 'attendance'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'regularization.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'documents.view', 'View documents module', 'documents'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'documents.view'
);

INSERT INTO permissions (permission_key, description, module)
SELECT 'roles.view', 'View roles and permissions management', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'roles.view'
);

-- -----------------------------------------------------
-- 2) Seed standard system roles expected by frontend
-- -----------------------------------------------------
INSERT INTO roles (id, org_id, role_name, is_system)
SELECT 1, NULL, 'Super Admin', 1
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE id = 1
);

INSERT INTO roles (id, org_id, role_name, is_system)
SELECT 2, NULL, 'Admin', 1
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE id = 2
);

INSERT INTO roles (id, org_id, role_name, is_system)
SELECT 3, NULL, 'HR Manager', 1
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE id = 3
);

INSERT INTO roles (id, org_id, role_name, is_system)
SELECT 4, NULL, 'Manager', 1
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE id = 4
);

INSERT INTO roles (id, org_id, role_name, is_system)
SELECT 5, NULL, 'Employee', 1
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE id = 5
);

-- -----------------------------------------------------
-- 3) Map permissions to standard roles
-- -----------------------------------------------------
-- Super Admin (1) and Admin (2): full current frontend set
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id
FROM (
  SELECT 1 AS role_id, id AS permission_id FROM permissions
  UNION ALL
  SELECT 2 AS role_id, id AS permission_id FROM permissions
) seeded
WHERE NOT EXISTS (
  SELECT 1
  FROM role_permissions rp
  WHERE rp.role_id = seeded.role_id
    AND rp.permission_id = seeded.permission_id
);

-- HR Manager (3)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, p.id
FROM permissions p
WHERE p.permission_key IN (
  'dashboard.view',
  'employees.view',
  'attendance.view',
  'leaves.view',
  'leaves.approve',
  'reports.view',
  'projects.view',
  'expenses.view',
  'timesheets.view',
  'notifications.view',
  'search.employees',
  'search.projects',
  'geofence.view',
  'regularization.view',
  'documents.view',
  'roles.view'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = 3 AND rp.permission_id = p.id
);

-- Manager (4)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, p.id
FROM permissions p
WHERE p.permission_key IN (
  'dashboard.view',
  'employees.view',
  'attendance.view',
  'leaves.view',
  'leaves.approve',
  'reports.view',
  'projects.view',
  'expenses.view',
  'timesheets.view',
  'notifications.view',
  'search.employees',
  'search.projects',
  'geofence.view',
  'regularization.view',
  'documents.view'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = 4 AND rp.permission_id = p.id
);

-- Employee (5)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, p.id
FROM permissions p
WHERE p.permission_key IN (
  'dashboard.view',
  'attendance.view',
  'leaves.view',
  'projects.view',
  'expenses.view',
  'timesheets.view',
  'notifications.view',
  'search.projects'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = 5 AND rp.permission_id = p.id
);

COMMIT;

-- -----------------------------------------------------
-- Optional: assign a role to an employee after seeding
-- Example:
-- UPDATE employees SET role_id = 2 WHERE email = 'admin@testorg.com';
-- -----------------------------------------------------

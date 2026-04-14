# HRMS RBAC System

## Summary
- Backend uses JWT auth plus named `permission` middleware.
- Permissions follow canonical keys like `employee_read`, `leave_approve`, `payroll_process`.
- ABAC is enforced through `AuthorizationService` with scopes:
  - `all`
  - `team`
  - `self`
  - `finance`
- Angular reads permission claims from authenticated user payload and still supports legacy permission maps.

## Database Schema
```sql
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NULL,
  role_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  parent_role_id INT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  priority INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT uk_org_role UNIQUE (org_id, role_name),
  CONSTRAINT roles_parent_role_fk FOREIGN KEY (parent_role_id) REFERENCES roles(id) ON DELETE SET NULL
);

CREATE TABLE permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permission_key VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  module VARCHAR(50) NULL,
  resource VARCHAR(100) NULL,
  action VARCHAR(100) NULL,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted_by INT NULL,
  granted_at TIMESTAMP NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE user_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  permission_id INT NOT NULL,
  effect ENUM('allow', 'deny') NOT NULL DEFAULT 'allow',
  starts_at TIMESTAMP NULL,
  ends_at TIMESTAMP NULL,
  granted_by INT NULL,
  granted_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT uk_user_permission UNIQUE (employee_id, permission_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
```

## Default Access Model
- Super Admin: full access, org-wide, override capability.
- HR Admin: org-wide HR operations and settings except super-level actions.
- Manager: self + direct reports.
- Employee: self-service only.
- Finance: payroll and financial visibility, masked personal fields.

## ABAC Examples
- Manager can access employee only when `employee.manager_id = current_user.id`.
- Employee can access only own record.
- Finance can access payroll-relevant employee rows but sensitive personal fields are masked.

## Backend Building Blocks
- `AuthorizationService`
  - seeds canonical permission catalog
  - resolves role/user override permissions
  - computes access scope
  - scopes employee queries
  - masks finance-restricted fields
- `permission_middleware`
  - blocks unauthorized API access before controller execution
- Route protection examples
  - `employee_read`
  - `leave_read`, `leave_create`, `leave_approve`
  - `payroll_read`, `payroll_process`
  - `rbac_manage`

## Frontend Integration
- `User.permissions: string[]`
- `User.accessScope: 'all' | 'team' | 'self' | 'finance'`
- Angular `PermissionService` supports:
  - canonical backend permission keys
  - existing legacy aliases
  - route access fallback
- `AccessControlService` now supports:
  - string array claims
  - legacy permission objects
  - permission maps

## Files
- Backend migration:
  - [1772900016000_expand_rbac_infrastructure.ts](/d:/HRMS_Backend/HRMS_BACKEND/apps/backend/database/migrations/1772900016000_expand_rbac_infrastructure.ts)
- Backend authz service:
  - [AuthorizationService.ts](/d:/HRMS_Backend/HRMS_BACKEND/apps/backend/app/services/AuthorizationService.ts)
- Backend middleware:
  - [permission_middleware.ts](/d:/HRMS_Backend/HRMS_BACKEND/apps/backend/app/middleware/permission_middleware.ts)
- Angular permission contract:
  - [permission.service.ts](/d:/HRMS_FRONTEND/src/app/core/services/permission.service.ts)
  - [auth.service.ts](/d:/HRMS_FRONTEND/src/app/core/services/auth.service.ts)
  - [access-control.service.ts](/d:/HRMS_FRONTEND/src/app/core/access/access-control.service.ts)

## Next Hardening
1. Apply `permission` middleware to every remaining module route group.
2. Seed default role-to-permission mappings per organization.
3. Add impersonation audit trail before enabling override access in UI.
4. Move permission/access snapshot caching to Redis for multi-node deployments.

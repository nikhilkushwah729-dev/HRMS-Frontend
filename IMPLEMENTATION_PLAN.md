# HRMS Frontend API Implementation Plan

## Overview
This document outlines the implementation of the HRMS Frontend to work with the provided API endpoints.

## API Base URL
```
http://localhost:3333/api
```

## Implemented Features

### 1. Authentication Routes ✅
- Register Organization: `POST /api/auth/register`
- Verify Email: `GET /api/auth/verify-email`
- Login: `POST /api/auth/login`
- Verify OTP: `POST /api/auth/verify-otp`
- Forgot Password: `POST /api/auth/forgot-password`
- Reset Password: `POST /api/auth/reset-password`
- Get Current User: `GET /api/auth/me`
- Logout: `POST /api/auth/logout`

### 2. Organization Routes ✅
- Get Organization: `GET /api/organization`
- Update Organization: `PUT /api/organization`
- Get Departments: `GET /api/organization/departments`
- Create Department: `POST /api/organization/departments`
- Get Addons: `GET /api/organization/addons`
- Toggle Addon: `POST /api/organization/addons/toggle`

### 3. Employee Routes ✅
- List Employees: `GET /api/employees`
- Get Employee: `GET /api/employees/:id`
- Create Employee: `POST /api/employees`
- Update Employee: `PUT /api/employees/:id`
- Delete Employee: `DELETE /api/employees/:id`
- Invite Employee: `POST /api/employees/invite`
- List Invitations: `GET /api/employees/invitations`
- Revoke Invitation: `POST /api/employees/invitations/:id/revoke`
- Resend Invitation: `POST /api/employees/invitations/:id/resend`

### 4. Attendance Routes ✅
- Check In: `POST /api/attendance/check-in`
- Check Out: `POST /api/attendance/check-out`
- Get Attendance History: `GET /api/attendance/history`
- Get Today's Attendance: `GET /api/attendance/today`
- Start Break: `POST /api/attendance/break/start`
- End Break: `POST /api/attendance/break/end`
- Get Today's Breaks: `GET /api/attendance/breaks/today`
- Get Attendance Stats: `GET /api/attendance/stats`
- Get Monthly Attendance: `GET /api/attendance/monthly`
- Request Manual Attendance: `POST /api/attendance/manual/request`
- Get Manual Requests: `GET /api/attendance/manual/requests`
- Process Manual Request: `POST /api/attendance/manual/process`
- Request Overtime: `POST /api/attendance/overtime/request`
- Get Overtime Records: `GET /api/attendance/overtime`
- Validate Location: `GET /api/attendance/validate-location`
- Get Geo-fence Zones: `GET /api/attendance/zones`
- Get All Attendance (Admin): `GET /api/attendance/all`
- Get Today's All Attendance (Admin): `GET /api/attendance/all/today`
- Get Shifts: `GET /api/attendance/shifts`

### 5. Leave Routes ✅
- List Leaves: `GET /api/leaves`
- Get Leave Types: `GET /api/leaves/types`
- Apply Leave: `POST /api/leaves`
- Update Leave Status: `PUT /api/leaves/:id/status`
- Get Leave Balances: `GET /api/leaves/balances`
- Adjust Leave Balance: `POST /api/leaves/balances/adjust`

### 6. Reports Routes ✅
- Daily Attendance Report
- Monthly Attendance Report
- Late Arrivals Report
- Absent Employees Report
- Export to Excel
- Export to PDF

### 7. Notification Routes ✅
- List Notifications: `GET /api/notifications`
- Mark as Read: `PATCH /api/notifications/:id/read`
- Mark All as Read: `POST /api/notifications/read-all`
- Delete Notification: `DELETE /api/notifications/:id`

### 8. Audit Log Routes ✅
- List Audit Logs: `GET /api/audit-logs`
- Create Audit Log: `POST /api/audit-logs`
- Get Modules: `GET /api/audit-logs/modules`
- Get Actions: `GET /api/audit-logs/actions`
- Export Audit Logs: `GET /api/audit-logs/export`
- Get Audit Log: `GET /api/audit-logs/:id`

### 9. Document Routes ✅
- List Documents: `GET /api/documents`
- Upload Document: `POST /api/documents`
- Delete Document: `DELETE /api/documents/:id`

### 10. Role Routes ✅
- List Roles: `GET /api/roles`
- Create Role: `POST /api/roles`
- Update Role: `PUT /api/roles/:id`
- Get Permissions: `GET /api/roles/permissions`

### 11. Face Recognition Routes ✅
- Register Face: `POST /api/face/register`
- Verify Face: `POST /api/face/verify`
- Get Face Status: `GET /api/face/status/:id`
- Delete Face: `DELETE /api/face/:id`

### 12. Regularization Routes ✅ (Newly Added)
- List Regularizations: `GET /api/regularizations`
- Create Regularization: `POST /api/regularizations`
- Update Regularization: `PUT /api/regularizations/:id`

### 13. Tracking Routes ✅
- Update Location: `POST /api/tracking/update`
- Get Location History: `GET /api/tracking/history`

### 14. Payroll Routes ✅
- List Payroll: `GET /api/payroll`
- Create Payroll: `POST /api/payroll`

### 15. Project Routes ✅
- List Projects: `GET /api/projects`
- Create Project: `POST /api/projects`
- Get Project Tasks: `GET /api/projects/:id/tasks`
- Create Task: `POST /api/projects/:id/tasks`

### 16. Announcement Routes ✅
- List Announcements: `GET /api/announcements`
- Create Announcement: `POST /api/announcements`

### 17. Expense Routes ✅
- List Expenses: `GET /api/expenses`
- Create Expense: `POST /api/expenses`
- Update Expense Status: `PUT /api/expenses/:id/status`

### 18. Timesheet Routes ✅
- List Timesheets: `GET /api/timesheets`
- Create Timesheet: `POST /api/timesheets`

### 19. Public Invitation Routes ✅
- Get Invitation by Token: `GET /api/invitations/:token`
- Respond to Invitation: `POST /api/invitations/:token/respond`

## New Components Created

1. **Regularization Component** (`src/app/features/admin/regularization.component.ts`)
   - View and manage regularization requests
   - Create new regularization requests
   - Filter by status, type, and date range
   - Approve/reject requests (admin)

2. **Documents Component** (`src/app/features/admin/documents.component.ts`)
   - Upload documents with drag & drop
   - View document grid
   - Download and delete documents
   - Filter by category

3. **Roles Component** (`src/app/features/admin/roles.component.ts`)
   - View and manage roles
   - Create/edit/delete roles
   - Assign permissions to roles
   - View permissions by module

## Routes Added

```typescript
// app.routes.ts
{
    path: 'admin/regularization',
    loadComponent: () => import('./features/admin/regularization.component')
},
{
    path: 'admin/documents',
    loadComponent: () => import('./features/admin/documents.component')
},
{
    path: 'admin/roles',
    loadComponent: () => import('./features/admin/roles.component')
}
```

## Sidebar Menu Added

- Team Attendance
- Regularization
- Documents
- Roles & Permissions

## Permissions Added

- `geofence.view`
- `regularization.view`
- `documents.view`
- `roles.view`

## Notes

- All dates should be in format: `YYYY-MM-DD`
- All datetime should be in format: `YYYY-MM-DD HH:MM:SS`
- Token should be included in header: `Authorization: Bearer <token>`
- For file uploads, use `FormData`


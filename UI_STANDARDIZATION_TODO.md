# UI Standardization Plan - rounded-md for all panels

## Task
Standardize all UI panels with rounded-md styling across the HRMS application.

## Steps to Complete:

### Step 1: Update Base Styles (src/styles.css)
- [x] Update `.card` class to use `rounded-md`
- [x] Update `.btn-primary` class to use `rounded-md`
- [x] Add shared panel component classes
- [x] Added: panel, panel-header, panel-body, panel-footer
- [x] Added: card-glass, btn-secondary, btn-danger, btn-sm, btn-lg
- [x] Added: input-field, select-field
- [x] Added: badge classes (badge-success, badge-warning, badge-error, badge-info, badge-neutral)
- [x] Added: table, table-container, table styles
- [x] Added: modal-overlay, modal-content, modal-header, modal-body, modal-footer
- [x] Added: stat-card, stat-card-gradient, avatar classes
- [x] Added: icon-box, tabs, tab, tab-active, tab-inactive
- [x] Added: progress, dropdown, tooltip, alert classes
- [x] Added: pagination, chip, divider, spinner

### Step 2: Update Feature Components
- [x] src/app/features/employees/employee-list.component.ts
- [x] src/app/features/leaves/leaves.component.ts
- [x] src/app/features/attendance/attendance.component.ts
- [x] src/app/features/admin/team-attendance.component.ts
- [x] src/app/features/admin/audit-logs.component.html
- [ ] src/app/features/employees/edit-employee.component.ts
- [ ] src/app/features/employees/add-employee.component.ts
- [ ] src/app/features/employees/view-employee.component.ts
- [ ] src/app/features/employees/invitations.component.ts
- [ ] src/app/features/attendance/face-registration.component.ts
- [ ] src/app/features/admin/regularization.component.ts
- [ ] src/app/features/admin/documents.component.ts
- [ ] src/app/features/admin/roles.component.ts
- [ ] src/app/features/admin/settings.component.ts
- [ ] src/app/features/admin/geofence-settings.component.ts
- [ ] src/app/features/self-service/self-service.component.ts
- [ ] src/app/features/expenses/expenses.component.ts
- [ ] src/app/features/payroll/payroll.component.ts
- [ ] src/app/features/projects/projects.component.ts
- [ ] src/app/features/reports/reports.component.ts
- [ ] src/app/features/timesheets/timesheets.component.ts

### Step 3: Verify Consistency
- [ ] Check all panels use rounded-md
- [ ] Verify shared component styling

## Notes:
- Use `rounded-md` (6px) for all card/panel elements
- Keep buttons and inputs consistent with rounded-md
- Maintain glass effects and shadows where appropriate


# Employee Invitations Fix TODO

## Task: Fix Employee Invitations not working

### Backend Fix Completed:
- [x] 1. Update `EmployeeInvitationsController.ts` to return all invitations (not just pending)
- [x] 2. Add inviter relationship loading to get `invitedByName`
- [x] 3. Map `createdAt` to `invitedAt` in response
- [x] 4. Add `acceptedAt` field support
- [x] 5. Fix status inconsistency: changed 'rejected' to 'revoked' in respond method
- [x] 6. Add `updatedAt` field to model and migration for acceptedAt tracking

### Database Update Required:
Run the SQL script to add the updated_at column:
```sql
ALTER TABLE employee_invitations ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```
File: `database/add_updated_at_to_invitations.sql`

### Expected Result After Fix:
- Frontend can view all pending, accepted, and revoked/expired invitations
- Display proper invited by name
- Display correct dates
- Send, resend, and revoke invitations work correctly


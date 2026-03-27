-- Ensure organizations table has logo column for organization branding
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS logo VARCHAR(500) NULL AFTER company_name;

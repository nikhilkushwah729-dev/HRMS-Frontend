-- Enable Phone OTP Login for a user (MySQL)
-- Adjust WHERE clause for your user (by email/id/org_id).
-- Recommended phone format stored in DB: +91XXXXXXXXXX

-- Option A: Set explicitly (safest)
-- UPDATE employees
-- SET phone = '+919876543210',
--     phone_verified = 1,
--     phone_auth_enabled = 1,
--     login_type = 'phone',
--     is_international = 0
-- WHERE email = 'your@email.com';

-- Option B: Normalize an Indian 10-digit phone already stored in DB (MySQL 8+)
-- If your `employees.phone` is '9876543210' or '98 765 43210', this converts to +91 + last 10 digits.
UPDATE employees
SET phone = CONCAT('+91', RIGHT(REGEXP_REPLACE(phone, '[^0-9]', ''), 10)),
    phone_verified = 1,
    phone_auth_enabled = 1,
    login_type = 'phone',
    is_international = 0
WHERE email = 'your@email.com';


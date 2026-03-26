# Phone OTP Login Setup (Backend + DB)

## 1) Backend Requirements

Backend route: `POST /api/auth/phone/request-otp`

To actually receive SMS on mobile, set your SMS provider env vars in:
`D:\HRMS_Backend\HRMS_BACKEND\apps\backend\.env`

### Twilio (recommended)

- `SMS_PROVIDER=twilio`
- `TWILIO_ACCOUNT_SID=...`
- `TWILIO_AUTH_TOKEN=...`
- **Either** set a Twilio sender number:
  - `TWILIO_PHONE_NUMBER=+1XXXXXXXXXX` (must be a Twilio-owned SMS-capable number; no spaces)
- **Or** set a Messaging Service (recommended if you have one):
  - `TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

Important:
- `TWILIO_PHONE_NUMBER` must be a **Twilio phone number**, not your personal SIM number.
- In Twilio **trial accounts**, you must usually **verify the destination phone number** before sending SMS.
- If you are sending to `+91...` (India), ensure Twilio account settings allow it (geo permissions / destination enablement). India may have extra compliance/limits depending on your account.

If Twilio is not configured, backend will still generate OTP but it will be logged in backend console (dev fallback).

### Common Twilio errors

- **21266**: `'To' and 'From' number cannot be the same` → `TWILIO_PHONE_NUMBER` and user phone must be different.
- **21659**: `'From' ... is not a Twilio phone number or Short Code country mismatch` → `TWILIO_PHONE_NUMBER` is not a Twilio number (or wrong sender setup). Use a Twilio-owned number or a Messaging Service SID.

## 2) DB Requirements

Phone OTP will only work when the employee record matches:

- `employees.phone` matches the phone you enter (best: store as `+91XXXXXXXXXX`).
- `employees.phone_auth_enabled = 1`

Use the SQL in `scripts/enable_phone_otp.sql` to enable it for a user.

## 3) Quick test flow

1. Restart backend after `.env` changes.
2. Call `POST /api/auth/phone/request-otp` with `{ "phone": "+91XXXXXXXXXX" }`.
3. If you see `OTP recently sent...`, use `POST /api/auth/phone/resend` with `{ "otpReference": <ref> }`.
4. Verify with `POST /api/auth/phone/verify` using `{ "phone": "+91XXXXXXXXXX", "otpReference": <ref>, "otp": "123456" }`.

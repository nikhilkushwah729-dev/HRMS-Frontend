# OAuth Implementation Plan

## Overview
Integrate frontend with backend SocialAuthController for OAuth (Google, Microsoft) and Phone OTP authentication using window redirect flow.

## Files to Create
1. **OAuth Callback Component** - `src/app/features/auth/callback/oauth-callback.component.ts`
   - Handle redirect from backend after OAuth
   - Parse response and complete login

2. **Auth Routes Update** - Add callback route

## Files to Update
1. **Login Component** - `src/app/features/auth/login/login.component.ts`
   - Implement `loginWithGoogle()` to redirect to backend
   - Implement `loginWithMicrosoft()` to redirect to backend

2. **Auth Service** - `src/app/core/services/auth.service.ts`
   - Add `resendPhoneOtp()` method for OTP resend

## OAuth Flow
1. User clicks Google/Microsoft on login page
2. Frontend redirects to backend `/auth/google` or `/auth/microsoft`
3. Backend redirects to OAuth provider
4. OAuth provider redirects to backend callback
5. Backend processes and redirects to frontend `/auth/callback?result=...`
6. Frontend callback component processes result and logs in user

## Backend Requirement
The backend SocialAuthController needs to redirect to frontend after OAuth:
- After successful OAuth, redirect to: `{frontend_url}/auth/callback?success=true&data={encoded_user_data}`
- On error, redirect to: `{frontend_url}/auth/callback?success=false&message={error_message}`

Or alternatively, the backend should return a redirect URL in the JSON response.


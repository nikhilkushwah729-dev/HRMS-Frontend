# OAuth Setup Guide

## Google OAuth Setup

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Go to "APIs & Services" → "OAuth consent screen"

### Step 2: Configure OAuth Consent Screen
1. Choose "External" user type
2. Fill in required fields:
   - App name: "HRMS Pro"
   - User support email: your email
   - Developer contact email: your email
3. Click "Save and Continue"

### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   ```
   http://localhost:3333/api/auth/google/callback
   ```
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

---

## Microsoft Azure OAuth Setup

### Step 1: Go to Azure Portal
1. Visit: https://portal.azure.com/
2. Login with your Microsoft account
3. In the search bar at the top, search for **"App registrations"**
4. Click on "App registrations" in the results

OR directly go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade

### Step 2: Register New Application
1. Click "New registration"
2. Fill in:
   - Name: "HRMS Pro"
   - Supported account types: "Accounts in any organizational directory"
   - Redirect URI: Select "Web" and enter:
     ```
     http://localhost:3333/api/auth/microsoft/callback
     ```
3. Click "Register"

### Step 3: Create Client Secret
1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Add description and expiry
4. Click "Add"
5. Copy the **Value** (NOT the ID)

### Step 4: Copy Credentials
1. From "Overview", copy the **Application (client) ID**
2. Copy the client secret you created

---

## Add to Backend .env File

```
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3333/api/auth/google/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:3333/api/auth/microsoft/callback

# Frontend URL (for redirect after OAuth)
FRONTEND_URL=http://localhost:4200
```

---

## Important Notes

1. **Restart Backend**: After adding credentials to `.env`, restart the backend server
2. **Redirect URIs Must Match**: The redirect URI in your OAuth provider must exactly match what's in the code
3. **For Production**: You'll need to update the redirect URIs to your production domain

---

## Backend Verification Commands

**1. Test backend endpoints:**
```bash
# Test Google redirect works (should redirect to Google)
curl -I http://localhost:3333/api/auth/google

# Test callback endpoint exists
curl -I http://localhost:3333/api/auth/google/callback
```

**2. Check .env loaded:**
```bash
cd ../HRMS_Backend/HRMS_BACKEND
grep GOOGLE_ .env
echo $FRONTEND_URL  # Should show http://localhost:4200
```

**3. Tail backend logs during test:**
```bash
cd ../HRMS_Backend/HRMS_BACKEND
npm run dev  # Watch for OAuth errors in console
```

## Testing Steps

1. Ensure backend running: `cd ../HRMS_Backend/HRMS_BACKEND && npm run dev`
2. Frontend: `ng serve`
3. Open http://localhost:4200/auth/login
4. Click Google → **Watch browser console** for [OAUTH DEBUG] logs
5. **Watch backend terminal** for errors
6. Success: Redirect to /self-service with login

**Report these:**
- Browser console: All [OAUTH DEBUG] lines
- Backend console: Any errors during Google callback


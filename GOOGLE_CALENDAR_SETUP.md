# Google Calendar Integration Setup Guide

This guide explains how to set up the Google Calendar bortlet integration for Dashbort.

## Overview

The Google Calendar integration allows users to connect their Google Calendar and view upcoming events directly in their dashboard. The implementation follows industry-standard security practices:

- **Server-side OAuth flow**: All OAuth operations happen on the server
- **Secure token storage**: Tokens are stored in Firestore, never exposed to the client
- **Automatic token refresh**: Tokens are automatically refreshed when expired
- **Firebase Admin SDK**: Uses Firebase Admin SDK for secure server-side operations

## Prerequisites

1. A Google Cloud Project with the Calendar API enabled
2. OAuth 2.0 credentials configured
3. Firebase Admin SDK credentials (for production)

## Step 1: Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (unless you have a Google Workspace)
   - Fill in the required information
   - Add scopes: `https://www.googleapis.com/auth/calendar.readonly`
   - Add test users if needed
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Dashbort Calendar Integration"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/calendar/callback` (for development)
     - `https://yourdomain.com/api/calendar/callback` (for production)
5. Copy the **Client ID** and **Client Secret**

## Step 3: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Google Calendar OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
```

For production, update `GOOGLE_REDIRECT_URI` to your production domain.

## Step 4: Set Up Firebase Admin SDK (Production)

For production deployments, you'll need Firebase Admin SDK credentials:

### Option 1: Service Account File (Local Development)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Project Settings" > "Service Accounts"
4. Click "Generate New Private Key"
5. Save the JSON file securely
6. Add to `.env.local`:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   ```

### Option 2: Environment Variables (Vercel/Cloud Deployments)

1. Get the service account JSON from Firebase Console
2. Add to your deployment platform's environment variables:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   FIREBASE_SERVICE_ACCOUNT_PROJECT_ID=your_project_id
   ```

## Step 5: Update Firestore Security Rules (Optional)

The default rules allow authenticated users to read/write their own data. For additional security, you can restrict calendar settings:

```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  
  match /settings/googleCalendar {
    // Calendar tokens should only be readable/writable by the user
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
```

## Architecture

### API Routes

- **`/api/calendar/auth`** (GET): Initiates OAuth flow, returns authorization URL
- **`/api/calendar/callback`** (GET): Handles OAuth callback, exchanges code for tokens
- **`/api/calendar/events`** (GET): Fetches calendar events (requires authentication)

### Data Flow

1. User clicks "Connect Google Calendar" in the bortlet
2. Client requests auth URL from `/api/calendar/auth` with Firebase ID token
3. Server generates OAuth URL and returns it
4. User is redirected to Google OAuth consent screen
5. Google redirects back to `/api/calendar/callback` with authorization code
6. Server exchanges code for access/refresh tokens
7. Tokens are stored in Firestore at `users/{userId}/settings/googleCalendar`
8. Client fetches events from `/api/calendar/events`
9. Server validates Firebase token, retrieves Google tokens, refreshes if needed, fetches from Google Calendar API

### Security Features

- **Token Storage**: Refresh tokens are stored server-side only (Firestore)
- **Token Refresh**: Automatic refresh before expiration (5-minute buffer)
- **Authentication**: All API routes require valid Firebase ID tokens
- **Scope Limitation**: Only requests read-only calendar access
- **State Verification**: OAuth state parameter includes userId for verification

## Usage

Once configured, users can:

1. See the Google Calendar bortlet on their dashboard
2. Click "Connect Google Calendar" to start OAuth flow
3. View upcoming events (up to 5 by default)
4. Click events to open them in Google Calendar
5. Events automatically refresh every 5 minutes

## Troubleshooting

### "Failed to initialize Firebase Admin SDK"

- Ensure you have Firebase Admin SDK credentials configured
- Check that `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account file
- Or ensure `FIREBASE_SERVICE_ACCOUNT_KEY` and `FIREBASE_SERVICE_ACCOUNT_PROJECT_ID` are set

### "Invalid redirect URI"

- Ensure the redirect URI in Google Cloud Console matches exactly
- Check that `GOOGLE_REDIRECT_URI` matches your deployment URL
- For localhost, use `http://localhost:3000/api/calendar/callback`

### "Calendar not connected"

- User needs to complete the OAuth flow
- Check Firestore for stored tokens at `users/{userId}/settings/googleCalendar`
- Verify tokens haven't been revoked in Google Account settings

### Events not loading

- Check browser console for errors
- Verify API routes are accessible
- Check server logs for Google Calendar API errors
- Ensure Google Calendar API is enabled in Google Cloud Console

## Development

To test locally:

1. Set up environment variables in `.env.local`
2. Run `npm run dev`
3. Navigate to the dashboard
4. Click "Connect Google Calendar" in the bortlet
5. Complete OAuth flow
6. Events should appear automatically

## Production Deployment

1. Set all environment variables in your deployment platform
2. Update `GOOGLE_REDIRECT_URI` to your production domain
3. Add production redirect URI to Google Cloud Console
4. Deploy the application
5. Test the OAuth flow in production

## Security Best Practices

- Never commit `.env.local` or service account files
- Use environment variables for all sensitive data
- Regularly rotate OAuth credentials
- Monitor API usage in Google Cloud Console
- Set up alerts for unusual activity
- Use Firebase Security Rules to restrict access
- Consider implementing rate limiting for API routes



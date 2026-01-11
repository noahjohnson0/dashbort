/**
 * Google Calendar API utilities
 * Server-side only - handles OAuth and API calls securely
 */

import { google } from 'googleapis';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/firebase/server-auth';

export interface GoogleCalendarSettings {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  calendarIds: string[];
  maxEvents: number;
  timestamp?: number;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  htmlLink?: string;
}

/**
 * Get Google Calendar settings from Firestore
 */
export async function getCalendarSettings(
  userId: string
): Promise<GoogleCalendarSettings | null> {
  const app = initializeAdminApp();
  const db = getFirestore(app);
  const userDoc = await db.collection('users').doc(userId).get();
  return userDoc.data()?.settings?.googleCalendar || null;
}

/**
 * Save Google Calendar settings to Firestore
 */
export async function saveCalendarSettings(
  userId: string,
  settings: Partial<GoogleCalendarSettings>
): Promise<void> {
  console.log('saveCalendarSettings: Saving for user', userId, 'with settings:', {
    hasAccessToken: !!settings.accessToken,
    hasRefreshToken: !!settings.refreshToken,
    expiresAt: settings.expiresAt ? new Date(settings.expiresAt).toISOString() : undefined,
    calendarIds: settings.calendarIds,
    maxEvents: settings.maxEvents,
  });
  
  try {
    const app = initializeAdminApp();
    const db = getFirestore(app);
    
    await db.collection('users').doc(userId).set(
      {
        settings: {
          googleCalendar: {
            ...settings,
            timestamp: Date.now(),
          },
        },
      },
      { merge: true }
    );
    
    console.log('saveCalendarSettings: Successfully saved to Firestore using Admin SDK');
  } catch (adminError) {
    // Fallback: If Admin SDK fails, try using client SDK via API
    // This is a workaround for local development without Admin SDK credentials
    console.warn('Admin SDK failed, trying alternative method:', adminError);
    
    // For now, throw the error so we know it failed
    // In production, you should have Admin SDK credentials configured
    throw new Error(
      'Failed to save calendar settings. Please configure Firebase Admin SDK credentials. ' +
      'For local development, run: gcloud auth application-default login'
    );
  }
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(
  userId: string
): Promise<string> {
  const settings = await getCalendarSettings(userId);
  
  if (!settings?.accessToken || !settings?.refreshToken) {
    throw new Error('Google Calendar not connected');
  }

  // Check if token is expired (with 5 minute buffer)
  const now = Date.now();
  const expiresAt = settings.expiresAt;
  
  if (now >= expiresAt - 5 * 60 * 1000) {
    // Token expired or about to expire, refresh it
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: settings.refreshToken,
    });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token || !credentials.expiry_date) {
        throw new Error('Failed to refresh access token');
      }

      // Save new token
      await saveCalendarSettings(userId, {
        accessToken: credentials.access_token,
        expiresAt: credentials.expiry_date,
        refreshToken: settings.refreshToken, // Keep existing refresh token
        calendarIds: settings.calendarIds,
        maxEvents: settings.maxEvents,
      });

      return credentials.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  return settings.accessToken;
}

/**
 * Fetch calendar events from Google Calendar API
 */
export async function fetchCalendarEvents(
  userId: string,
  maxResults: number = 10
): Promise<CalendarEvent[]> {
  const settings = await getCalendarSettings(userId);
  if (!settings) {
    throw new Error('Google Calendar not connected');
  }

  const accessToken = await getValidAccessToken(userId);
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Use primary calendar or first selected calendar
  const calendarId = settings.calendarIds?.[0] || 'primary';
  const maxEvents = settings.maxEvents || maxResults;

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults: maxEvents,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    return events.map((event) => ({
      id: event.id || '',
      summary: event.summary || 'No title',
      start: {
        dateTime: event.start?.dateTime ?? undefined,
        date: event.start?.date ?? undefined,
      },
      end: {
        dateTime: event.end?.dateTime ?? undefined,
        date: event.end?.date ?? undefined,
      },
      location: event.location ?? undefined,
      description: event.description ?? undefined,
      htmlLink: event.htmlLink ?? undefined,
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error('Failed to fetch calendar events');
  }
}

/**
 * Get OAuth2 authorization URL
 */
export function getAuthUrl(userId: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent to get refresh token
    state: userId, // Pass userId in state for verification
  });

  return authUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  userId: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new Error('Failed to get tokens from Google');
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date,
  };
}


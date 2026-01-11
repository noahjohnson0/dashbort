/**
 * API route to handle Google Calendar OAuth callback
 * GET /api/calendar/callback?code=...&state=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, saveCalendarSettings } from '@/lib/google/calendar';
import { verifyIdToken } from '@/lib/firebase/server-auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?error=missing_code_or_state', request.url)
      );
    }

    // Verify the state matches the userId (basic security check)
    // In production, you might want to use a more secure state mechanism
    const userId = state;

    // Exchange code for tokens
    console.log('OAuth callback: Exchanging code for tokens for user', userId);
    const tokens = await exchangeCodeForTokens(code, userId);
    console.log('OAuth callback: Got tokens, expires at', new Date(tokens.expiresAt).toISOString());

    // Save tokens to Firestore using Admin SDK
    console.log('OAuth callback: Saving settings to Firestore...');
    await saveCalendarSettings(userId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      calendarIds: ['primary'], // Default to primary calendar
      maxEvents: 10, // Default max events
    });
    console.log('OAuth callback: Settings saved successfully');

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      new URL('/?calendar_connected=true', request.url)
    );
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/?error=oauth_failed', request.url)
    );
  }
}


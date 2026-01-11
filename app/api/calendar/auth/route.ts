/**
 * API route to initiate Google Calendar OAuth flow
 * GET /api/calendar/auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google/calendar';
import { verifyIdToken } from '@/lib/firebase/server-auth';

export async function GET(request: NextRequest) {
  try {
    // Verify Firebase auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Generate OAuth URL
    const authUrl = getAuthUrl(userId);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}



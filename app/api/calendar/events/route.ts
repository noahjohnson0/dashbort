/**
 * API route to fetch Google Calendar events
 * GET /api/calendar/events
 * Requires Authorization header with Firebase ID token
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchCalendarEvents } from '@/lib/google/calendar';
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

    // Get optional query parameters
    const searchParams = request.nextUrl.searchParams;
    const maxResults = parseInt(searchParams.get('maxResults') || '10', 10);

    // Fetch events
    console.log('API: Fetching calendar events for user', userId);
    const events = await fetchCalendarEvents(userId, maxResults);
    console.log('API: Fetched', events.length, 'events');

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Google Calendar not connected') {
        return NextResponse.json(
          { error: 'Google Calendar not connected' },
          { status: 401 }
        );
      }
      
      // Return more detailed error for debugging
      return NextResponse.json(
        { error: error.message || 'Failed to fetch calendar events' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}


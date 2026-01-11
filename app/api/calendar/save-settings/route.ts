/**
 * API route to save calendar settings using client SDK
 * This is a fallback when Admin SDK credentials aren't available
 * POST /api/calendar/save-settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { verifyIdToken } from '@/lib/firebase/server-auth';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { settings } = body;

    // Save using client SDK (works in server context for Firestore)
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving calendar settings:', error);
    return NextResponse.json(
      { error: 'Failed to save calendar settings' },
      { status: 500 }
    );
  }
}



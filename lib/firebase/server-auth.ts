/**
 * Server-side Firebase authentication utilities
 * Used in API routes to verify Firebase ID tokens
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { DecodedIdToken } from 'firebase-admin/auth';

let adminApp: App | undefined;
let adminAuth: Auth | undefined;

/**
 * Initialize Firebase Admin SDK
 * Tries multiple initialization strategies for flexibility
 */
export function initializeAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
    return adminApp;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dashbort-2b417';

  // Strategy 1: Use service account from environment variable (production)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
      return adminApp;
    } catch (error) {
      console.warn('Failed to initialize with service account file:', error);
    }
  }

  // Strategy 2: Use service account from environment variables (Vercel, etc.)
  if (
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY &&
    process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID
  ) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID,
      });
      return adminApp;
    } catch (error) {
      console.warn('Failed to initialize with service account env vars:', error);
    }
  }

  // Strategy 3: Initialize with project ID only (works for token verification in some cases)
  // Note: This may not work in all environments, but is useful for development
  try {
    adminApp = initializeApp({
      projectId,
    });
    return adminApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw new Error('Failed to initialize Firebase Admin SDK. Please configure service account credentials.');
  }
}

/**
 * Get Firebase Admin Auth instance
 */
function getAdminAuth(): Auth {
  if (!adminAuth) {
    const app = initializeAdminApp();
    adminAuth = getAuth(app);
  }
  return adminAuth;
}

/**
 * Verify Firebase ID token
 */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw new Error('Invalid ID token');
  }
}


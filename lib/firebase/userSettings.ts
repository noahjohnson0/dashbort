import { useState, useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { useDocumentData } from 'react-firebase-hooks/firestore';

export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp?: number;
}

/**
 * Custom hook to save user's location to Firestore at users/{userId}/settings.location
 * Follows react-firebase-hooks pattern with loading and error states
 * @param userId - The user's UID
 * @returns Tuple with save function, loading state, and error state
 */
export function useSaveUserLocation(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveLocation = useCallback(
    async (location: UserLocation) => {
      if (!userId) {
        setError(new Error('User ID is required'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const userRef = doc(db, 'users', userId);
        
        // Use setDoc with merge to create or update the document
        // This preserves other fields in the document
        await setDoc(
          userRef,
          {
            settings: {
              location: {
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: location.timestamp || Date.now(),
              },
            },
          },
          { merge: true }
        );
      } catch (err) {
        const firebaseError = err instanceof Error ? err : new Error('Failed to save location');
        setError(firebaseError);
        throw firebaseError;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return [saveLocation, loading, error] as const;
}

/**
 * Custom hook to get user's location from Firestore
 * Uses react-firebase-hooks useDocumentData for reading
 * @param userId - The user's UID
 * @returns Location data, loading state, and error state
 */
export function useUserLocation(userId: string | null) {
  const userRef = userId ? doc(db, 'users', userId) : null;
  const [userData, loading, error] = useDocumentData(userRef);

  const location: UserLocation | null = userData?.settings?.location || null;

  return [location, loading, error] as const;
}

export interface PaydaySettings {
  dayOfMonth1: number | 'last'; // 1-31 or 'last' for last day of month (first payday)
  dayOfMonth2: number | 'last'; // 1-31 or 'last' for last day of month (second payday)
  timestamp?: number;
}

/**
 * Custom hook to save user's payday settings to Firestore at users/{userId}/settings.payday
 * Follows react-firebase-hooks pattern with loading and error states
 * @param userId - The user's UID
 * @returns Tuple with save function, loading state, and error state
 */
export function useSavePaydaySettings(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const savePayday = useCallback(
    async (payday: PaydaySettings) => {
      if (!userId) {
        setError(new Error('User ID is required'));
        return;
      }

      if (payday.dayOfMonth1 !== 'last' && (payday.dayOfMonth1 < 1 || payday.dayOfMonth1 > 31)) {
        setError(new Error('First day of month must be between 1 and 31, or "last"'));
        return;
      }

      if (payday.dayOfMonth2 !== 'last' && (payday.dayOfMonth2 < 1 || payday.dayOfMonth2 > 31)) {
        setError(new Error('Second day of month must be between 1 and 31, or "last"'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const userRef = doc(db, 'users', userId);
        
        await setDoc(
          userRef,
          {
            settings: {
              payday: {
                dayOfMonth1: payday.dayOfMonth1,
                dayOfMonth2: payday.dayOfMonth2,
                timestamp: payday.timestamp || Date.now(),
              },
            },
          },
          { merge: true }
        );
      } catch (err) {
        const firebaseError = err instanceof Error ? err : new Error('Failed to save payday settings');
        setError(firebaseError);
        throw firebaseError;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return [savePayday, loading, error] as const;
}

/**
 * Custom hook to get user's payday settings from Firestore
 * Uses react-firebase-hooks useDocumentData for reading
 * @param userId - The user's UID
 * @returns Payday settings, loading state, and error state
 */
export function usePaydaySettings(userId: string | null) {
  const userRef = userId ? doc(db, 'users', userId) : null;
  const [userData, loading, error] = useDocumentData(userRef);

  const payday: PaydaySettings | null = userData?.settings?.payday || null;

  return [payday, loading, error] as const;
}

export type BortId = 'workTimer' | 'repCounter' | 'sunriseSunset' | 'recurringDailyActions' | 'daysUntilPayday' | 'dateTime' | 'googleCalendar';

/**
 * Custom hook to save user's bort order to Firestore at users/{userId}/settings.bortOrder
 * Follows react-firebase-hooks pattern with loading and error states
 * @param userId - The user's UID
 * @returns Tuple with save function, loading state, and error state
 */
export function useSaveBortOrder(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveBortOrder = useCallback(
    async (bortOrder: BortId[]) => {
      if (!userId) {
        setError(new Error('User ID is required'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const userRef = doc(db, 'users', userId);
        
        await setDoc(
          userRef,
          {
            settings: {
              bortOrder: {
                order: bortOrder,
                timestamp: Date.now(),
              },
            },
          },
          { merge: true }
        );
      } catch (err) {
        const firebaseError = err instanceof Error ? err : new Error('Failed to save bort order');
        setError(firebaseError);
        throw firebaseError;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return [saveBortOrder, loading, error] as const;
}

/**
 * Custom hook to get user's bort order from Firestore
 * Uses react-firebase-hooks useDocumentData for reading
 * @param userId - The user's UID
 * @returns Bort order array, loading state, and error state
 */
export function useBortOrder(userId: string | null) {
  const userRef = userId ? doc(db, 'users', userId) : null;
  const [userData, loading, error] = useDocumentData(userRef);

  const bortOrder: BortId[] | null = userData?.settings?.bortOrder?.order || null;

  return [bortOrder, loading, error] as const;
}

export interface GoogleCalendarSettings {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  calendarIds?: string[];
  maxEvents?: number;
  timestamp?: number;
}

/**
 * Custom hook to get user's Google Calendar settings from Firestore
 * Uses react-firebase-hooks useDocumentData for reading
 * @param userId - The user's UID
 * @returns Google Calendar settings, loading state, and error state
 */
export function useGoogleCalendarSettings(userId: string | null) {
  const userRef = userId ? doc(db, 'users', userId) : null;
  const [userData, loading, error] = useDocumentData(userRef);

  const settings: GoogleCalendarSettings | null = userData?.settings?.googleCalendar || null;

  // Debug logging
  if (userId && !loading) {
    console.log('useGoogleCalendarSettings:', {
      userId,
      hasUserData: !!userData,
      hasSettings: !!userData?.settings,
      hasGoogleCalendar: !!userData?.settings?.googleCalendar,
      settings,
      error,
    });
  }

  return [settings, loading, error] as const;
}
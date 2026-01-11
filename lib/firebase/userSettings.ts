import { useState, useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import type { BortId } from '@/lib/bortlets/registry';

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

// Re-export BortId from registry (single source of truth)
export type { BortId };

/**
 * Grid position for a bortlet (1-based for CSS Grid)
 */
export interface BortPosition {
  row: number; // 1-based grid row
  col: number; // 1-based grid column
}

/**
 * Map of bortlet IDs to their grid positions
 */
export type BortPositions = Record<BortId, BortPosition>;

/**
 * Custom hook to save user's bort positions to Firestore at users/{userId}/settings.bortPositions
 * Follows react-firebase-hooks pattern with loading and error states
 * @param userId - The user's UID
 * @returns Tuple with save function, loading state, and error state
 */
export function useSaveBortPositions(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveBortPositions = useCallback(
    async (bortPositions: BortPositions) => {
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
              bortPositions: {
                positions: bortPositions,
                timestamp: Date.now(),
              },
            },
          },
          { merge: true }
        );
      } catch (err) {
        const firebaseError = err instanceof Error ? err : new Error('Failed to save bort positions');
        setError(firebaseError);
        throw firebaseError;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return [saveBortPositions, loading, error] as const;
}

/**
 * Custom hook to get user's bort positions from Firestore
 * Uses react-firebase-hooks useDocumentData for reading
 * @param userId - The user's UID
 * @returns Bort positions map, loading state, and error state
 */
export function useBortPositions(userId: string | null) {
  const userRef = userId ? doc(db, 'users', userId) : null;
  const [userData, loading, error] = useDocumentData(userRef);

  const bortPositions: BortPositions | null = userData?.settings?.bortPositions?.positions || null;

  return [bortPositions, loading, error] as const;
}

/**
 * Legacy: Custom hook to save user's bort order to Firestore (deprecated, use useSaveBortPositions)
 * Kept for backwards compatibility
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
 * Legacy: Custom hook to get user's bort order from Firestore (deprecated, use useBortPositions)
 * Kept for backwards compatibility
 */
export function useBortOrder(userId: string | null) {
  const userRef = userId ? doc(db, 'users', userId) : null;
  const [userData, loading, error] = useDocumentData(userRef);

  const bortOrder: BortId[] | null = userData?.settings?.bortOrder?.order || null;

  return [bortOrder, loading, error] as const;
}

export interface WorkTimerSettings {
  workStartHour: number; // 0-23
  workStartMinute: number; // 0-59
  workEndHour: number; // 0-23
  workEndMinute: number; // 0-59
  disabledWeekends?: boolean; // If true, show weekend message on weekends
  timestamp?: number;
}

/**
 * Custom hook to save user's work timer settings to Firestore at users/{userId}/settings.workTimer
 * Follows react-firebase-hooks pattern with loading and error states
 * @param userId - The user's UID
 * @returns Tuple with save function, loading state, and error state
 */
export function useSaveWorkTimerSettings(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveWorkTimer = useCallback(
    async (settings: WorkTimerSettings) => {
      if (!userId) {
        setError(new Error('User ID is required'));
        return;
      }

      if (settings.workStartHour < 0 || settings.workStartHour > 23) {
        setError(new Error('Work start hour must be between 0 and 23'));
        return;
      }

      if (settings.workStartMinute < 0 || settings.workStartMinute > 59) {
        setError(new Error('Work start minute must be between 0 and 59'));
        return;
      }

      if (settings.workEndHour < 0 || settings.workEndHour > 23) {
        setError(new Error('Work end hour must be between 0 and 23'));
        return;
      }

      if (settings.workEndMinute < 0 || settings.workEndMinute > 59) {
        setError(new Error('Work end minute must be between 0 and 59'));
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
              workTimer: {
                workStartHour: settings.workStartHour,
                workStartMinute: settings.workStartMinute,
                workEndHour: settings.workEndHour,
                workEndMinute: settings.workEndMinute,
                disabledWeekends: settings.disabledWeekends ?? false,
                timestamp: settings.timestamp || Date.now(),
              },
            },
          },
          { merge: true }
        );
      } catch (err) {
        const firebaseError = err instanceof Error ? err : new Error('Failed to save work timer settings');
        setError(firebaseError);
        throw firebaseError;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return [saveWorkTimer, loading, error] as const;
}

/**
 * Custom hook to get user's work timer settings from Firestore
 * Uses react-firebase-hooks useDocumentData for reading
 * @param userId - The user's UID
 * @returns Work timer settings, loading state, and error state
 */
export function useWorkTimerSettings(userId: string | null) {
  const userRef = userId ? doc(db, 'users', userId) : null;
  const [userData, loading, error] = useDocumentData(userRef);

  const workTimer: WorkTimerSettings | null = userData?.settings?.workTimer || null;

  return [workTimer, loading, error] as const;
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
 * Custom hook to save user's Google Calendar settings to Firestore at users/{userId}/settings.googleCalendar
 * Follows react-firebase-hooks pattern with loading and error states
 * @param userId - The user's UID
 * @returns Tuple with save function, loading state, and error state
 */
export function useSaveGoogleCalendarSettings(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveCalendarSettings = useCallback(
    async (settings: Partial<GoogleCalendarSettings> | null) => {
      if (!userId) {
        setError(new Error('User ID is required'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const userRef = doc(db, 'users', userId);
        
        if (settings === null) {
          // Disconnect: clear all calendar settings
          await setDoc(
            userRef,
            {
              settings: {
                googleCalendar: null,
              },
            },
            { merge: true }
          );
        } else {
          // Save or update settings
          await setDoc(
            userRef,
            {
              settings: {
                googleCalendar: {
                  ...settings,
                  timestamp: settings.timestamp || Date.now(),
                },
              },
            },
            { merge: true }
          );
        }
      } catch (err) {
        const firebaseError = err instanceof Error ? err : new Error('Failed to save calendar settings');
        setError(firebaseError);
        throw firebaseError;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return [saveCalendarSettings, loading, error] as const;
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

/**
 * Custom hook to save user's enabled bortlets to Firestore at users/{userId}/settings.enabledBortlets
 * Follows react-firebase-hooks pattern with loading and error states
 * @param userId - The user's UID
 * @returns Tuple with save function, loading state, and error state
 */
export function useSaveEnabledBortlets(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveEnabledBortlets = useCallback(
    async (enabledBortlets: BortId[]) => {
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
              enabledBortlets: {
                bortlets: enabledBortlets,
                timestamp: Date.now(),
              },
            },
          },
          { merge: true }
        );
      } catch (err) {
        const firebaseError = err instanceof Error ? err : new Error('Failed to save enabled bortlets');
        setError(firebaseError);
        throw firebaseError;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return [saveEnabledBortlets, loading, error] as const;
}

/**
 * Custom hook to get user's enabled bortlets from Firestore
 * Uses react-firebase-hooks useDocumentData for reading
 * @param userId - The user's UID
 * @returns Enabled bortlets array, loading state, and error state
 */
export function useEnabledBortlets(userId: string | null) {
  const userRef = userId ? doc(db, 'users', userId) : null;
  const [userData, loading, error] = useDocumentData(userRef);

  const enabledBortlets: BortId[] | null = userData?.settings?.enabledBortlets?.bortlets || null;

  return [enabledBortlets, loading, error] as const;
}
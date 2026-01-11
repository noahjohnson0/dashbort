import { useState, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { useDocumentData } from 'react-firebase-hooks/firestore';

export interface RepCounterData {
  exerciseTypes: string[];
  countsByDate: Record<string, Record<string, number>>; // date -> exerciseType -> count
  lastDate: string; // Date string in format from toDateString()
}

/**
 * Custom hook to save rep counter data to Firestore at users/{userId}/settings/repCounter
 * @param userId - The user's UID
 * @returns Tuple with save function, loading state, and error state
 */
export function useSaveRepCounterData(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveRepCounterData = useCallback(
    async (data: RepCounterData) => {
      if (!userId) {
        setError(new Error('User ID is required'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const userRef = doc(db, 'users', userId);
        
        // Use setDoc with merge to create or update the document
        await setDoc(
          userRef,
          {
            settings: {
              repCounter: data,
            },
          },
          { merge: true }
        );
      } catch (err) {
        const firebaseError = err instanceof Error ? err : new Error('Failed to save rep counter data');
        setError(firebaseError);
        throw firebaseError;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return [saveRepCounterData, loading, error] as const;
}

/**
 * Custom hook to get rep counter data from Firestore
 * Uses react-firebase-hooks useDocumentData for reading
 * @param userId - The user's UID
 * @returns Rep counter data, loading state, and error state
 */
export function useRepCounterData(userId: string | null) {
  const userRef = userId ? doc(db, 'users', userId) : null;
  const [userData, loading, error] = useDocumentData(userRef);

  const repCounterData: RepCounterData | null = userData?.settings?.repCounter || null;

  return [repCounterData, loading, error] as const;
}

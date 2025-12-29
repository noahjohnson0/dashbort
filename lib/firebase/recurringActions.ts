import { useState, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { useDocumentData } from 'react-firebase-hooks/firestore';

export interface RecurringAction {
  id: string;
  name: string;
  completed: boolean;
}

/**
 * Custom hook to save recurring actions to Firestore at users/{userId}/settings/recurringActions
 * @param userId - The user's UID
 * @returns Tuple with save function, loading state, and error state
 */
export function useSaveRecurringActions(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveActions = useCallback(
    async (actions: RecurringAction[]) => {
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
              recurringActions: actions,
            },
          },
          { merge: true }
        );
      } catch (err) {
        const firebaseError = err instanceof Error ? err : new Error('Failed to save actions');
        setError(firebaseError);
        throw firebaseError;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return [saveActions, loading, error] as const;
}

/**
 * Custom hook to get recurring actions from Firestore
 * Uses react-firebase-hooks useDocumentData for reading
 * @param userId - The user's UID
 * @returns Actions array, loading state, and error state
 */
export function useRecurringActions(userId: string | null) {
  const userRef = userId ? doc(db, 'users', userId) : null;
  const [userData, loading, error] = useDocumentData(userRef);

  const actions: RecurringAction[] = userData?.settings?.recurringActions || [];

  return [actions, loading, error] as const;
}


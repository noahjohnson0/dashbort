'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRepCounterData, useSaveRepCounterData, type RepCounterData } from '@/lib/firebase/repCounter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ExerciseType = string;

const DEFAULT_EXERCISE_TYPES: ExerciseType[] = ['pushup', 'squat', 'pullup'];

export default function RepCounter() {
  const [user] = useAuthState(auth);
  const [repCounterData, dataLoading, dataError] = useRepCounterData(user?.uid || null);
  const [saveRepCounterData, saveLoading, saveError] = useSaveRepCounterData(user?.uid || null);

  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>(DEFAULT_EXERCISE_TYPES);
  const [counts, setCounts] = useState<Record<ExerciseType, number>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localExerciseTypes, setLocalExerciseTypes] = useState<ExerciseType[]>(DEFAULT_EXERCISE_TYPES);
  const [highlightedExercise, setHighlightedExercise] = useState<ExerciseType | null>(null);
  const hasInitialized = useRef(false);

  // Load data from Firebase
  useEffect(() => {
    if (dataLoading || !user?.uid) return;

    const today = new Date().toDateString();
    
    if (repCounterData) {
      hasInitialized.current = true;
      
      // Use saved exercise types
      const savedTypes = repCounterData.exerciseTypes.length > 0 
        ? repCounterData.exerciseTypes 
        : DEFAULT_EXERCISE_TYPES;
      setExerciseTypes(savedTypes);
      setLocalExerciseTypes(savedTypes);

      // Check if we need to reset counts for a new day
      if (repCounterData.lastDate === today) {
        // Use saved counts
        setCounts(repCounterData.currentDayCounts || {});
      } else {
        // Reset counts for new day
        const resetCounts: Record<ExerciseType, number> = {};
        savedTypes.forEach((exerciseType) => {
          resetCounts[exerciseType] = 0;
        });
        setCounts(resetCounts);
        
        // Save reset data to Firebase
        saveRepCounterData({
          exerciseTypes: savedTypes,
          currentDayCounts: resetCounts,
          lastDate: today,
        }).catch(console.error);
      }
    } else if (!hasInitialized.current) {
      // Initialize with defaults if no data exists (only once)
      hasInitialized.current = true;
      const initialCounts: Record<ExerciseType, number> = {};
      DEFAULT_EXERCISE_TYPES.forEach((exerciseType) => {
        initialCounts[exerciseType] = 0;
      });
      setExerciseTypes(DEFAULT_EXERCISE_TYPES);
      setLocalExerciseTypes(DEFAULT_EXERCISE_TYPES);
      setCounts(initialCounts);
      
      // Save initial data to Firebase
      saveRepCounterData({
        exerciseTypes: DEFAULT_EXERCISE_TYPES,
        currentDayCounts: initialCounts,
        lastDate: today,
      }).catch(console.error);
    }
  }, [repCounterData, dataLoading, user?.uid, saveRepCounterData]);

  useEffect(() => {
    if (highlightedExercise) {
      const timer = setTimeout(() => {
        setHighlightedExercise(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [highlightedExercise]);

  const increment = useCallback(async (exerciseType: ExerciseType) => {
    if (!user?.uid) return;

    const currentCount = counts[exerciseType] || 0;
    const newCount = currentCount + 1;
    const updatedCounts = { ...counts, [exerciseType]: newCount };
    setCounts(updatedCounts);

    const today = new Date().toDateString();
    
    // Save to Firebase
    try {
      await saveRepCounterData({
        exerciseTypes,
        currentDayCounts: updatedCounts,
        lastDate: today,
      });
    } catch (err) {
      console.error('Failed to save rep count:', err);
    }

    // Highlight the exercise card
    setHighlightedExercise(exerciseType);
  }, [counts, exerciseTypes, user?.uid, saveRepCounterData]);

  const decrement = useCallback(async (exerciseType: ExerciseType) => {
    if (!user?.uid) return;

    const currentCount = counts[exerciseType] || 0;
    if (currentCount > 0) {
      const newCount = currentCount - 1;
      const updatedCounts = { ...counts, [exerciseType]: newCount };
      setCounts(updatedCounts);

      const today = new Date().toDateString();
      
      // Save to Firebase
      try {
        await saveRepCounterData({
          exerciseTypes,
          currentDayCounts: updatedCounts,
          lastDate: today,
        });
      } catch (err) {
        console.error('Failed to save rep count:', err);
      }
    }
  }, [counts, exerciseTypes, user?.uid, saveRepCounterData]);

  const handleAddExercise = () => {
    const newExercise = `exercise${localExerciseTypes.length + 1}`;
    setLocalExerciseTypes([...localExerciseTypes, newExercise]);
  };

  const handleRemoveExercise = (index: number) => {
    if (localExerciseTypes.length > 1) {
      const updated = localExerciseTypes.filter((_, i) => i !== index);
      setLocalExerciseTypes(updated);
    }
  };

  const handleUpdateExercise = (index: number, value: string) => {
    const updated = [...localExerciseTypes];
    updated[index] = value.trim().toLowerCase() || updated[index];
    setLocalExerciseTypes(updated);
  };

  const handleSaveConfiguration = async () => {
    if (!user?.uid) return;

    // Filter out empty exercises
    const validExercises = localExerciseTypes.filter(ex => ex.trim() !== '');
    if (validExercises.length === 0) {
      alert('Please add at least one exercise type.');
      return;
    }

    const today = new Date().toDateString();
    
    // Initialize counts for new exercise types
    const updatedCounts: Record<ExerciseType, number> = { ...counts };
    validExercises.forEach((exerciseType) => {
      if (!(exerciseType in updatedCounts)) {
        updatedCounts[exerciseType] = 0;
      }
    });
    
    // Remove counts for removed exercise types
    Object.keys(updatedCounts).forEach((exerciseType) => {
      if (!validExercises.includes(exerciseType)) {
        delete updatedCounts[exerciseType];
      }
    });

    // Save to Firebase
    try {
      await saveRepCounterData({
        exerciseTypes: validExercises,
        currentDayCounts: updatedCounts,
        lastDate: today,
      });

      // Update state
      setExerciseTypes(validExercises);
      setCounts(updatedCounts);

      // Close dialog
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save exercise types:', err);
      alert('Failed to save exercise types. Please try again.');
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 select-none">
          Rep Counter
        </h2>
        <button
          onClick={() => {
            setLocalExerciseTypes(exerciseTypes);
            setIsDialogOpen(true);
          }}
          className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          aria-label="Configure rep counter"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
      {dataLoading && (
        <div className="text-center text-zinc-600 dark:text-zinc-400 py-4">
          Loading...
        </div>
      )}
      {dataError && (
        <div className="text-center text-red-600 dark:text-red-400 py-4">
          Error loading data: {dataError.message}
        </div>
      )}
      {!dataLoading && !dataError && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {exerciseTypes.map((exerciseType) => (
          <div
            key={exerciseType}
            onClick={() => increment(exerciseType)}
            className={`cursor-pointer hover:opacity-80 transition-all duration-300 rounded-lg p-3 border ${highlightedExercise === exerciseType
              ? 'bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-700'
              : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
              }`}
          >
            <div className={`text-xs font-semibold mb-1.5 text-center select-none uppercase tracking-wide ${highlightedExercise === exerciseType
              ? 'text-white'
              : 'text-zinc-600 dark:text-zinc-400'
              }`}>
              {exerciseType}
            </div>
            <div className={`text-2xl font-bold mb-2 text-center select-none ${highlightedExercise === exerciseType
              ? 'text-white'
              : 'text-zinc-900 dark:text-zinc-100'
              }`}>
              {counts[exerciseType] || 0}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  decrement(exerciseType);
                }}
                disabled={(counts[exerciseType] || 0) === 0}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-md font-semibold transition-colors select-none text-xs"
              >
                −
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure Exercise Types</DialogTitle>
            <DialogDescription>
              Add, remove, or rename exercise types. Changes will be saved when you click Save.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {localExerciseTypes.map((exerciseType, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={exerciseType}
                    onChange={(e) => handleUpdateExercise(index, e.target.value)}
                    placeholder="Exercise name..."
                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleRemoveExercise(index)}
                    disabled={localExerciseTypes.length === 1}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-md font-semibold transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleAddExercise}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md font-semibold transition-colors"
            >
              Add Exercise
            </button>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-md font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfiguration}
              disabled={saveLoading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-md font-semibold transition-colors"
            >
              {saveLoading ? 'Saving...' : 'Save'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

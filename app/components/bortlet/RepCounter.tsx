'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
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
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>(DEFAULT_EXERCISE_TYPES);
  const [counts, setCounts] = useState<Record<ExerciseType, number>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localExerciseTypes, setLocalExerciseTypes] = useState<ExerciseType[]>(DEFAULT_EXERCISE_TYPES);
  const [highlightedExercise, setHighlightedExercise] = useState<ExerciseType | null>(null);

  useEffect(() => {
    // Load exercise types from localStorage
    const savedTypes = localStorage.getItem('repCounter_exerciseTypes');
    if (savedTypes) {
      try {
        const parsed = JSON.parse(savedTypes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExerciseTypes(parsed);
          setLocalExerciseTypes(parsed);
        }
      } catch (e) {
        console.error('Failed to parse exercise types:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Load all counts from localStorage
    const today = new Date().toDateString();
    const loadedCounts: Record<ExerciseType, number> = {};

    exerciseTypes.forEach((exerciseType) => {
      const storageKey = `repCount_${exerciseType}`;
      const dateKey = `repCountDate_${exerciseType}`;
      const saved = localStorage.getItem(storageKey);
      const savedDate = localStorage.getItem(dateKey);

      if (saved && savedDate === today) {
        loadedCounts[exerciseType] = parseInt(saved, 10);
      } else {
        // Reset if it's a new day
        loadedCounts[exerciseType] = 0;
        localStorage.setItem(storageKey, '0');
        localStorage.setItem(dateKey, today);
      }
    });

    setCounts(loadedCounts);
  }, [exerciseTypes]);

  useEffect(() => {
    if (highlightedExercise) {
      const timer = setTimeout(() => {
        setHighlightedExercise(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [highlightedExercise]);

  const increment = (exerciseType: ExerciseType) => {
    const currentCount = counts[exerciseType] || 0;
    const newCount = currentCount + 1;
    const updatedCounts = { ...counts, [exerciseType]: newCount };
    setCounts(updatedCounts);

    const storageKey = `repCount_${exerciseType}`;
    localStorage.setItem(storageKey, newCount.toString());
    localStorage.setItem(`repCountDate_${exerciseType}`, new Date().toDateString());

    // Highlight the exercise card
    setHighlightedExercise(exerciseType);
  };

  const decrement = (exerciseType: ExerciseType) => {
    const currentCount = counts[exerciseType] || 0;
    if (currentCount > 0) {
      const newCount = currentCount - 1;
      const updatedCounts = { ...counts, [exerciseType]: newCount };
      setCounts(updatedCounts);

      const storageKey = `repCount_${exerciseType}`;
      localStorage.setItem(storageKey, newCount.toString());
      localStorage.setItem(`repCountDate_${exerciseType}`, new Date().toDateString());
    }
  };

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

  const handleSaveConfiguration = () => {
    // Filter out empty exercises
    const validExercises = localExerciseTypes.filter(ex => ex.trim() !== '');
    if (validExercises.length === 0) {
      alert('Please add at least one exercise type.');
      return;
    }

    // Save to localStorage
    localStorage.setItem('repCounter_exerciseTypes', JSON.stringify(validExercises));

    // Update state
    setExerciseTypes(validExercises);

    // Close dialog
    setIsDialogOpen(false);
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
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md font-semibold transition-colors"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

type ExerciseType = 'pushup' | 'squat' | 'pullup';

const EXERCISE_TYPES: ExerciseType[] = ['pushup', 'squat', 'pullup'];

export default function RepCounter() {
  const [counts, setCounts] = useState<Record<ExerciseType, number>>({
    'pushup': 0,
    'squat': 0,
    'pullup': 0,
  });

  useEffect(() => {
    // Load all counts from localStorage
    const today = new Date().toDateString();
    const loadedCounts: Record<ExerciseType, number> = {
      'pushup': 0,
      'squat': 0,
      'pullup': 0,
    };

    EXERCISE_TYPES.forEach((exerciseType) => {
      const storageKey = `repCount_${exerciseType}`;
      const dateKey = `repCountDate_${exerciseType}`;
      const saved = localStorage.getItem(storageKey);
      const savedDate = localStorage.getItem(dateKey);

      if (saved && savedDate === today) {
        loadedCounts[exerciseType] = parseInt(saved, 10);
      } else {
        // Reset if it's a new day
        localStorage.setItem(storageKey, '0');
        localStorage.setItem(dateKey, today);
      }
    });

    setCounts(loadedCounts);
  }, []);

  const increment = (exerciseType: ExerciseType) => {
    const newCount = counts[exerciseType] + 1;
    const updatedCounts = { ...counts, [exerciseType]: newCount };
    setCounts(updatedCounts);
    
    const storageKey = `repCount_${exerciseType}`;
    localStorage.setItem(storageKey, newCount.toString());
    localStorage.setItem(`repCountDate_${exerciseType}`, new Date().toDateString());
  };

  const decrement = (exerciseType: ExerciseType) => {
    if (counts[exerciseType] > 0) {
      const newCount = counts[exerciseType] - 1;
      const updatedCounts = { ...counts, [exerciseType]: newCount };
      setCounts(updatedCounts);
      
      const storageKey = `repCount_${exerciseType}`;
      localStorage.setItem(storageKey, newCount.toString());
      localStorage.setItem(`repCountDate_${exerciseType}`, new Date().toDateString());
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 select-none">
        Rep Counter
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {EXERCISE_TYPES.map((exerciseType) => (
          <div
            key={exerciseType}
            onClick={() => increment(exerciseType)}
            className="cursor-pointer hover:opacity-80 transition-opacity bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700"
          >
            <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2 text-center select-none uppercase tracking-wide">
              {exerciseType}
            </div>
            <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 text-center select-none">
              {counts[exerciseType]}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  decrement(exerciseType);
                }}
                disabled={counts[exerciseType] === 0}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors select-none text-sm"
              >
                −
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

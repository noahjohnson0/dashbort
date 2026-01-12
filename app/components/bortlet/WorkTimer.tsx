'use client';

import { useState, useEffect, useRef } from 'react';
import { Briefcase } from 'lucide-react';
import type { BortletProps } from '@/lib/bortlets/types';
import { BortletContainer, BortletHeader, BortletLoading } from '@/lib/bortlets/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useSaveWorkTimerSettings, useWorkTimerSettings } from '@/lib/firebase';

export default function WorkTimer({ userId }: BortletProps) {
  const [savedWorkTimer, workTimerLoading, workTimerError] = useWorkTimerSettings(userId);
  const [saveWorkTimer, saveWorkTimerLoading, saveWorkTimerError] = useSaveWorkTimerSettings(userId);

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [percentWorked, setPercentWorked] = useState(0);
  const [percentLeft, setPercentLeft] = useState(100);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [workStartHour, setWorkStartHour] = useState(9);
  const [workStartMinute, setWorkStartMinute] = useState(0);
  const [workEndHour, setWorkEndHour] = useState(17);
  const [workEndMinute, setWorkEndMinute] = useState(0);
  const [disabledWeekends, setDisabledWeekends] = useState(false);
  const hasInitialized = useRef(false);

  // Reset initialization when user changes
  useEffect(() => {
    hasInitialized.current = false;
  }, [userId]);

  // Load settings from Firebase
  useEffect(() => {
    if (hasInitialized.current) return;

    // Wait for work timer loading to complete
    if (workTimerLoading) return;

    // Load from Firebase if user is authenticated
    if (userId && savedWorkTimer) {
      setWorkStartHour(savedWorkTimer.workStartHour);
      setWorkStartMinute(savedWorkTimer.workStartMinute);
      setWorkEndHour(savedWorkTimer.workEndHour);
      setWorkEndMinute(savedWorkTimer.workEndMinute);
      setDisabledWeekends(savedWorkTimer.disabledWeekends ?? false);
      hasInitialized.current = true;
      return;
    }

    // Use defaults if no Firebase data
    hasInitialized.current = true;
  }, [userId, savedWorkTimer, workTimerLoading]);

  // Save settings to Firebase when changed
  useEffect(() => {
    if (!hasInitialized.current) return;
    if (!userId) return; // Only save to Firebase if user is authenticated

    // Debounce saves to avoid too many writes
    const timeoutId = setTimeout(() => {
      saveWorkTimer({
        workStartHour,
        workStartMinute,
        workEndHour,
        workEndMinute,
        disabledWeekends,
        timestamp: Date.now(),
      }).catch((err) => {
        console.error('Failed to save work timer settings:', err);
      });
    }, 500); // Wait 500ms after last change

    return () => clearTimeout(timeoutId);
  }, [workStartHour, workStartMinute, workEndHour, workEndMinute, disabledWeekends, userId, saveWorkTimer]);

  const getWorkdayTimes = () => {
    const now = new Date();
    const workStart = new Date();
    workStart.setHours(workStartHour, workStartMinute, 0, 0);

    const workEnd = new Date();
    workEnd.setHours(workEndHour, workEndMinute, 0, 0);

    // If it's already past work end time today, target next workday
    if (now.getTime() >= workEnd.getTime()) {
      workStart.setDate(workStart.getDate() + 1);
      workEnd.setDate(workEnd.getDate() + 1);
    }

    return {
      start: workStart.getTime(),
      end: workEnd.getTime(),
      total: workEnd.getTime() - workStart.getTime()
    };
  };

  useEffect(() => {
    const updateTimeRemaining = () => {
      const { start, end, total } = getWorkdayTimes();
      const now = Date.now();

      // Calculate time remaining until end of workday
      const remaining = Math.max(0, end - now);
      setTimeRemaining(remaining);

      // Calculate percentages
      if (total <= 0) {
        setPercentWorked(0);
        setPercentLeft(100);
        return;
      }

      if (now < start) {
        // Workday hasn't started yet
        setPercentWorked(0);
        setPercentLeft(100);
      } else if (now >= end) {
        // Workday is over
        setPercentWorked(100);
        setPercentLeft(0);
      } else {
        // Workday is in progress
        const elapsed = now - start;
        const remaining = Math.max(0, end - now);
        const worked = (elapsed / total) * 100;
        const left = (remaining / total) * 100;
        const workedValue = isNaN(worked) ? 0 : Math.min(100, Math.max(0, worked));
        const leftValue = isNaN(left) ? 100 : Math.min(100, Math.max(0, left));
        setPercentWorked(workedValue);
        setPercentLeft(leftValue);
      }
    };

    // Update immediately
    updateTimeRemaining();

    // Update every second
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [workStartHour, workStartMinute, workEndHour, workEndMinute]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const formatTimeDisplay = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const isOver = timeRemaining === 0;

  // Check if it's a weekend (Saturday = 6, Sunday = 0)
  const isWeekend = () => {
    const dayOfWeek = new Date().getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const showWeekendMessage = disabledWeekends && isWeekend();

  return (
    <BortletContainer>
      <BortletHeader
        title="Work Day Countdown"
        action={
          <button
            onClick={() => setIsDialogOpen(true)}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Configure workday"
          >
            <Briefcase className="h-5 w-5" />
          </button>
        }
      />
      {workTimerLoading && !hasInitialized.current ? (
        <BortletLoading />
      ) : (
        <>
          {showWeekendMessage ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center">
                Congrats, its the weekend
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-6">
                <div className={`text-4xl font-mono font-bold ${isOver ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  {isOver ? 'Work is over! 🎉' : formatTime(timeRemaining)}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Worked:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {percentWorked.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Remaining:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {percentLeft.toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                Counting down to {formatTimeDisplay(workEndHour, workEndMinute)}
              </p>
            </>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure Workday</DialogTitle>
            <DialogDescription>
              Set your work start and end times. Changes will be saved automatically.
            </DialogDescription>
          </DialogHeader>
          {(saveWorkTimerError || workTimerError) && (
            <div className="text-red-600 dark:text-red-400 text-sm px-6">
              {saveWorkTimerError?.message || workTimerError?.message || 'Error saving work timer settings'}
            </div>
          )}
          {saveWorkTimerLoading && (
            <div className="text-blue-600 dark:text-blue-400 text-sm px-6">
              Saving...
            </div>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Work Start Time
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={workStartHour}
                  onChange={(e) => setWorkStartHour(parseInt(e.target.value, 10))}
                  disabled={saveWorkTimerLoading}
                  className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <option key={hour} value={hour}>
                      {hour.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="text-zinc-600 dark:text-zinc-400">:</span>
                <select
                  value={workStartMinute}
                  onChange={(e) => setWorkStartMinute(parseInt(e.target.value, 10))}
                  disabled={saveWorkTimerLoading}
                  className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                    <option key={minute} value={minute}>
                      {minute.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-2">
                  ({formatTimeDisplay(workStartHour, workStartMinute)})
                </span>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Work End Time
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={workEndHour}
                  onChange={(e) => setWorkEndHour(parseInt(e.target.value, 10))}
                  disabled={saveWorkTimerLoading}
                  className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <option key={hour} value={hour}>
                      {hour.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="text-zinc-600 dark:text-zinc-400">:</span>
                <select
                  value={workEndMinute}
                  onChange={(e) => setWorkEndMinute(parseInt(e.target.value, 10))}
                  disabled={saveWorkTimerLoading}
                  className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                    <option key={minute} value={minute}>
                      {minute.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-2">
                  ({formatTimeDisplay(workEndHour, workEndMinute)})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="disabledWeekends"
                checked={disabledWeekends}
                onCheckedChange={(checked) => setDisabledWeekends(checked === true)}
                disabled={saveWorkTimerLoading}
              />
              <label
                htmlFor="disabledWeekends"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Disabled weekends
              </label>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsDialogOpen(false)}
              disabled={saveWorkTimerLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BortletContainer>
  );
}


'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, useSavePaydaySettings, usePaydaySettings } from '@/lib/firebase';

const PAYDAY_STORAGE_KEY_1 = 'dashbort_payday_day_1';
const PAYDAY_STORAGE_KEY_2 = 'dashbort_payday_day_2';

// Helper function to get the last day of a month
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Helper function to adjust date to previous business day if it's a weekend
function adjustToBusinessDay(date: Date): Date {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) {
    // Sunday - move to Friday
    date.setDate(date.getDate() - 2);
  } else if (dayOfWeek === 6) {
    // Saturday - move to Friday
    date.setDate(date.getDate() - 1);
  }
  return date;
}

export default function DaysUntilPayday() {
  const [user] = useAuthState(auth);
  const [savedPayday, paydayLoading, paydayError] = usePaydaySettings(user?.uid || null);
  const [savePayday, savePaydayLoading, savePaydayError] = useSavePaydaySettings(user?.uid || null);
  
  const [daysUntilPayday, setDaysUntilPayday] = useState<number | null>(null);
  const [nextPaydayDate, setNextPaydayDate] = useState<Date | null>(null);
  const [dayOfMonth1, setDayOfMonth1] = useState<number | 'last'>(15);
  const [dayOfMonth2, setDayOfMonth2] = useState<number | 'last'>('last');
  const [isEditing, setIsEditing] = useState(false);
  const hasInitialized = useRef(false);

  const calculateNextPayday = (targetDay1: number | 'last', targetDay2: number | 'last'): Date => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const candidates: Date[] = [];

    // Helper to get actual payday date for a given target day
    const getPaydayDate = (targetDay: number | 'last', year: number, month: number): Date => {
      let date: Date;
      if (targetDay === 'last') {
        const lastDay = getLastDayOfMonth(year, month);
        date = new Date(year, month, lastDay);
      } else {
        const lastDayOfMonth = getLastDayOfMonth(year, month);
        const adjustedDay = Math.min(targetDay, lastDayOfMonth);
        date = new Date(year, month, adjustedDay);
      }
      // Adjust to business day (previous Friday if weekend)
      return adjustToBusinessDay(date);
    };

    // This month's paydays
    const thisMonthPayday1 = getPaydayDate(targetDay1, currentYear, currentMonth);
    const thisMonthPayday2 = getPaydayDate(targetDay2, currentYear, currentMonth);
    
    if (thisMonthPayday1.getTime() > now.getTime()) {
      candidates.push(thisMonthPayday1);
    }
    if (thisMonthPayday2.getTime() > now.getTime()) {
      candidates.push(thisMonthPayday2);
    }

    // Next month's paydays
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonthPayday1 = getPaydayDate(targetDay1, nextMonthYear, nextMonth);
    const nextMonthPayday2 = getPaydayDate(targetDay2, nextMonthYear, nextMonth);
    candidates.push(nextMonthPayday1);
    candidates.push(nextMonthPayday2);

    // Find the earliest future payday
    const futurePaydays = candidates.filter(date => date.getTime() > now.getTime());
    const nextPayday = futurePaydays.length > 0 
      ? futurePaydays.reduce((earliest, current) => 
          current.getTime() < earliest.getTime() ? current : earliest
        )
      : candidates[0]; // Fallback to first candidate if all are in the past

    return nextPayday;
  };

  const calculateDaysUntilPayday = (targetDay1: number | 'last', targetDay2: number | 'last') => {
    const nextPayday = calculateNextPayday(targetDay1, targetDay2);
    setNextPaydayDate(nextPayday);

    // Calculate days until payday
    const now = new Date();
    const diffTime = nextPayday.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    setDaysUntilPayday(Math.max(0, diffDays));
  };

  const handleSavePayday = async () => {
    if (
      (dayOfMonth1 !== 'last' && (dayOfMonth1 < 1 || dayOfMonth1 > 31)) ||
      (dayOfMonth2 !== 'last' && (dayOfMonth2 < 1 || dayOfMonth2 > 31))
    ) {
      return;
    }

    const day1Str = dayOfMonth1 === 'last' ? 'last' : dayOfMonth1.toString();
    const day2Str = dayOfMonth2 === 'last' ? 'last' : dayOfMonth2.toString();
    localStorage.setItem(PAYDAY_STORAGE_KEY_1, day1Str);
    localStorage.setItem(PAYDAY_STORAGE_KEY_2, day2Str);
    
    // Save to Firebase
    if (user?.uid) {
      try {
        await savePayday({
          dayOfMonth1,
          dayOfMonth2,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Failed to save payday to Firebase:', err);
        // Don't block the UI if Firebase save fails
      }
    }
    
    setIsEditing(false);
    calculateDaysUntilPayday(dayOfMonth1, dayOfMonth2);
  };

  useEffect(() => {
    // Reset initialization when user changes
    hasInitialized.current = false;
  }, [user?.uid]);

  useEffect(() => {
    // Skip if already initialized
    if (hasInitialized.current) return;
    
    // Wait for payday loading to complete
    if (paydayLoading) return;
    
    // First, try to load payday from Firebase if user is authenticated
    if (user?.uid && savedPayday) {
      // Handle migration from old single-day format
      if ('dayOfMonth' in savedPayday && !('dayOfMonth1' in savedPayday)) {
        // Old format - migrate to new format
        const oldDay = (savedPayday as any).dayOfMonth;
        const day1 = oldDay;
        const day2 = oldDay === 1 ? 'last' : 15; // Default second payday
        setDayOfMonth1(day1);
        setDayOfMonth2(day2);
        calculateDaysUntilPayday(day1, day2);
      } else {
        setDayOfMonth1(savedPayday.dayOfMonth1);
        setDayOfMonth2(savedPayday.dayOfMonth2);
        calculateDaysUntilPayday(savedPayday.dayOfMonth1, savedPayday.dayOfMonth2);
      }
      hasInitialized.current = true;
      return;
    }
    
    // Fallback to localStorage if Firebase doesn't have payday
    const savedDay1 = localStorage.getItem(PAYDAY_STORAGE_KEY_1);
    const savedDay2 = localStorage.getItem(PAYDAY_STORAGE_KEY_2);
    
    // Check for old single-day format
    const oldSavedDay = localStorage.getItem('dashbort_payday_day');
    
    if (savedDay1 && savedDay2) {
      const day1 = savedDay1 === 'last' ? 'last' : parseInt(savedDay1, 10);
      const day2 = savedDay2 === 'last' ? 'last' : parseInt(savedDay2, 10);
      if (
        (day1 === 'last' || (day1 >= 1 && day1 <= 31)) &&
        (day2 === 'last' || (day2 >= 1 && day2 <= 31))
      ) {
        setDayOfMonth1(day1);
        setDayOfMonth2(day2);
        calculateDaysUntilPayday(day1, day2);
      } else {
        setIsEditing(true);
      }
    } else if (oldSavedDay) {
      // Migrate from old format
      const day = parseInt(oldSavedDay, 10);
      if (day >= 1 && day <= 31) {
        setDayOfMonth1(day);
        setDayOfMonth2(day === 1 ? 'last' : 15);
        calculateDaysUntilPayday(day, day === 1 ? 'last' : 15);
        // Clean up old key
        localStorage.removeItem('dashbort_payday_day');
      } else {
        setIsEditing(true);
      }
    } else {
      setIsEditing(true);
    }
    
    hasInitialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, savedPayday, paydayLoading]);

  // Update countdown every minute
  useEffect(() => {
    if (!hasInitialized.current || isEditing) return;

    const interval = setInterval(() => {
      if (
        (dayOfMonth1 === 'last' || (dayOfMonth1 >= 1 && dayOfMonth1 <= 31)) &&
        (dayOfMonth2 === 'last' || (dayOfMonth2 >= 1 && dayOfMonth2 <= 31))
      ) {
        calculateDaysUntilPayday(dayOfMonth1, dayOfMonth2);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [dayOfMonth1, dayOfMonth2, isEditing]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPaydayLabel = (day: number | 'last'): string => {
    if (day === 'last') {
      return 'Last day of month';
    }
    return `${day}${getOrdinalSuffix(day)}`;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 select-none">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Days Until Payday
        </h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          aria-label="Edit payday"
        >
          {isEditing ? <X className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Paydays (twice monthly)
            </label>
            <div className="space-y-3">
              <div>
                <label htmlFor="payday1" className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                  First Payday
                </label>
                <select
                  id="payday1"
                  value={dayOfMonth1 === 'last' ? 'last' : dayOfMonth1}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'last') {
                      setDayOfMonth1('last');
                    } else {
                      const num = parseInt(value, 10);
                      if (!isNaN(num) && num >= 1 && num <= 31) {
                        setDayOfMonth1(num);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={savePaydayLoading}
                >
                  <option value="last">Last day of month</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}{getOrdinalSuffix(day)} of month
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="payday2" className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                  Second Payday
                </label>
                <select
                  id="payday2"
                  value={dayOfMonth2 === 'last' ? 'last' : dayOfMonth2}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'last') {
                      setDayOfMonth2('last');
                    } else {
                      const num = parseInt(value, 10);
                      if (!isNaN(num) && num >= 1 && num <= 31) {
                        setDayOfMonth2(num);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={savePaydayLoading}
                >
                  <option value="last">Last day of month</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}{getOrdinalSuffix(day)} of month
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              * Paydays automatically adjust to the previous Friday if they fall on a weekend
            </div>
            <button
              onClick={handleSavePayday}
              disabled={savePaydayLoading}
              className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {savePaydayLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
          {(savePaydayError || paydayError) && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {savePaydayError?.message || paydayError?.message || 'Error saving payday'}
            </div>
          )}
        </div>
      ) : (
        <>
          {paydayLoading ? (
            <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
          ) : daysUntilPayday === null ? (
            <div className="text-zinc-600 dark:text-zinc-400 text-sm">
              Please set your payday day
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                    {daysUntilPayday}
                  </div>
                </div>
              </div>
              {nextPaydayDate && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Next payday: <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatDate(nextPaydayDate)}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    Paydays: {formatPaydayLabel(dayOfMonth1)} & {formatPaydayLabel(dayOfMonth2)} of each month
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

'use client';

import { useMemo, useState } from 'react';
import { Settings } from 'lucide-react';
import type { BortletProps } from '@/lib/bortlets/types';
import { BortletContainer, BortletHeader, BortletLoading, BortletError } from '@/lib/bortlets/components';
import { useRepCounterData } from '@/lib/firebase/repCounter';
import { getMonthBorderInfo, getMonthBorderClasses } from '@/lib/workoutHistoryBorders';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DayData {
  date: Date;
  dateString: string;
  totalReps: number;
  isFuture: boolean;
}

export default function WorkoutHistory({ userId }: BortletProps) {
  const [repCounterData, dataLoading, dataError] = useRepCounterData(userId);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Generate data from 4 weeks ago to end of current month, including future days
  const daysData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: DayData[] = [];
    
    // Get countsByDate from rep counter data
    const countsByDate = repCounterData?.countsByDate || {};

    // Calculate the start date: Sunday of 4 weeks ago
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const daysSinceLastSunday = currentDayOfWeek + 7; // Days to go back to last Sunday
    const daysToGoBack = daysSinceLastSunday + (3 * 7); // Go back 3 more weeks (4 weeks total)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysToGoBack);
    
    // Calculate the end date: last day of the current month
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const endDate = new Date(currentYear, currentMonth + 1, 0); // Last day of current month
    endDate.setHours(0, 0, 0, 0);
    
    // Generate array of days from start date to end of current month
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toDateString();
      const isFuture = currentDate > today;
      
      // Calculate total reps for this day (future days will have 0)
      const dayCounts = isFuture ? {} : (countsByDate[dateString] || {});
      const totalReps = Object.values(dayCounts).reduce((sum, count) => sum + count, 0) as number;
      
      days.push({ 
        date: new Date(currentDate), 
        dateString, 
        totalReps,
        isFuture
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [repCounterData]);

  // Organize days into weeks (7 columns, starting from Sunday)
  const weeksData = useMemo(() => {
    if (daysData.length === 0) return [];
    
    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];
    
    // Find the first day's day of week (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = daysData[0].date.getDay();
    
    // Fill in empty days at the start if first day isn't Sunday
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({
        date: new Date(daysData[0].date.getTime() - (firstDayOfWeek - i) * 24 * 60 * 60 * 1000),
        dateString: '',
        totalReps: 0,
        isFuture: false,
      });
    }
    
    // Add all days (should be exactly 28 days, filling 4 complete weeks)
    daysData.forEach((day) => {
      currentWeek.push(day);
      
      // When we reach Saturday (day 6), finish the week
      if (day.date.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Handle the last incomplete week (shouldn't happen with 28 days, but just in case)
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [daysData]);

  // Get color intensity based on total reps and whether it's a future day
  const getColorClass = (totalReps: number, isFuture: boolean): string => {
    if (isFuture) {
      return 'bg-zinc-200 dark:bg-zinc-700';
    }
    
    if (totalReps === 0) {
      return 'bg-zinc-100 dark:bg-zinc-800';
    } else if (totalReps <= 10) {
      return 'bg-green-200 dark:bg-green-900';
    } else if (totalReps <= 25) {
      return 'bg-green-400 dark:bg-green-700';
    } else if (totalReps <= 50) {
      return 'bg-green-600 dark:bg-green-500';
    } else {
      return 'bg-green-700 dark:bg-green-400';
    }
  };

  // Format date for tooltip
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get day label (first letter of weekday)
  const getDayLabel = (dayIndex: number): string => {
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return labels[dayIndex];
  };

  if (dataLoading) {
    return (
      <BortletContainer className="overflow-hidden">
        <BortletHeader 
          title="Workout History"
          action={
            <button
              onClick={() => setIsDialogOpen(true)}
              className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Configure workout history"
            >
              <Settings className="h-5 w-5" />
            </button>
          }
        />
        <div className="flex-1 overflow-auto min-h-0 flex items-center justify-center">
          <div className="flex flex-col gap-1">
            {/* Day labels skeleton */}
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                <div
                  key={dayIndex}
                  className="w-3 h-4 text-xs text-zinc-500 dark:text-zinc-500 text-center flex items-center justify-center"
                >
                  {getDayLabel(dayIndex)}
                </div>
              ))}
            </div>
            {/* Weeks grid skeleton */}
            <div className="flex flex-col gap-1 flex-1">
              {[0, 1, 2, 3].map((weekIndex) => (
                <div key={weekIndex} className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className="w-3 h-3 rounded-sm bg-zinc-200 dark:bg-zinc-700 animate-pulse"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </BortletContainer>
    );
  }

  if (dataError) {
    return (
      <BortletContainer className="overflow-hidden">
        <BortletHeader 
          title="Workout History"
          action={
            <button
              onClick={() => setIsDialogOpen(true)}
              className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Configure workout history"
            >
              <Settings className="h-5 w-5" />
            </button>
          }
        />
        <BortletError error={dataError} message={`Error loading workout history: ${dataError.message}`} />
      </BortletContainer>
    );
  }

  return (
    <BortletContainer className="overflow-hidden">
      <BortletHeader
        title="Workout History"
        action={
          <button
            onClick={() => setIsDialogOpen(true)}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Configure workout history"
          >
            <Settings className="h-5 w-5" />
          </button>
        }
      />

      <div className="flex-1 overflow-auto flex items-center justify-center min-h-0">
        <div className="flex flex-col gap-1 items-center w-[200px]">
          {/* Day labels */}
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
              <div
                key={dayIndex}
                className="w-3 h-4 text-xs text-zinc-500 dark:text-zinc-400 text-center flex items-center justify-center leading-tight"
              >
                {getDayLabel(dayIndex)}
              </div>
            ))}
          </div>

          {/* Weeks grid */}
          <div className="flex flex-col gap-1 flex-1">
            {weeksData.map((week, weekIndex) => {
              // Get current month/year for border color determination
              const today = new Date();
              const currentMonth = today.getMonth();
              const currentYear = today.getFullYear();
              
              return (
                <div key={weekIndex} className="flex gap-1">
                  {week.map((day, dayIndex) => {
                    const isEmpty = !day.dateString;
                    const borderInfo = getMonthBorderInfo(day.date, weekIndex, dayIndex, weeksData);
                    const borderClasses = getMonthBorderClasses(borderInfo, day.date, currentMonth, currentYear);
                    const hasBorder = borderClasses.length > 0;
                    const isFuture = day.isFuture || false;
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-3 h-3 transition-all cursor-pointer ${
                          isEmpty
                            ? 'bg-transparent'
                            : getColorClass(day.totalReps, isFuture)
                        } ${hasBorder ? borderClasses : 'rounded-sm'} ${
                          hoveredDay?.dateString === day.dateString ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                        }`}
                        onMouseEnter={() => !isEmpty && setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        title={isEmpty ? '' : `${formatDate(day.date)}${isFuture ? ' (Future)' : `: ${day.totalReps} reps`}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Hovered day info at bottom - always reserve space with fixed width */}
          <div className="h-5 w-full text-sm text-zinc-600 dark:text-zinc-400 leading-tight text-center mt-2 flex items-center justify-center">
            {hoveredDay && hoveredDay.dateString && (
              <span>
                {formatDate(hoveredDay.date)}: {hoveredDay.totalReps} reps
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure Workout History</DialogTitle>
            <DialogDescription>
              Customize your workout history display settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Configuration options will be available here in a future update.
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outline"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BortletContainer>
  );
}

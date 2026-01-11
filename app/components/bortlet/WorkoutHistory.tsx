'use client';

import { useMemo, useState } from 'react';
import { Settings } from 'lucide-react';
import type { BortletProps } from '@/lib/bortlets/types';
import { BortletContainer, BortletHeader, BortletLoading, BortletError } from '@/lib/bortlets/components';
import { useRepCounterData } from '@/lib/firebase/repCounter';
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
}

export default function WorkoutHistory({ userId }: BortletProps) {
  const [repCounterData, dataLoading, dataError] = useRepCounterData(userId);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Generate last week and this week of data
  const daysData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: DayData[] = [];
    
    // Get countsByDate from rep counter data
    const countsByDate = repCounterData?.countsByDate || {};

    // Calculate the start of last week (Sunday of last week)
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const daysSinceLastSunday = currentDayOfWeek + 7; // Days to go back to last Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysSinceLastSunday);
    
    // Calculate the end of this week (Saturday of this week)
    const daysUntilSaturday = 6 - currentDayOfWeek;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysUntilSaturday);
    
    // Generate array of days from last Sunday to this Saturday (14 days total)
    const totalDays = 14;
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toDateString();
      
      // Calculate total reps for this day
      const dayCounts = countsByDate[dateString] || {};
      const totalReps = Object.values(dayCounts).reduce((sum, count) => sum + count, 0) as number;
      
      days.push({ date, dateString, totalReps });
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
      });
    }
    
    // Add all days
    daysData.forEach((day) => {
      currentWeek.push(day);
      
      // When we reach Saturday (day 6), finish the week
      if (day.date.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Handle the last incomplete week
    if (currentWeek.length > 0) {
      // Fill in remaining days to complete the week
      const lastDay = daysData[daysData.length - 1].date;
      const lastDayOfWeek = lastDay.getDay();
      const daysNeeded = 6 - lastDayOfWeek;
      
      for (let i = 1; i <= daysNeeded; i++) {
        currentWeek.push({
          date: new Date(lastDay.getTime() + i * 24 * 60 * 60 * 1000),
          dateString: '',
          totalReps: 0,
        });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [daysData]);

  // Get color intensity based on total reps
  const getColorClass = (totalReps: number): string => {
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
              {[0, 1].map((weekIndex) => (
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
          <div className="flex items-center gap-2">
            {hoveredDay && hoveredDay.dateString && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {formatDate(hoveredDay.date)}: {hoveredDay.totalReps} reps
              </div>
            )}
            <button
              onClick={() => setIsDialogOpen(true)}
              className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Configure workout history"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto flex items-center justify-center">
        <div className="flex flex-col gap-1">
          {/* Day labels */}
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

          {/* Weeks grid */}
          <div className="flex flex-col gap-1 flex-1">
            {weeksData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-1">
                {week.map((day, dayIndex) => {
                  const isEmpty = !day.dateString;
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-3 h-3 rounded-sm transition-all cursor-pointer ${
                        isEmpty
                          ? 'bg-transparent'
                          : getColorClass(day.totalReps)
                      } ${hoveredDay?.dateString === day.dateString ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                      onMouseEnter={() => !isEmpty && setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      title={isEmpty ? '' : `${formatDate(day.date)}: ${day.totalReps} reps`}
                    />
                  );
                })}
              </div>
            ))}
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

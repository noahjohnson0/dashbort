'use client';

import { Settings, Briefcase } from 'lucide-react';
import { BortletContainer, BortletContainerSmall, BortletHeader } from './components';
import type { BortId } from './registry';

/**
 * Skeleton loader for DateTime bortlet
 * Shows time (large) and date (smaller) in vertical layout
 */
function DateTimeSkeleton() {
  return (
    <BortletContainerSmall className="overflow-hidden">
      <div className="flex flex-col gap-2 flex-1 min-h-0 justify-center">
        <div className="text-center">
          <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mx-auto mb-2" />
        </div>
        <div className="text-center">
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mx-auto" />
        </div>
      </div>
    </BortletContainerSmall>
  );
}

/**
 * Skeleton loader for RepCounter bortlet
 * Shows header with settings icon and 3 exercise cards in grid
 */
function RepCounterSkeleton() {
  return (
    <BortletContainer>
      <BortletHeader
        title="Rep Counter"
        action={
          <div className="p-2 opacity-0 pointer-events-none">
            <Settings className="h-5 w-5" />
          </div>
        }
      />
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg p-3 border bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
            >
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1.5 mx-auto" />
              <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2 mx-auto" />
              <div className="flex gap-2 justify-center">
                <div className="h-7 w-12 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </BortletContainer>
  );
}

/**
 * Skeleton loader for RecurringDailyActions bortlet
 * Shows header with settings icon, progress bar, and checklist items
 */
function RecurringDailyActionsSkeleton() {
  return (
    <BortletContainer>
      <BortletHeader
        title="Recurring Daily Actions"
        action={
          <div className="p-2 opacity-0 pointer-events-none">
            <Settings className="h-5 w-5" />
          </div>
        }
      />
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full w-1/3 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2 flex-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800"
          >
            <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-5 flex-1 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </BortletContainer>
  );
}

/**
 * Skeleton loader for WorkoutHistory bortlet
 * Shows header with settings icon and calendar grid
 */
function WorkoutHistorySkeleton() {
  return (
    <BortletContainer className="overflow-hidden">
      <BortletHeader
        title="Workout History"
        action={
          <div className="p-2 opacity-0 pointer-events-none">
            <Settings className="h-5 w-5" />
          </div>
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
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayIndex]}
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

/**
 * Skeleton loader for SunriseSunset bortlet
 * Shows two sections with icons and times
 */
function SunriseSunsetSkeleton() {
  return (
    <BortletContainer>
      <BortletHeader
        title="Sunrise & Sunset"
        action={
          <div className="p-2 opacity-0 pointer-events-none">
            <div className="h-5 w-5" />
          </div>
        }
      />
      <div className="flex items-center justify-around gap-4 flex-1">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div>
            <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
            <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div>
            <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
            <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </BortletContainer>
  );
}

/**
 * Skeleton loader for DaysUntilPayday bortlet
 * Shows countdown text and date (no header)
 */
function DaysUntilPaydaySkeleton() {
  return (
    <BortletContainerSmall>
      <div className="flex flex-col gap-2 flex-1 min-h-0 justify-center">
        <div className="text-center">
          <div className="h-9 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mx-auto mb-2" />
        </div>
        <div className="text-center">
          <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mx-auto" />
        </div>
      </div>
    </BortletContainerSmall>
  );
}

/**
 * Skeleton loader for GoogleCalendar bortlet
 * Shows header with settings icon and list of events
 */
function GoogleCalendarSkeleton() {
  return (
    <BortletContainer>
      <BortletHeader
        title="Calendar"
        action={
          <div className="p-2 opacity-0 pointer-events-none">
            <Settings className="h-5 w-5" />
          </div>
        }
      />
      <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="h-3 w-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
            <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1" />
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </BortletContainer>
  );
}

/**
 * Skeleton loader for WorkTimer bortlet
 * Shows header with settings icon, timer display, and progress info
 */
function WorkTimerSkeleton() {
  return (
    <BortletContainer>
      <BortletHeader
        title="Work Day Countdown"
        action={
          <div className="p-2 opacity-0 pointer-events-none">
            <Briefcase className="h-5 w-5" />
          </div>
        }
      />
      <div className="flex items-center gap-6">
        <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mt-2" />
    </BortletContainer>
  );
}

/**
 * Get the appropriate skeleton loader for a bortlet
 */
export function getBortletSkeleton(id: BortId): React.ReactNode {
  const skeletons: Record<BortId, () => React.ReactNode> = {
    dateTime: DateTimeSkeleton,
    repCounter: RepCounterSkeleton,
    recurringDailyActions: RecurringDailyActionsSkeleton,
    workoutHistory: WorkoutHistorySkeleton,
    sunriseSunset: SunriseSunsetSkeleton,
    daysUntilPayday: DaysUntilPaydaySkeleton,
    googleCalendar: GoogleCalendarSkeleton,
    workTimer: WorkTimerSkeleton,
  };

  const SkeletonComponent = skeletons[id];
  if (!SkeletonComponent) {
    // Fallback to generic loading state
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded-lg">
        <div className="text-zinc-500 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return <SkeletonComponent />;
}

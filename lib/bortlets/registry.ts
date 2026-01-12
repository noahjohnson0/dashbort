import type { ComponentType } from 'react';

/**
 * Bortlet metadata configuration
 * Each bortlet entry defines:
 * - id: The unique identifier
 * - importPath: Path to the component file for dynamic loading
 * - is1x1: Whether the bortlet occupies 1x1 grid space (default is 1x2)
 * - is2x1: Whether the bortlet occupies 2x1 grid space (default is 1x2)
 * - is2x2: Whether the bortlet occupies 2x2 grid space (default is 1x2)
 * - displayName: Human-readable name (optional, for future use)
 */
export interface BortletConfig {
  id: string;
  importPath: string;
  is1x1?: boolean;
  is2x1?: boolean;
  is2x2?: boolean;
  displayName?: string;
}

/**
 * Registry of all available bortlets
 * This is the SINGLE SOURCE OF TRUTH for bortlet definitions
 * 
 * To add a new bortlet:
 * 1. Create the component file in app/components/bortlet/
 * 2. Add an entry here with the correct importPath
 * 3. The BortId type will be automatically generated from the registry keys
 */
export const BORTLET_REGISTRY = {
  workTimer: {
    id: 'workTimer',
    importPath: '@/app/components/bortlet/WorkTimer',
    is2x2: true,
  },
  repCounter: {
    id: 'repCounter',
    importPath: '@/app/components/bortlet/RepCounter',
    is2x2: true,
  },
  sunriseSunset: {
    id: 'sunriseSunset',
    importPath: '@/app/components/bortlet/SunriseSunset',
    is2x1: true,
  },
  recurringDailyActions: {
    id: 'recurringDailyActions',
    importPath: '@/app/components/bortlet/RecurringDailyActions',
    is2x2: true,
  },
  daysUntilPayday: {
    id: 'daysUntilPayday',
    importPath: '@/app/components/bortlet/DaysUntilPayday',
    is2x1: true,
  },
  dateTime: {
    id: 'dateTime',
    importPath: '@/app/components/bortlet/DateTime',
    is2x1: true,
  },
  googleCalendar: {
    id: 'googleCalendar',
    importPath: '@/app/components/bortlet/GoogleCalendar',
    is2x2: true,
  },
  workoutHistory: {
    id: 'workoutHistory',
    importPath: '@/app/components/bortlet/WorkoutHistory',
    is2x2: true,
  },
} as const satisfies Record<string, BortletConfig>;

/**
 * Generate BortId type from registry keys
 * This ensures the type is always in sync with the registry
 */
export type BortId = keyof typeof BORTLET_REGISTRY;

/**
 * Get the default order of bortlets
 * This is used when no user preference is saved
 */
export const DEFAULT_BORT_ORDER: BortId[] = [
  'workTimer',
  'repCounter',
  'sunriseSunset',
  'recurringDailyActions',
  'daysUntilPayday',
  'dateTime',
  'googleCalendar',
  'workoutHistory',
];

/**
 * Get bortlet config by ID
 */
export function getBortletConfig(id: BortId): BortletConfig {
  return BORTLET_REGISTRY[id];
}

/**
 * Check if a bortlet ID is valid (exists in registry)
 */
export function isValidBortId(id: string): id is BortId {
  return id in BORTLET_REGISTRY;
}

/**
 * Get all registered bortlet IDs
 */
export function getAllBortletIds(): BortId[] {
  return Object.keys(BORTLET_REGISTRY) as BortId[];
}

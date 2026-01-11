'use client';

import { lazy, Suspense, ComponentType } from 'react';
import { BORTLET_REGISTRY, type BortId } from './registry';

/**
 * Explicit dynamic imports for each bortlet
 * Next.js requires explicit imports at build time for proper code splitting
 * 
 * NOTE: These imports MUST match the registry entries in registry.ts
 * The registry is the source of truth for bortlet IDs and metadata,
 * but we must maintain explicit imports here for Next.js code splitting.
 */
const BORTLET_IMPORTS: Record<BortId, () => Promise<{ default: ComponentType<any> }>> = {
  workTimer: () => import('@/app/components/bortlet/WorkTimer'),
  repCounter: () => import('@/app/components/bortlet/RepCounter'),
  sunriseSunset: () => import('@/app/components/bortlet/SunriseSunset'),
  recurringDailyActions: () => import('@/app/components/bortlet/RecurringDailyActions'),
  daysUntilPayday: () => import('@/app/components/bortlet/DaysUntilPayday'),
  dateTime: () => import('@/app/components/bortlet/DateTime'),
  googleCalendar: () => import('@/app/components/bortlet/GoogleCalendar'),
  workoutHistory: () => import('@/app/components/bortlet/WorkoutHistory'),
};

/**
 * Validate that all registry entries have corresponding imports
 * This ensures the loader stays in sync with the registry
 */
function validateImports() {
  const registryIds = Object.keys(BORTLET_REGISTRY) as BortId[];
  const importIds = Object.keys(BORTLET_IMPORTS) as BortId[];
  
  const missingImports = registryIds.filter(id => !importIds.includes(id));
  const extraImports = importIds.filter(id => !registryIds.includes(id));
  
  if (missingImports.length > 0 || extraImports.length > 0) {
    console.warn('Bortlet imports out of sync with registry:', {
      missingImports,
      extraImports,
    });
  }
}

// Validate on module load (development only)
if (process.env.NODE_ENV === 'development') {
  validateImports();
}

/**
 * Cache for dynamically loaded components
 * Prevents re-importing the same component multiple times
 */
const componentCache = new Map<BortId, ComponentType<any>>();

/**
 * Lazy load a bortlet component by ID
 * Uses React.lazy() for code splitting and Suspense for loading states
 */
function loadBortletComponent(id: BortId): ComponentType<any> {
  // Check cache first
  if (componentCache.has(id)) {
    return componentCache.get(id)!;
  }

  const importFn = BORTLET_IMPORTS[id];
  if (!importFn) {
    throw new Error(`No import function found for bortlet id: ${id}`);
  }

  // Create lazy-loaded component
  const LazyComponent = lazy(() => importFn());

  // Cache the component
  componentCache.set(id, LazyComponent);

  return LazyComponent;
}

import type { User } from 'firebase/auth';
import type { BortletProps } from './types';
import { getBortletSkeleton } from './skeletons';

interface DynamicBortletProps {
  id: BortId;
  userId: string;
  user?: User; // Optional user object for integrations that need getIdToken()
  fallback?: React.ReactNode;
}

/**
 * Component wrapper for dynamically loaded bortlets
 * Handles lazy loading and Suspense boundaries
 * Passes userId (and optionally user) to bortlet components via props
 */
export function DynamicBortlet({ id, userId, user, fallback }: DynamicBortletProps) {
  const BortletComponent = loadBortletComponent(id);

  // Use bortlet-specific skeleton loader that matches the actual component structure
  const defaultFallback = getBortletSkeleton(id);

  const props: BortletProps = { userId, user };

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <BortletComponent {...props} />
    </Suspense>
  );
}

/**
 * Preload a bortlet component (useful for prefetching)
 */
export async function preloadBortlet(id: BortId): Promise<void> {
  if (componentCache.has(id)) {
    return;
  }

  const importFn = BORTLET_IMPORTS[id];
  if (!importFn) {
    throw new Error(`No import function found for bortlet id: ${id}`);
  }

  try {
    await importFn();
  } catch (error) {
    console.error(`Failed to preload bortlet ${id}:`, error);
  }
}

/**
 * Preload multiple bortlets
 */
export async function preloadBortlets(ids: BortId[]): Promise<void> {
  await Promise.all(ids.map(id => preloadBortlet(id)));
}

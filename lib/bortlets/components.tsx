'use client';

import { ReactNode } from 'react';
import type { BortletProps } from './types';

/**
 * Shared container component for bortlets
 * Provides consistent styling, layout, and structure
 */
export function BortletContainer({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 w-full h-full flex flex-col ${className}`}>
      {children}
    </div>
  );
}

/**
 * Shared container for bortlets with padding-4 (smaller padding)
 */
export function BortletContainerSmall({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 border border-zinc-200 dark:border-zinc-800 w-full h-full flex flex-col ${className}`}>
      {children}
    </div>
  );
}

/**
 * Standard bortlet header component
 */
export function BortletHeader({ 
  title, 
  action 
}: { 
  title: string; 
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4 flex-shrink-0">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 select-none">
        {title}
      </h2>
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * Standard loading state for bortlets
 */
export function BortletLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-0">
      <div className="text-zinc-600 dark:text-zinc-400">{message}</div>
    </div>
  );
}

/**
 * Standard error state for bortlets
 */
export function BortletError({ 
  error, 
  message 
}: { 
  error?: Error | string | null; 
  message?: string;
}) {
  const errorMessage = message || (error instanceof Error ? error.message : error) || 'An error occurred';
  
  return (
    <div className="flex-1 flex items-center justify-center min-h-0">
      <div className="text-red-600 dark:text-red-400 text-center px-4">
        {errorMessage}
      </div>
    </div>
  );
}

import type { User } from 'firebase/auth';

/**
 * Common interface for all bortlets
 * All bortlet components should accept these props
 * 
 * For bortlets with external integrations (like Google Calendar) that need
 * the full user object for getIdToken(), the user object will be provided.
 * Most bortlets only need userId.
 */
export interface BortletProps {
  userId: string;
  user?: User; // Optional user object for integrations that need getIdToken()
  config?: Record<string, any>;
}

/**
 * Base props that all bortlets receive
 * This ensures consistency across all bortlet implementations
 */
export type BortletComponent = React.ComponentType<BortletProps>;

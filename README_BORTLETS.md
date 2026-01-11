# Bortlets Documentation

## Overview

Bortlets are the modular, pluggable widgets that make up your Dashbort dashboard. Each bortlet is a self-contained React component that can be dynamically loaded, configured, and arranged by the user.

## Architecture

### Registry System

All bortlets are registered in `lib/bortlets/registry.ts`, which serves as the **single source of truth** for bortlet metadata:

```typescript
export const BORTLET_REGISTRY = {
  workTimer: {
    id: 'workTimer',
    importPath: '@/app/components/bortlet/WorkTimer',
    is1x1: false, // Takes 1x2 grid space (default)
  },
  // ... more bortlets
} as const satisfies Record<string, BortletConfig>;

export type BortId = keyof typeof BORTLET_REGISTRY;
```

**Key Benefits:**
- Type-safe: `BortId` type is automatically generated from registry keys
- Single source of truth: No need to manually sync types across multiple files
- Easy to extend: Add new bortlets by adding a registry entry

### Common Interface

All bortlets implement the `BortletProps` interface:

```typescript
export interface BortletProps {
  userId: string;        // User ID (always provided)
  user?: User;           // Optional user object (for integrations needing getIdToken())
  config?: Record<string, any>; // Optional configuration
}
```

### Shared Components

Common UI patterns are provided via shared components in `lib/bortlets/components.tsx`:

- **`BortletContainer`**: Standard container with consistent styling (p-6 padding)
- **`BortletContainerSmall`**: Smaller container (p-4 padding) for compact bortlets
- **`BortletHeader`**: Standard header with title and optional action button
- **`BortletLoading`**: Standard loading state
- **`BortletError`**: Standard error state

### Dynamic Loading

Bortlets are lazy-loaded using React.lazy() for code splitting:

```typescript
// In lib/bortlets/loader.tsx
export function DynamicBortlet({ id, userId, user, fallback }: DynamicBortletProps) {
  const BortletComponent = loadBortletComponent(id);
  return (
    <Suspense fallback={fallback || defaultFallback}>
      <BortletComponent userId={userId} user={user} />
    </Suspense>
  );
}
```

## Available Bortlets

### 1. Work Timer
- **ID**: `workTimer`
- **Size**: 1x2 (default)
- **Description**: Countdown timer showing hours until work ends
- **Features**:
  - Customizable work start/end times
  - Weekend mode toggle
  - Real-time countdown display
  - Percentage worked/remaining
- **Storage**: Firebase (user settings)

### 2. Rep Counter
- **ID**: `repCounter`
- **Size**: 1x2
- **Description**: Track daily exercise repetitions
- **Features**:
  - Multiple exercise types (customizable)
  - Increment/decrement controls
  - Daily reset
  - Historical tracking by date
- **Storage**: Firebase (rep counter data)

### 3. Sunrise/Sunset
- **ID**: `sunriseSunset`
- **Size**: 1x2
- **Description**: Display sunrise and sunset times for your location
- **Features**:
  - Location by zipcode
  - Automatic sun times fetching
  - Day/night indicator
- **Storage**: Firebase (user location settings)

### 4. Recurring Daily Actions
- **ID**: `recurringDailyActions`
- **Size**: 1x2
- **Description**: Track completion of recurring daily tasks
- **Features**:
  - Custom action list
  - Checkbox completion tracking
  - Daily reset
  - Progress indicator
- **Storage**: Firebase (recurring actions data)

### 5. Days Until Payday
- **ID**: `daysUntilPayday`
- **Size**: 1x1 (compact)
- **Description**: Countdown to next payday
- **Features**:
  - Two paydays per month (configurable)
  - Automatic weekend adjustment (moves to Friday)
  - Next payday date display
- **Storage**: Firebase (payday settings)

### 6. Date/Time
- **ID**: `dateTime`
- **Size**: 1x1 (compact)
- **Description**: Current date and time display
- **Features**:
  - Real-time clock (updates every second)
  - Formatted date and time
  - No configuration needed
- **Storage**: None (client-side only)

### 7. Google Calendar
- **ID**: `googleCalendar`
- **Size**: 1x2
- **Description**: Display upcoming Google Calendar events
- **Features**:
  - OAuth integration with Google Calendar
  - Upcoming events list
  - Event details (time, location)
  - External link to calendar
- **Storage**: Firebase (OAuth tokens, settings)
- **Special**: Requires user object for `getIdToken()` API calls

### 8. Workout History
- **ID**: `workoutHistory`
- **Size**: 1x2
- **Description**: Visual heatmap of workout history from Rep Counter
- **Features**:
  - Two-week heatmap view
  - Color-coded intensity (based on total reps)
  - Hover tooltips
  - Legend for intensity levels
- **Storage**: Uses Rep Counter data (read-only)
- **Dependencies**: Requires Rep Counter data

## Adding a New Bortlet

### Step 1: Create the Component

Create your bortlet component in `app/components/bortlet/YourBortlet.tsx`:

```typescript
'use client';

import type { BortletProps } from '@/lib/bortlets/types';
import { BortletContainer, BortletHeader } from '@/lib/bortlets/components';

export default function YourBortlet({ userId }: BortletProps) {
  // Your bortlet implementation
  return (
    <BortletContainer>
      <BortletHeader title="Your Bortlet" />
      {/* Your content */}
    </BortletContainer>
  );
}
```

### Step 2: Register in Registry

Add your bortlet to `lib/bortlets/registry.ts`:

```typescript
export const BORTLET_REGISTRY = {
  // ... existing bortlets
  yourBortlet: {
    id: 'yourBortlet',
    importPath: '@/app/components/bortlet/YourBortlet',
    is1x1: false, // or true for compact bortlets
    displayName: 'Your Bortlet Name', // Optional
  },
} as const satisfies Record<string, BortletConfig>;
```

### Step 3: Add Import to Loader

Add the import to `lib/bortlets/loader.tsx`:

```typescript
const BORTLET_IMPORTS: Record<BortId, () => Promise<{ default: ComponentType<any> }>> = {
  // ... existing imports
  yourBortlet: () => import('@/app/components/bortlet/YourBortlet'),
};
```

**Note**: The loader validates that all registry entries have corresponding imports in development mode.

### Step 4: Update Default Order (Optional)

Add your bortlet to `DEFAULT_BORT_ORDER` in `lib/bortlets/registry.ts` if you want it displayed by default:

```typescript
export const DEFAULT_BORT_ORDER: BortId[] = [
  // ... existing order
  'yourBortlet',
];
```

### Step 5: Update Types (Automatic!)

The `BortId` type is automatically generated from the registry keys, so no manual type updates are needed! The type system ensures everything stays in sync.

## Best Practices

### 1. Use Shared Components

Always use `BortletContainer` or `BortletContainerSmall` for consistent styling:

```typescript
import { BortletContainer, BortletHeader } from '@/lib/bortlets/components';

return (
  <BortletContainer>
    <BortletHeader title="My Bortlet" action={<SettingsButton />} />
    {/* Content */}
  </BortletContainer>
);
```

### 2. Handle Loading and Errors

Use shared loading/error components:

```typescript
import { BortletLoading, BortletError } from '@/lib/bortlets/components';

if (loading) return <BortletLoading />;
if (error) return <BortletError error={error} />;
```

### 3. Use userId Prop

Always use the `userId` prop instead of calling `useAuthState` directly:

```typescript
// ✅ Good
export default function MyBortlet({ userId }: BortletProps) {
  const [data] = useMyData(userId);
}

// ❌ Bad
export default function MyBortlet() {
  const [user] = useAuthState(auth);
  const [data] = useMyData(user?.uid || null);
}
```

### 4. External Integrations

For bortlets that need the full user object (e.g., for `getIdToken()`), the `user` prop is available:

```typescript
export default function GoogleCalendar({ userId, user }: BortletProps) {
  const idToken = await user?.getIdToken();
  // Use idToken for API calls
}
```

### 5. Configuration

Use the `config` prop for bortlet-specific configuration (if needed):

```typescript
export default function MyBortlet({ userId, config }: BortletProps) {
  const mySetting = config?.mySetting ?? defaultValue;
}
```

### 6. Data Storage

- Use Firebase hooks from `react-firebase-hooks` for data operations
- Store user-specific data in Firestore under `users/{userId}/`
- Follow the pattern: `use[Resource]Data` for reading, `useSave[Resource]Data` for writing

## Grid Layout

Bortlets are displayed in a 3-column, 4-row grid (12 total spaces):

- **1x2 bortlets**: Take 2 spaces (1 column × 2 rows) - default
- **1x1 bortlets**: Take 1 space (1 column × 1 row) - compact

The `is1x1` property in the registry determines the size.

## Type Safety

The bortlet system is fully type-safe:

- `BortId` is automatically generated from registry keys
- TypeScript ensures all registry entries have valid import paths
- Loader validates imports match registry in development
- `BortletProps` ensures consistent interface across bortlets

## Migration Notes

If you're migrating existing bortlets to the new system:

1. Replace `useAuthState(auth)` with `userId` prop
2. Use `BortletContainer` instead of manual container divs
3. Use `BortletHeader` for headers
4. Update imports to use new types from `@/lib/bortlets/types`
5. Register in registry (single source of truth)

## Future Enhancements

Potential improvements to the bortlet system:

- Settings schema system for standardized configuration
- Plugin/extension system for third-party bortlets
- Bortlet marketplace or sharing
- Runtime bortlet registration (without code changes)
- Code generation for loader imports (eliminate manual step)

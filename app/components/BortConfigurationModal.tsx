'use client';

import { useState, useEffect, useMemo } from 'react';
import type { User } from 'firebase/auth';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEnabledBortlets, useSaveEnabledBortlets, type BortId } from '@/lib/firebase/userSettings';
import { getBortletConfig } from '@/lib/bortlets/registry';
import { Check, Briefcase, Settings as SettingsIcon, MapPin, Calendar, Activity, Sunrise, Sunset, Clock } from 'lucide-react';

interface BortConfigurationModalProps {
    user: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const BORT_DISPLAY_NAMES: Record<BortId, string> = {
    workTimer: 'Work Timer',
    repCounter: 'Rep Counter',
    sunriseSunset: 'Sunrise/Sunset',
    recurringDailyActions: 'Recurring Daily Actions',
    daysUntilPayday: 'Days Until Payday',
    dateTime: 'Date & Time',
    googleCalendar: 'Google Calendar',
    workoutHistory: 'Workout History',
};

const ALL_BORTLETS: BortId[] = [
    'workTimer',
    'repCounter',
    'sunriseSunset',
    'recurringDailyActions',
    'daysUntilPayday',
    'dateTime',
    'googleCalendar',
    'workoutHistory',
];

const TOTAL_SPACES = 24; // 6 columns × 4 rows

// Get the space required by a bortlet
const getBortletSpace = (bortId: BortId): number => {
    const config = getBortletConfig(bortId);
    if (config?.is1x1) return 1;
    if (config?.is2x1) return 2;
    if (config?.is2x2) return 4;
    return 2; // default 1x2
};

// Calculate total space used by a set of bortlets
const calculateSpaceUsed = (bortlets: Set<BortId>): number => {
    return Array.from(bortlets).reduce((sum, bortId) => sum + getBortletSpace(bortId), 0);
};

// Preview components for each bortlet
const BortletPreview = ({ bortId }: { bortId: BortId }) => {
    const config = getBortletConfig(bortId);
    const is1x1 = config?.is1x1 ?? false;
    
    switch (bortId) {
        case 'dateTime':
            return (
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 border border-zinc-200 dark:border-zinc-800 w-full h-full flex flex-col overflow-hidden">
                    <div className="flex flex-col gap-2 flex-1 min-h-0 justify-center">
                        <div className="text-center">
                            <div className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                2:45:30 PM
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                Monday, December 16, 2024
                            </div>
                        </div>
                    </div>
                </div>
            );
        
        case 'daysUntilPayday':
            return (
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 border border-zinc-200 dark:border-zinc-800 select-none w-full h-full flex flex-col overflow-hidden">
                    <div className="flex flex-col gap-2 flex-1 min-h-0 justify-center">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                                5 Days until payday
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                December 21, 2024
                            </div>
                        </div>
                    </div>
                </div>
            );
        
        case 'repCounter':
            return (
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 w-full h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 select-none">
                            Rep Counter
                        </h2>
                        <div className="p-2 text-zinc-600 dark:text-zinc-400">
                            <SettingsIcon className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['pushup', 'squat', 'pullup'].map((exercise, idx) => (
                            <div
                                key={exercise}
                                className="rounded-lg p-3 border bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                            >
                                <div className="text-xs font-semibold mb-1.5 text-center uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                                    {exercise}
                                </div>
                                <div className="text-2xl font-bold mb-2 text-center text-zinc-900 dark:text-zinc-100">
                                    {15 + idx * 5}
                                </div>
                                <div className="flex gap-2 justify-center">
                                    <button className="px-3 py-1.5 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-md font-semibold transition-colors select-none text-xs">
                                        −
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        
        case 'workTimer':
            return (
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 w-full h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            Work Day Countdown
                        </h2>
                        <div className="p-2 text-zinc-600 dark:text-zinc-400">
                            <Briefcase className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-4xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            4:23:15
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">Worked:</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                43.2%
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">Remaining:</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                56.8%
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                        Counting down to 5:00 PM
                    </p>
                </div>
            );
        
        case 'sunriseSunset':
            return (
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 select-none w-full h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            Sunrise & Sunset
                        </h2>
                        <div className="p-2 text-zinc-600 dark:text-zinc-400">
                            <MapPin className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Sunrise className="h-8 w-8 text-orange-500" />
                            <div>
                                <div className="text-sm text-zinc-600 dark:text-zinc-400">Sunrise</div>
                                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                    6:42 AM
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Sunset className="h-8 w-8 text-orange-600" />
                            <div>
                                <div className="text-sm text-zinc-600 dark:text-zinc-400">Sunset</div>
                                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                    5:18 PM
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        
        case 'recurringDailyActions':
            return (
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 select-none w-full h-full flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            Recurring Daily Actions
                        </h2>
                        <div className="p-2 opacity-0 pointer-events-none">
                            <SettingsIcon className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                Progress: 2 / 5
                            </span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '40%' }} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        {['Exercise', 'Read for 30min', 'Meditate', 'Drink 8 glasses', 'Call family'].map((action, idx) => (
                            <div
                                key={action}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={idx < 2}
                                    readOnly
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                />
                                <span
                                    className={`flex-1 ${
                                        idx < 2
                                            ? 'line-through text-zinc-400 dark:text-zinc-500'
                                            : 'text-zinc-900 dark:text-zinc-100'
                                    }`}
                                >
                                    {action}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        
        case 'googleCalendar':
            return (
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 w-full h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 select-none">
                            Calendar
                        </h2>
                        <div className="p-2 text-zinc-600 dark:text-zinc-400">
                            <SettingsIcon className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
                        {[
                            { title: 'Team Meeting', time: 'Today, 10:00 AM - 11:00 AM', fullTime: '10:00 AM - 11:00 AM' },
                            { title: 'Lunch Break', time: 'Today, 12:00 PM - 1:00 PM', fullTime: '12:00 PM - 1:00 PM' },
                            { title: 'Project Review', time: 'Today, 2:00 PM - 3:30 PM', fullTime: '2:00 PM - 3:30 PM' },
                        ].map((event) => (
                            <div
                                key={event.title}
                                className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="h-3 w-3 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                                            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                                                {event.time.split(',')[0]}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 truncate">
                                            {event.title}
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                            {event.fullTime}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        
        case 'workoutHistory':
            const workoutWeeks = [
                [{ reps: 0 }, { reps: 12 }, { reps: 0 }, { reps: 25 }, { reps: 8 }, { reps: 0 }, { reps: 18 }],
                [{ reps: 15 }, { reps: 30 }, { reps: 22 }, { reps: 0 }, { reps: 20 }, { reps: 35 }, { reps: 0 }],
            ];
            const getWorkoutColorClass = (reps: number): string => {
                if (reps === 0) return 'bg-zinc-100 dark:bg-zinc-800';
                if (reps <= 10) return 'bg-green-200 dark:bg-green-900';
                if (reps <= 25) return 'bg-green-400 dark:bg-green-700';
                if (reps <= 50) return 'bg-green-600 dark:bg-green-500';
                return 'bg-green-700 dark:bg-green-400';
            };
            return (
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 w-full h-full flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 select-none">
                            Workout History
                        </h2>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 opacity-0 pointer-events-none">
                            Placeholder
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto min-h-0">
                        <div className="flex flex-col gap-1">
                            {/* Day labels */}
                            <div className="flex gap-1 pl-6">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, idx) => (
                                    <div
                                        key={idx}
                                        className="w-3 h-4 text-xs text-zinc-500 dark:text-zinc-500 text-center flex items-center justify-center"
                                    >
                                        {label}
                                    </div>
                                ))}
                            </div>
                            {/* Weeks grid */}
                            {workoutWeeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex gap-1 pl-6">
                                    {week.map((day, dayIndex) => (
                                        <div
                                            key={`${weekIndex}-${dayIndex}`}
                                            className={`w-3 h-3 rounded-sm ${getWorkoutColorClass(day.reps)}`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        
        default:
            return null;
    }
};

export function BortConfigurationModal({ user, open, onOpenChange }: BortConfigurationModalProps) {
    const [enabledBortlets, loading] = useEnabledBortlets(user.uid);
    const [saveEnabledBortlets, saving] = useSaveEnabledBortlets(user.uid);
    const [localEnabled, setLocalEnabled] = useState<Set<BortId>>(new Set(ALL_BORTLETS));

    // Initialize local state from Firebase or use default (all enabled)
    useEffect(() => {
        if (!loading) {
            if (enabledBortlets && enabledBortlets.length > 0) {
                setLocalEnabled(new Set(enabledBortlets));
            } else {
                // Default: all bortlets enabled
                setLocalEnabled(new Set(ALL_BORTLETS));
            }
        }
    }, [enabledBortlets, loading]);

    // Calculate current space usage
    const currentSpaceUsed = useMemo(() => calculateSpaceUsed(localEnabled), [localEnabled]);
    const availableSpaces = TOTAL_SPACES - currentSpaceUsed;

    const handleToggle = async (bortId: BortId) => {
        const newSet = new Set(localEnabled);
        
        if (newSet.has(bortId)) {
            // Don't allow disabling all bortlets - require at least one
            if (newSet.size > 1) {
                newSet.delete(bortId);
            } else {
                return; // Can't remove the last one
            }
        } else {
            // Check if enabling this bortlet would exceed available space
            const spaceNeeded = getBortletSpace(bortId);
            const currentUsed = calculateSpaceUsed(localEnabled);
            if (currentUsed + spaceNeeded <= TOTAL_SPACES) {
                newSet.add(bortId);
            } else {
                return; // Can't add, not enough space
            }
        }

        // Optimistically update UI
        setLocalEnabled(newSet);

        // Save immediately
        try {
            await saveEnabledBortlets(Array.from(newSet));
        } catch (error) {
            console.error('Failed to save bortlet configuration:', error);
            // Revert on error
            setLocalEnabled(localEnabled);
        }
    };

    // Check if a bortlet can be enabled (not disabled due to space constraints)
    const canEnableBortlet = (bortId: BortId): boolean => {
        if (localEnabled.has(bortId)) {
            return true; // Already enabled
        }
        const spaceNeeded = getBortletSpace(bortId);
        return currentSpaceUsed + spaceNeeded <= TOTAL_SPACES;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Bort Configuration</DialogTitle>
                    <DialogDescription>
                        Browse available bortlets and add them to your dashboard.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto py-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {ALL_BORTLETS.map((bortId) => {
                            const isEnabled = localEnabled.has(bortId);
                            const isOnlyOne = localEnabled.size === 1 && isEnabled;
                            const canEnable = canEnableBortlet(bortId);
                            const isDisabled = isOnlyOne || (!isEnabled && !canEnable);
                            const spaceRequired = getBortletSpace(bortId);
                            const config = getBortletConfig(bortId);
                            const is1x1 = config?.is1x1 ?? false;
                            const is2x1 = config?.is2x1 ?? false;
                            const is2x2 = config?.is2x2 ?? false;
                            
                            return (
                                <div
                                    key={bortId}
                                    className={`relative border rounded-lg overflow-hidden transition-all border-zinc-200 dark:border-zinc-800 ${
                                        isDisabled ? 'opacity-60' : ''
                                    }`}
                                >
                                    {/* Preview Container */}
                                    <div className="relative bg-zinc-50 dark:bg-zinc-950 overflow-hidden" style={{ height: is1x1 || is2x1 ? '150px' : is2x2 ? '200px' : '200px' }}>
                                        <div className="scale-[0.3] origin-top-left pointer-events-none" style={{ width: is2x1 || is2x2 ? '666.67%' : '333.33%', height: is1x1 || is2x1 ? '333.33%' : is2x2 ? '666.67%' : '500%' }}>
                                            <div style={{ width: '100%', height: is1x1 || is2x1 ? '150px' : is2x2 ? '400px' : '200px' }}>
                                                <BortletPreview bortId={bortId} />
                                            </div>
                                        </div>
                                        {/* Overlay gradient to fade bottom */}
                                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent pointer-events-none" />
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                                {BORT_DISPLAY_NAMES[bortId]}
                                            </h3>
                                            {isEnabled && (
                                                <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                                            {spaceRequired} space{spaceRequired !== 1 ? 's' : ''}
                                        </p>
                                        <Button
                                            onClick={() => handleToggle(bortId)}
                                            disabled={isDisabled || saving}
                                            variant={isEnabled ? 'outline' : 'default'}
                                            size="sm"
                                            className="w-full"
                                        >
                                            {isEnabled ? (
                                                <>
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Added
                                                </>
                                            ) : (
                                                'Add to bort'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="px-1 py-3 text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{currentSpaceUsed}</span> of{' '}
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{TOTAL_SPACES}</span> spaces used
                        </span>
                        <span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{availableSpaces}</span> available
                        </span>
                    </div>
                    {availableSpaces === 0 && (
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            No space available. Remove a bortlet to add another.
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

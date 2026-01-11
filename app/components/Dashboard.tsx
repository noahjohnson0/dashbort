'use client';

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import Header from './Header';
import WorkTimer from './bortlet/WorkTimer';
import RepCounter from './bortlet/RepCounter';
import SunriseSunset from './bortlet/SunriseSunset';
import RecurringDailyActions from './bortlet/RecurringDailyActions';
import DaysUntilPayday from './bortlet/DaysUntilPayday';
import DateTime from './bortlet/DateTime';
import GoogleCalendar from './bortlet/GoogleCalendar';
import { useBortOrder, useSaveBortOrder, type BortId } from '@/lib/firebase/userSettings';
import { SortableBort } from './SortableBort';

interface DashboardProps {
    user: User;
}

const DEFAULT_BORT_ORDER: BortId[] = [
    'workTimer',
    'repCounter',
    'sunriseSunset',
    'recurringDailyActions',
    'daysUntilPayday',
    'dateTime',
    'googleCalendar',
];

const BORT_COMPONENTS: Record<BortId, () => React.ReactElement> = {
    workTimer: WorkTimer,
    repCounter: RepCounter,
    sunriseSunset: SunriseSunset,
    recurringDailyActions: RecurringDailyActions,
    daysUntilPayday: DaysUntilPayday,
    dateTime: DateTime,
    googleCalendar: GoogleCalendar,
};

export default function Dashboard({ user }: DashboardProps) {
    const [bortOrder, loadingOrder] = useBortOrder(user.uid);
    const [saveBortOrder, savingOrder] = useSaveBortOrder(user.uid);
    const [localOrder, setLocalOrder] = useState<BortId[]>(DEFAULT_BORT_ORDER);

    // Initialize local order from Firebase or use default
    useEffect(() => {
        if (!loadingOrder && bortOrder) {
            // Merge saved order with default order to include any new bortlets
            const savedOrderSet = new Set(bortOrder);
            const newBortlets = DEFAULT_BORT_ORDER.filter(id => !savedOrderSet.has(id));
            // Filter out any invalid bortIds that don't exist in BORT_COMPONENTS
            const validSavedOrder = bortOrder.filter(id => id in BORT_COMPONENTS);
            setLocalOrder([...validSavedOrder, ...newBortlets]);
        } else if (!loadingOrder && !bortOrder) {
            // First time - use default order
            setLocalOrder(DEFAULT_BORT_ORDER);
        }
    }, [bortOrder, loadingOrder]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px of movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLocalOrder((prevOrder) => {
                const oldIndex = prevOrder.indexOf(active.id as BortId);
                const newIndex = prevOrder.indexOf(over.id as BortId);
                const newOrder = arrayMove(prevOrder, oldIndex, newIndex);

                // Save to Firebase (fire and forget - don't block UI)
                saveBortOrder(newOrder).catch((error) => {
                    console.error('Failed to save bort order:', error);
                    // Revert on error
                    setLocalOrder(prevOrder);
                });

                return newOrder;
            });
        }
    };

    // Don't render until we've loaded the order (to avoid flash)
    if (loadingOrder) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    <Header user={user} />
                    <div className="grid grid-cols-3 grid-rows-4 gap-6 h-[calc(100vh-12rem)]">
                        {DEFAULT_BORT_ORDER
                            .filter((bortId) => bortId in BORT_COMPONENTS)
                            .map((bortId) => {
                                const BortComponent = BORT_COMPONENTS[bortId];
                                return <BortComponent key={bortId} />;
                            })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <Header user={user} />
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={localOrder} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-3 grid-rows-4 gap-6 h-[calc(100vh-12rem)]">
                            {localOrder
                                .filter((bortId) => bortId in BORT_COMPONENTS)
                                .map((bortId) => {
                                    const BortComponent = BORT_COMPONENTS[bortId];
                                    const is1x1 = bortId === 'dateTime' || bortId === 'daysUntilPayday';
                                    return (
                                        <SortableBort 
                                            key={bortId} 
                                            id={bortId}
                                            colSpan={1}
                                            rowSpan={is1x1 ? 1 : 2}
                                        >
                                            <BortComponent />
                                        </SortableBort>
                                    );
                                })}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}


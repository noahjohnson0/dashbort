'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { User } from 'firebase/auth';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
} from '@dnd-kit/core';
import Header from './Header';
import { 
    useBortPositions, 
    useSaveBortPositions, 
    useEnabledBortlets, 
    type BortId,
    type BortPositions,
    type BortPosition,
} from '@/lib/firebase/userSettings';
import { SortableBort } from './SortableBort';
import { DynamicBortlet } from '@/lib/bortlets/loader';
import { DEFAULT_BORT_ORDER, isValidBortId } from '@/lib/bortlets/registry';
import { EmptyGridOverlay } from './EmptyGridOverlay';
import { 
    getDefaultPositions, 
    migrateOrderToPositions, 
    getBortletSize,
    isValidPosition,
    positionsOverlap,
    findAvailablePosition,
} from '@/lib/bortlets/positions';
import { useBortOrder } from '@/lib/firebase/userSettings';

interface DashboardProps {
    user: User;
}

export default function Dashboard({ user }: DashboardProps) {
    // Try to use new positions system, fallback to legacy order for migration
    const [bortPositions, loadingPositions] = useBortPositions(user.uid);
    const [legacyBortOrder, loadingLegacyOrder] = useBortOrder(user.uid);
    const [enabledBortlets, loadingEnabled] = useEnabledBortlets(user.uid);
    const [saveBortPositions, savingPositions] = useSaveBortPositions(user.uid);
    const [localPositions, setLocalPositions] = useState<BortPositions>(getDefaultPositions());
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [dragOverPosition, setDragOverPosition] = useState<BortPosition | null>(null);

    // Determine enabled set: use saved enabled bortlets, or default to all enabled
    const enabledSet = useMemo(() => {
        if (enabledBortlets && enabledBortlets.length > 0) {
            return new Set(enabledBortlets);
        }
        return new Set(DEFAULT_BORT_ORDER);
    }, [enabledBortlets]);

    // Compute positions: migrate from legacy order if needed, or use saved positions
    const displayPositions = useMemo(() => {
        // If still loading, use default positions filtered to enabled bortlets
        if (loadingPositions || loadingEnabled) {
            const defaultPos = getDefaultPositions();
            const filtered: BortPositions = {} as BortPositions;
            for (const [bortId, position] of Object.entries(defaultPos)) {
                if (enabledSet.has(bortId as BortId)) {
                    filtered[bortId as BortId] = position;
                }
            }
            return filtered;
        }

        // If we have saved positions, use them
        if (bortPositions) {
            // Filter to only enabled bortlets and add any new ones
            const filtered: BortPositions = {} as BortPositions;
            const existingBortlets = new Set(Object.keys(bortPositions) as BortId[]);
            
            for (const [bortId, position] of Object.entries(bortPositions)) {
                if (isValidBortId(bortId) && enabledSet.has(bortId)) {
                    filtered[bortId] = position;
                }
            }
            
            // Add any new bortlets that don't have positions
            for (const bortId of DEFAULT_BORT_ORDER) {
                if (enabledSet.has(bortId) && !existingBortlets.has(bortId)) {
                    // Find available position for new bortlet
                    const availablePos = findAvailablePosition(bortId, filtered);
                    if (availablePos) {
                        filtered[bortId] = availablePos;
                    }
                }
            }
            
            return filtered;
        }

        // Migrate from legacy order if available
        if (legacyBortOrder && !loadingLegacyOrder) {
            const migrated = migrateOrderToPositions(legacyBortOrder);
            if (migrated) {
                return migrated;
            }
        }

        // Default: use default positions filtered to enabled bortlets
        const defaultPos = getDefaultPositions();
        const filtered: BortPositions = {} as BortPositions;
        for (const [bortId, position] of Object.entries(defaultPos)) {
            if (enabledSet.has(bortId as BortId)) {
                filtered[bortId as BortId] = position;
            }
        }
        return filtered;
    }, [bortPositions, legacyBortOrder, loadingPositions, loadingLegacyOrder, loadingEnabled, enabledSet]);

    // Track last saved positions to prevent infinite loops
    const lastSavedPositionsRef = useRef<BortPositions | null>(null);

    // Initialize local positions from displayPositions
    useEffect(() => {
        if (!loadingPositions && !loadingEnabled && !loadingLegacyOrder) {
            setLocalPositions(displayPositions);
        }
    }, [displayPositions, loadingPositions, loadingEnabled, loadingLegacyOrder]);

    // Save new bortlet positions to Firebase when they are added
    useEffect(() => {
        // Don't save if still loading or if we're currently saving
        if (loadingPositions || loadingEnabled || loadingLegacyOrder || savingPositions) {
            return;
        }

        // Don't save if we already saved these exact positions
        const positionsKey = JSON.stringify(displayPositions);
        const lastSavedKey = lastSavedPositionsRef.current ? JSON.stringify(lastSavedPositionsRef.current) : null;
        if (positionsKey === lastSavedKey) {
            return;
        }

        // Only save if displayPositions has new bortlets compared to saved bortPositions
        // (i.e., when displayPositions was computed with new bortlets added)
        let shouldSave = false;
        
        if (bortPositions) {
            const savedBortletIds = new Set(Object.keys(bortPositions) as BortId[]);
            const displayBortletIds = new Set(Object.keys(displayPositions) as BortId[]);
            
            // Check if there are new bortlets in displayPositions
            shouldSave = Array.from(displayBortletIds).some(id => !savedBortletIds.has(id));
        } else if (Object.keys(displayPositions).length > 0) {
            // If we don't have saved positions yet, but displayPositions has positions, save them
            shouldSave = true;
        }

        if (shouldSave) {
            // Save the positions (this will update bortPositions, which will cause displayPositions to recompute)
            lastSavedPositionsRef.current = displayPositions;
            saveBortPositions(displayPositions).catch((error) => {
                console.error('Failed to save bortlet positions:', error);
                // Reset ref on error so we can retry
                lastSavedPositionsRef.current = null;
            });
        }
    }, [displayPositions, bortPositions, loadingPositions, loadingEnabled, loadingLegacyOrder, savingPositions, saveBortPositions]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px of movement before drag starts
            },
        }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
        setDragOverPosition(null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        if (!event.over) {
            setDragOverPosition(null);
            return;
        }

        const overId = event.over.id as string;
        
        // If dropping on an empty grid cell, parse the position
        if (typeof overId === 'string' && overId.startsWith('empty-')) {
            const [, colStr, rowStr] = overId.split('-');
            const col = parseInt(colStr, 10) + 1; // Convert 0-based to 1-based
            const row = parseInt(rowStr, 10) + 1;
            setDragOverPosition({ row, col });
        } else {
            setDragOverPosition(null);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveDragId(null);
        setDragOverPosition(null);
        
        const { active, over } = event;
        
        if (!over) return;

        const draggedBortId = active.id as BortId;
        const overId = over.id as string;

        // If dropping on an empty grid cell
        if (typeof overId === 'string' && overId.startsWith('empty-')) {
            const [, colStr, rowStr] = overId.split('-');
            const col = parseInt(colStr, 10) + 1; // Convert 0-based to 1-based
            const row = parseInt(rowStr, 10) + 1;
            const newPosition: BortPosition = { row, col };
            
            const { colSpan, rowSpan } = getBortletSize(draggedBortId);
            
            // Validate position
            if (!isValidPosition(newPosition, colSpan, rowSpan)) {
                return;
            }

            setLocalPositions((prevPositions) => {
                // Check for overlaps (excluding the dragged item)
                const otherPositions: BortPositions = {} as BortPositions;
                for (const [id, pos] of Object.entries(prevPositions)) {
                    if (id !== draggedBortId) {
                        otherPositions[id as BortId] = pos;
                    }
                }

                // Check if new position overlaps with any existing bortlet
                for (const [id, pos] of Object.entries(otherPositions)) {
                    const size = getBortletSize(id as BortId);
                    if (positionsOverlap(newPosition, colSpan, rowSpan, pos, size.colSpan, size.rowSpan)) {
                        // Position overlaps, don't update
                        return prevPositions;
                    }
                }

                // Update position
                const newPositions = { ...prevPositions };
                newPositions[draggedBortId] = newPosition;

                // Save to Firebase (fire and forget - don't block UI)
                saveBortPositions(newPositions).catch((error) => {
                    console.error('Failed to save bort positions:', error);
                    // Revert on error
                    setLocalPositions(prevPositions);
                });

                return newPositions;
            });
        }
    };

    const isDragDisabled = loadingPositions || loadingEnabled || loadingLegacyOrder;
    const positionsToRender = isDragDisabled ? displayPositions : localPositions;

    // Calculate filled and available spaces (use same positions as rendering)
    const { filledSpaces, availableSpaces, totalSpaces } = useMemo(() => {
        const TOTAL_SPACES = 24; // 6 columns × 4 rows
        const positionsToUse = isDragDisabled ? displayPositions : localPositions;
        
        const filled = Object.keys(positionsToUse).reduce((sum, bortId) => {
            if (!enabledSet.has(bortId as BortId)) return sum;
            const { colSpan, rowSpan } = getBortletSize(bortId as BortId);
            return sum + (colSpan * rowSpan);
        }, 0);
        
        return {
            filledSpaces: filled,
            availableSpaces: TOTAL_SPACES - filled,
            totalSpaces: TOTAL_SPACES,
        };
    }, [isDragDisabled, displayPositions, localPositions, enabledSet]);
    const positionsReady = !loadingPositions && !loadingEnabled && !loadingLegacyOrder;

    // Get list of bortlets to render (filtered by enabled)
    const bortletsToRender = useMemo(() => {
        return Object.keys(positionsToRender)
            .filter((bortId) => isValidBortId(bortId) && enabledSet.has(bortId))
            .sort((a, b) => {
                // Sort by row first, then by col for consistent rendering
                const posA = positionsToRender[a as BortId];
                const posB = positionsToRender[b as BortId];
                if (posA.row !== posB.row) return posA.row - posB.row;
                return posA.col - posB.col;
            }) as BortId[];
    }, [positionsToRender, enabledSet]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <Header 
                    user={user} 
                    filledSpaces={filledSpaces}
                    availableSpaces={availableSpaces}
                    totalSpaces={totalSpaces}
                />
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-6 grid-rows-4 gap-6 h-[calc(100vh-12rem)] relative auto-rows-fr">
                        {!positionsReady ? (
                            // Show spinner while positions are loading
                            <div className="col-span-6 row-span-4 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-700 border-t-blue-500 dark:border-t-blue-600 rounded-full animate-spin" />
                                    <div className="text-zinc-600 dark:text-zinc-400">Loading dashboard...</div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {bortletsToRender.map((bortId) => {
                                    const position = positionsToRender[bortId];
                                    const { colSpan, rowSpan } = getBortletSize(bortId);
                                    
                                    return (
                                        <SortableBort 
                                            key={bortId} 
                                            id={bortId}
                                            colSpan={colSpan}
                                            rowSpan={rowSpan}
                                            position={position}
                                        >
                                            <DynamicBortlet id={bortId} userId={user.uid} user={user} />
                                        </SortableBort>
                                    );
                                })}
                                {activeDragId && (
                                    <EmptyGridOverlay 
                                        positions={positionsToRender}
                                        enabledSet={enabledSet}
                                        activeDragId={activeDragId}
                                        dragOverPosition={dragOverPosition}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </DndContext>
            </div>
        </div>
    );
}

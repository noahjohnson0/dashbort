'use client';

import { useDroppable } from '@dnd-kit/core';
import type { BortId, BortPositions, BortPosition } from '@/lib/firebase/userSettings';
import { getBortletSize, getOccupiedCells, isValidPosition } from '@/lib/bortlets/positions';

interface EmptyGridCellProps {
    id: string;
    col: number;
    row: number;
    isActive: boolean;
    isPartOfHoveredArea: boolean;
}

function EmptyGridCellItem({ id, col, row, isActive, isPartOfHoveredArea }: EmptyGridCellProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
        disabled: !isActive,
    });

    if (!isActive) return null;

    // Highlight if this cell is part of the hovered area or directly hovered
    const isHighlighted = isOver || isPartOfHoveredArea;

    return (
        <div
            ref={setNodeRef}
            className={`
                border-2 border-dashed rounded-lg
                transition-all duration-200
                ${isHighlighted
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30 border-solid z-40' 
                    : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/30 dark:bg-zinc-900/20 z-30'
                }
            `}
            style={{
                gridColumn: col + 1,
                gridRow: row + 1,
            }}
        />
    );
}

interface EmptyGridOverlayProps {
    positions: BortPositions;
    enabledSet: Set<BortId>;
    activeDragId: string;
    dragOverPosition: BortPosition | null;
}

/**
 * Renders all 24 grid cells (6x4) as visual drop zones during drag
 * Shows empty cells that can be used for positioning feedback
 * Highlights all cells that the dragged bortlet would occupy
 */
export function EmptyGridOverlay({ positions, enabledSet, activeDragId, dragOverPosition }: EmptyGridOverlayProps) {
    // Get the size of the dragged bortlet
    const { colSpan, rowSpan } = getBortletSize(activeDragId as BortId);
    
    // Calculate which cells would be occupied if the bortlet is placed at dragOverPosition
    const hoveredCells = new Set<string>();
    if (dragOverPosition && isValidPosition(dragOverPosition, colSpan, rowSpan)) {
        const cells = getOccupiedCells(dragOverPosition, colSpan, rowSpan);
        cells.forEach(cell => hoveredCells.add(cell));
    }

    // Create a set of all occupied cells (excluding the dragged item)
    const occupiedCells = new Set<string>();
    for (const [bortId, position] of Object.entries(positions)) {
        if (bortId === activeDragId) continue; // Don't count the dragged item
        if (!enabledSet.has(bortId as BortId)) continue;
        
        const size = getBortletSize(bortId as BortId);
        const cells = getOccupiedCells(position, size.colSpan, size.rowSpan);
        cells.forEach(cell => occupiedCells.add(cell));
    }

    // Check if all hovered cells are available (not overlapping with other bortlets)
    const allHoveredCellsAvailable = dragOverPosition && isValidPosition(dragOverPosition, colSpan, rowSpan) &&
        Array.from(hoveredCells).every(cell => !occupiedCells.has(cell));

    // Generate all 24 grid positions (6 columns × 4 rows)
    const gridCells = [];
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 6; col++) {
            const cellKey = `${row + 1}-${col + 1}`;
            const isOccupied = occupiedCells.has(cellKey);
            
            if (!isOccupied) {
                const cellId = `empty-${col}-${row}`;
                // Check if this cell is part of the hovered area (only if all cells are available)
                const isPartOfHoveredArea = !!(allHoveredCellsAvailable && hoveredCells.has(cellKey));
                gridCells.push({ id: cellId, col, row, isPartOfHoveredArea });
            }
        }
    }

    return (
        <>
            {gridCells.map(({ id, col, row, isPartOfHoveredArea }) => (
                <EmptyGridCellItem 
                    key={id} 
                    id={id} 
                    col={col} 
                    row={row} 
                    isActive={true}
                    isPartOfHoveredArea={isPartOfHoveredArea}
                />
            ))}
        </>
    );
}

import type { BortId } from './registry';
import { DEFAULT_BORT_ORDER, getBortletConfig } from './registry';
import type { BortPositions, BortPosition } from '@/lib/firebase/userSettings';

const GRID_COLS = 6;
const GRID_ROWS = 4;

/**
 * Get the grid size for a bortlet based on its config
 */
export function getBortletSize(bortId: BortId): { colSpan: number; rowSpan: number } {
  const config = getBortletConfig(bortId);
  if (config.is1x1) return { colSpan: 1, rowSpan: 1 };
  if (config.is2x1) return { colSpan: 2, rowSpan: 1 };
  if (config.is2x2) return { colSpan: 2, rowSpan: 2 };
  return { colSpan: 1, rowSpan: 2 }; // default 1x2
}

/**
 * Convert bortOrder array to default positions
 * Places bortlets in order, wrapping to next row when needed
 */
export function generateDefaultPositions(bortOrder: BortId[]): BortPositions {
  const positions: BortPositions = {} as BortPositions;
  let currentRow = 1;
  let currentCol = 1;

  for (const bortId of bortOrder) {
    const { colSpan, rowSpan } = getBortletSize(bortId);
    
    // Check if we need to wrap to next row
    if (currentCol + colSpan - 1 > GRID_COLS) {
      currentRow++;
      currentCol = 1;
    }
    
    // Check if we have space
    if (currentRow + rowSpan - 1 > GRID_ROWS) {
      // Skip if it doesn't fit (shouldn't happen with default layout)
      continue;
    }

    positions[bortId] = { row: currentRow, col: currentCol };
    
    // Move to next position (simple: move right by colSpan)
    currentCol += colSpan;
    
    // Wrap to next row if needed
    if (currentCol > GRID_COLS) {
      currentRow++;
      currentCol = 1;
    }
  }

  return positions;
}

/**
 * Get default positions based on DEFAULT_BORT_ORDER
 */
export function getDefaultPositions(): BortPositions {
  return generateDefaultPositions(DEFAULT_BORT_ORDER);
}

/**
 * Convert legacy bortOrder array to positions (for migration)
 */
export function migrateOrderToPositions(bortOrder: BortId[] | null): BortPositions | null {
  if (!bortOrder || bortOrder.length === 0) {
    return null;
  }
  return generateDefaultPositions(bortOrder);
}

/**
 * Check if a position is valid (within grid bounds)
 */
export function isValidPosition(position: BortPosition, colSpan: number, rowSpan: number): boolean {
  return (
    position.row >= 1 &&
    position.col >= 1 &&
    position.row + rowSpan - 1 <= GRID_ROWS &&
    position.col + colSpan - 1 <= GRID_COLS
  );
}

/**
 * Get all cells occupied by a bortlet at a given position
 */
export function getOccupiedCells(position: BortPosition, colSpan: number, rowSpan: number): string[] {
  const cells: string[] = [];
  for (let row = position.row; row < position.row + rowSpan; row++) {
    for (let col = position.col; col < position.col + colSpan; col++) {
      cells.push(`${row}-${col}`);
    }
  }
  return cells;
}

/**
 * Check if two positions overlap
 */
export function positionsOverlap(
  pos1: BortPosition,
  colSpan1: number,
  rowSpan1: number,
  pos2: BortPosition,
  colSpan2: number,
  rowSpan2: number
): boolean {
  const cells1 = new Set(getOccupiedCells(pos1, colSpan1, rowSpan1));
  const cells2 = getOccupiedCells(pos2, colSpan2, rowSpan2);
  return cells2.some(cell => cells1.has(cell));
}

/**
 * Find the first available position for a bortlet in the grid
 */
export function findAvailablePosition(
  bortId: BortId,
  existingPositions: BortPositions,
  excludeBortId?: BortId
): BortPosition | null {
  const { colSpan, rowSpan } = getBortletSize(bortId);
  
  // Create a map of occupied cells
  const occupiedCells = new Set<string>();
  for (const [id, pos] of Object.entries(existingPositions)) {
    if (id === excludeBortId) continue;
    const size = getBortletSize(id as BortId);
    const cells = getOccupiedCells(pos, size.colSpan, size.rowSpan);
    cells.forEach(cell => occupiedCells.add(cell));
  }

  // Try each position
  for (let row = 1; row <= GRID_ROWS - rowSpan + 1; row++) {
    for (let col = 1; col <= GRID_COLS - colSpan + 1; col++) {
      const position: BortPosition = { row, col };
      const cells = getOccupiedCells(position, colSpan, rowSpan);
      
      // Check if all cells are available
      if (cells.every(cell => !occupiedCells.has(cell))) {
        return position;
      }
    }
  }

  return null; // No available position
}

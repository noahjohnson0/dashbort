'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { type BortId, type BortPosition } from '@/lib/firebase/userSettings';

interface SortableBortProps {
    id: BortId;
    children: React.ReactNode;
    colSpan?: number;
    rowSpan?: number;
    position: BortPosition;
}

export function SortableBort({ id, children, colSpan = 1, rowSpan = 2, position }: SortableBortProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({ id });

    const style: React.CSSProperties = {
        gridColumn: `${position.col} / ${position.col + colSpan}`,
        gridRow: `${position.row} / ${position.row + rowSpan}`,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
        >
            {children}
        </div>
    );
}


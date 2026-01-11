'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type BortId } from '@/lib/firebase/userSettings';

interface SortableBortProps {
    id: BortId;
    children: React.ReactNode;
    colSpan?: number;
    rowSpan?: number;
}

export function SortableBort({ id, children, colSpan = 1, rowSpan = 2 }: SortableBortProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const colSpanClass = colSpan === 1 ? 'col-span-1' : colSpan === 2 ? 'col-span-2' : 'col-span-3';
    const rowSpanClass = rowSpan === 1 ? 'row-span-1' : rowSpan === 2 ? 'row-span-2' : 'row-span-3';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`cursor-grab active:cursor-grabbing ${colSpanClass} ${rowSpanClass} ${isDragging ? 'z-50' : ''}`}
        >
            {children}
        </div>
    );
}


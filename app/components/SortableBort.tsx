'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type BortId } from '@/lib/firebase/userSettings';

interface SortableBortProps {
    id: BortId;
    children: React.ReactNode;
}

export function SortableBort({ id, children }: SortableBortProps) {
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`cursor-grab active:cursor-grabbing col-span-1 row-span-2 ${isDragging ? 'z-50' : ''}`}
        >
            {children}
        </div>
    );
}


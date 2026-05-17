import { type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripIcon } from './BuilderIcons';

export function SortableItem({ id, data, children }: {
  id: string;
  data?: Record<string, unknown>;
  children: (dragHandle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-30 z-10' : ''}
    >
      {children(
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-2 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing touch-none shrink-0"
          aria-label="Drag to reorder"
        >
          <GripIcon />
        </button>
      )}
    </div>
  );
}

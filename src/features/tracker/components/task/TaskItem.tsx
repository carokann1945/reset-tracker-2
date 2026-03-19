'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useTaskStore } from '../../model/taskStore';
import type { Task } from '../../model/types';

type TaskItemProps = {
  task: Task;
};

export default function TaskItem({ task }: TaskItemProps) {
  const toggleSimpleCheck = useTaskStore((store) => store.toggleSimpleCheck);
  const toggleRepeatCheck = useTaskStore((store) => store.toggleRepeatCheck);

  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const completedCount = task.kind === 'repeat' ? task.checks.filter(Boolean).length : Number(task.checks[0]);
  const isCompleted =
    task.kind === 'simple' ? task.checks[0] : task.checks.length > 0 && completedCount === task.targetCount;

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'group w-full',
        'px-[10px] py-[10px]',
        'flex items-center justify-between gap-[12px]',
        'rounded-md border border-gray-200 bg-white text-black',
        'hover:bg-gray-50',
        isCompleted && 'border-gray-100 bg-gray-50/80 text-gray-500',
        isDragging && 'relative z-10 bg-white shadow-sm ring-1 ring-accent-blue/20',
      )}>
      <div className={cn('min-w-0 flex flex-1 items-start gap-[8px]')}>
        <button
          {...attributes}
          {...listeners}
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`${task.title} 순서 변경`}
          className={cn(
            'mt-[1px] h-[18px] w-[18px] shrink-0',
            'flex items-center justify-center',
            'cursor-grab active:cursor-grabbing touch-none text-gray-400',
          )}>
          <GripVertical className={cn('h-[14px] w-[14px]')} />
        </button>
        <div className={cn('min-w-0 flex-1')}>
          <p className={cn('typo-1 truncate', isCompleted && 'line-through text-gray-400')}>{task.title}</p>
          {task.note && <p className={cn('mt-[2px] truncate text-xs text-gray-500')}>{task.note}</p>}
        </div>
      </div>

      <div className={cn('flex shrink-0 items-center gap-[10px]')}>
        {task.kind === 'simple' ? (
          <Checkbox
            checked={task.checks[0]}
            onCheckedChange={() => toggleSimpleCheck(task.id)}
            aria-label={`${task.title} 완료 여부`}
          />
        ) : (
          <>
            <span className={cn('text-xs text-gray-500')}>
              {completedCount}/{task.targetCount}
            </span>
            <div className={cn('flex flex-wrap items-center justify-end gap-[8px]')}>
              {task.checks.map((checked, index) => (
                <Checkbox
                  key={`${task.id}-check-${index}`}
                  checked={checked}
                  onCheckedChange={() => toggleRepeatCheck(task.id, index)}
                  aria-label={`${task.title} ${index + 1}번째 체크`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </li>
  );
}

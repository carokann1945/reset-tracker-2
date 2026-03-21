'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, Pencil, Repeat2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, stopPropagation } from '@/lib/utils';
import { useDeleteTask } from '../../hooks/useDeleteTask';
import {
  isAllCompleted,
  getCompletedCount,
  getRepeatLabel,
  formatNextReset,
  formatCompletedAt,
} from '../../model/repeatTask';
import { useTaskStore } from '../../model/taskStore';
import type { Task } from '../../model/types';

export default function TaskItem({ task }: { task: Task }) {
  // dnd-kit
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const toggleSimpleCheck = useTaskStore((store) => store.toggleSimpleCheck);
  const toggleRepeatCheck = useTaskStore((store) => store.toggleRepeatCheck);

  // note 오픈 관리용 상태
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  const completedCount = getCompletedCount(task);
  const isCompleted = isAllCompleted(task);
  const repeatLabel = task.kind === 'repeat' ? getRepeatLabel(task) : null;
  const nextResetLabel = task.kind === 'repeat' ? formatNextReset(task) : null;
  const completedAtLabel = formatCompletedAt(task.completedAt);
  const noteId = `task-note-${task.id}`;
  const { handleDelete } = useDeleteTask();

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${task.title} 순서 변경`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'group relative cursor-pointer w-full',
        'p-[8px]',
        'flex flex-col gap-[8px]',
        'rounded-lg border border-gray-500 bg-white',
        'text-black-text',
        'transition-colors',
        isDragging && 'relative z-10 bg-white shadow-lg ring-1 ring-accent-blue',
      )}>
      {/* 1번 줄 체크박스와 진행도 */}
      <div className={cn('flex flex-wrap items-center gap-x-[6px] gap-y-[4px]')}>
        <div className={cn('flex flex-wrap items-center gap-[6px]')}>
          {task.kind === 'simple' ? (
            <Checkbox
              checked={task.checks[0]}
              onCheckedChange={() => toggleSimpleCheck(task.id)}
              aria-label={`${task.title} 완료 여부`}
              onPointerDown={stopPropagation}
              onKeyDown={stopPropagation}
              className={cn(
                'size-[24px] cursor-pointer border-gray-500',
                'data-[state=checked]:border-accent-blue data-[state=checked]:bg-accent-blue data-[state=checked]:text-white',
              )}
            />
          ) : (
            task.checks.map((checked, index) => (
              <Checkbox
                key={`${task.id}-check-${index}`}
                checked={checked}
                onCheckedChange={() => toggleRepeatCheck(task.id, index)}
                aria-label={`${task.title} ${index + 1}번째 체크`}
                onPointerDown={stopPropagation}
                onKeyDown={stopPropagation}
                className={cn(
                  'size-[24px] cursor-pointer border-gray-500',
                  'data-[state=checked]:border-accent-blue data-[state=checked]:bg-accent-blue data-[state=checked]:text-white',
                )}
              />
            ))
          )}
        </div>
        {task.kind === 'repeat' && (
          <span className={cn('typo-1 text-[14px] text-gray-500', isCompleted && 'text-success')}>
            ({completedCount}/{task.targetCount})
          </span>
        )}
      </div>
      {/* 2번째 줄 뱃지, 제목, 수정 삭제 버튼 */}
      <div className={cn('flex flex-col md:flex-row min-w-0 items-start gap-[6px]')}>
        {/* 반복 아이콘과 라벨 */}
        {repeatLabel && (
          <span className={cn('mt-[1px] inline-flex shrink-0 items-center gap-[3px] typo-1 text-[14px] text-gray-500')}>
            <Repeat2 className={cn('h-[14px] w-[14px] text-accent-blue')} />
            <span>{repeatLabel}</span>
          </span>
        )}
        {/* title과 수정삭제 버튼 */}
        <div className={cn('relative min-w-0 flex-1')}>
          {/* title */}
          <p
            className={cn(
              'min-w-0 break-words typo-1 text-black-text font-medium transition-colors',
              isCompleted && 'line-through text-gray-400',
            )}>
            {task.title}
          </p>
        </div>
        {/* 수정삭제 버튼 */}
        <div className={cn('flex shrink-0 items-center gap-[4px] pl-[4px]')}>
          {task.note && (
            <button
              type="button"
              aria-expanded={isNoteOpen}
              aria-controls={noteId}
              onPointerDown={stopPropagation}
              onKeyDown={stopPropagation}
              onClick={(event) => {
                stopPropagation(event);
                setIsNoteOpen((prev) => !prev);
              }}
              className={cn('text-gray-400 hover:text-gray-600')}>
              {isNoteOpen ? (
                <ChevronUp className={cn('h-[14px] w-[14px]')} />
              ) : (
                <ChevronDown className={cn('h-[14px] w-[14px]')} />
              )}
            </button>
          )}

          <div className={cn('flex items-center gap-[4px]')}>
            <button
              type="button"
              aria-disabled="true"
              aria-label={`${task.title} 수정`}
              onPointerDown={stopPropagation}
              onKeyDown={stopPropagation}
              onClick={stopPropagation}
              className={cn('flex h-[18px] w-[18px] items-center justify-center text-gray-400 hover:text-gray-600')}>
              <Pencil className={cn('h-[14px] w-[14px]')} />
            </button>
            <button
              type="button"
              aria-disabled="true"
              aria-label={`${task.title} 삭제`}
              onPointerDown={stopPropagation}
              onKeyDown={stopPropagation}
              onClick={(e) => {
                stopPropagation(e);
                handleDelete(task);
              }}
              className={cn('flex h-[18px] w-[18px] items-center justify-center text-gray-400 hover:text-gray-600')}>
              <Trash2 className={cn('h-[14px] w-[14px]')} />
            </button>
          </div>
        </div>
      </div>

      {task.kind === 'repeat' && (
        <p className={cn('typo-1 text-[14px] text-gray-500')}>
          초기화: <span className={cn('text-gray-400')}>{nextResetLabel}</span>
        </p>
      )}

      <p className={cn('typo-1 text-[14px] text-gray-500')}>
        완료: <span className={cn('text-gray-400')}>{completedAtLabel}</span>
      </p>

      {task.note && isNoteOpen && (
        <p id={noteId} className={cn('typo-1 text-[14px] whitespace-pre-wrap text-black-text')}>
          {task.note}
        </p>
      )}
    </li>
  );
}

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, NotebookText, Pencil, Repeat2, Trash2 } from 'lucide-react';
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
import TaskDialog from '../task/TaskDialog';

export default function TaskItem({ task }: { task: Task }) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const toggleSimpleCheck = useTaskStore((store) => store.toggleSimpleCheck);
  const toggleRepeatCheck = useTaskStore((store) => store.toggleRepeatCheck);
  const updateTask = useTaskStore((store) => store.updateTask);
  const { handleDelete } = useDeleteTask();

  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const completedCount = getCompletedCount(task);
  const isCompleted = isAllCompleted(task);
  const repeatLabel = task.kind === 'repeat' ? getRepeatLabel(task) : null;
  const nextResetLabel = task.kind === 'repeat' ? formatNextReset(task) : null;
  const completedAtLabel = formatCompletedAt(task.completedAt);
  const noteId = `task-note-${task.id}`;

  const toolbarButtonClass = cn(
    'inline-flex h-[34px] w-[34px] items-center justify-center rounded-md transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/30',
    'sm:h-auto sm:w-auto sm:gap-[6px] sm:px-[10px] sm:py-[6px]',
  );

  return (
    <>
      <li
        ref={setNodeRef}
        style={{
          transform: CSS.Translate.toString(transform),
          transition,
        }}
        className={cn(
          'group relative w-full overflow-hidden rounded-lg border border-gray-500 bg-white text-black-text transition-colors',
          isDragging && 'relative z-10 bg-white shadow-lg ring-1 ring-accent-blue',
        )}>
        <div
          className={cn(
            'flex items-center justify-between gap-[8px] border-b border-[#e4ddd1] bg-[#f6f2ea] px-[4px] py-px',
          )}>
          <button
            {...attributes}
            {...listeners}
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`${task.title} 순서 변경`}
            className={cn(
              'flex h-[30px] w-[30px] items-center justify-center rounded-md text-gray-400 transition-colors',
              'cursor-grab active:cursor-grabbing touch-none',
              'hover:bg-white/80 hover:text-black-text',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/30',
            )}>
            <GripVertical className={cn('h-[16px] w-[16px]')} />
          </button>

          <div className={cn('flex items-center gap-[2px] sm:gap-[6px]')}>
            {task.note && (
              <button
                type="button"
                aria-label={isNoteOpen ? `${task.title} 메모 접기` : `${task.title} 메모 보기`}
                aria-expanded={isNoteOpen}
                aria-controls={noteId}
                onPointerDown={stopPropagation}
                onKeyDown={stopPropagation}
                onClick={(event) => {
                  stopPropagation(event);
                  setIsNoteOpen((prev) => !prev);
                }}
                className={cn(
                  toolbarButtonClass,
                  'text-gray-500 hover:bg-white/80 hover:text-black-text',
                  isNoteOpen && 'bg-white text-black-text shadow-sm',
                )}>
                <NotebookText className={cn('h-[14px] w-[14px] shrink-0')} />
                <span className={cn('text-[14px] hidden sm:inline')}>메모</span>
              </button>
            )}

            <button
              type="button"
              aria-label={`${task.title} 수정`}
              onPointerDown={stopPropagation}
              onKeyDown={stopPropagation}
              onClick={(event) => {
                stopPropagation(event);
                setTaskDialogOpen(true);
              }}
              className={cn(toolbarButtonClass, 'text-gray-500 hover:bg-white/80 hover:text-black-text')}>
              <Pencil className={cn('h-[14px] w-[14px] shrink-0')} />
              <span className={cn('text-[14px] hidden sm:inline')}>수정</span>
            </button>

            <button
              type="button"
              aria-label={`${task.title} 삭제`}
              onPointerDown={stopPropagation}
              onKeyDown={stopPropagation}
              onClick={(event) => {
                stopPropagation(event);
                handleDelete(task);
              }}
              className={cn(toolbarButtonClass, 'text-[#9b463c] hover:bg-[#fbeeea] hover:text-[#8b3126]')}>
              <Trash2 className={cn('h-[14px] w-[14px] shrink-0')} />
              <span className={cn('text-[14px] hidden sm:inline')}>삭제</span>
            </button>
          </div>
        </div>

        <div className={cn('flex flex-col gap-[10px] px-[12px] py-[12px] sm:px-[16px] sm:py-[16px]')}>
          <div className={cn('flex flex-wrap items-center gap-x-[6px] gap-y-[6px]')}>
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

          <div className={cn('flex min-w-0 gap-[6px]')}>
            {repeatLabel && (
              <span className={cn('inline-flex items-center gap-[4px] typo-1 text-[14px] text-gray-500')}>
                <Repeat2 className={cn('h-[14px] w-[14px] shrink-0 text-accent-blue')} />
                <span>{repeatLabel}</span>
              </span>
            )}
            <p
              className={cn(
                'min-w-0 break-words typo-1 font-medium text-black-text transition-colors',
                isCompleted && 'line-through text-gray-400',
              )}>
              {task.title}
            </p>
          </div>

          {task.kind === 'repeat' && (
            <p className={cn('typo-1 text-[14px] text-gray-500')}>
              초기화: <span className={cn('text-gray-400')}>{nextResetLabel}</span>
            </p>
          )}

          <p className={cn('typo-1 text-[14px] text-gray-500')}>
            <span className={cn('text-gray-400')}>{completedAtLabel}</span>
          </p>

          {task.note && isNoteOpen && (
            <p
              id={noteId}
              className={cn(
                'rounded-md border border-[#ebe4d8] bg-[#faf7f1] px-[12px] py-[10px] typo-1 text-[14px] whitespace-pre-wrap text-black-text',
              )}>
              {task.note}
            </p>
          )}
        </div>
      </li>

      {taskDialogOpen && (
        <TaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          onSubmit={(draft) => {
            updateTask(task.id, draft);
          }}
          mode="update"
          defaultKind={task.kind}
          defaultTitle={task.title}
          defaultNote={task.note}
          defaultStartAnchor={task.kind === 'repeat' ? task.startAnchor : undefined}
          defaultTimezone={task.kind === 'repeat' ? task.timezone : undefined}
          defaultIntervalPreset={task.kind === 'repeat' ? task.intervalPreset : undefined}
          defaultCustomIntervalDays={task.kind === 'repeat' ? String(task.customIntervalDays ?? '') : undefined}
          defaultTargetCount={task.kind === 'repeat' ? String(task.targetCount) : undefined}
        />
      )}
    </>
  );
}

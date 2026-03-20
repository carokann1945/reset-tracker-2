'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Temporal } from '@js-temporal/polyfill';
import { ChevronDown, ChevronUp, Pencil, Repeat2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { getNow, computeNextResetAt, isAllCompleted, getCompletedCount } from '../../model/repeatTask';
import { useTaskStore } from '../../model/taskStore';
import type { RepeatTask, Task } from '../../model/types';

// 덕 타이핑. 드래그 중 이벤트 버블링 막기
type StopPropagationEvent = {
  stopPropagation: () => void;
};

// 확장을 고려한 타입 지정
type TaskItemProps = {
  task: Task;
};

const DAY_OF_WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const;

// 드래그 버블링 방지 함수
function stopDragPropagation(event: StopPropagationEvent) {
  event.stopPropagation();
}

// 한자리 숫자는 앞에 0을 붙여주는 함수
function formatTwoDigit(value: number) {
  return value.toString().padStart(2, '0');
}

// 현재 시각을 timezone에 맞게 반환
function getTaskNow(timezone: string): Temporal.PlainDateTime {
  if (timezone === 'plain') {
    return Temporal.Now.plainDateTimeISO();
  }
  return Temporal.Now.zonedDateTimeISO(timezone).toPlainDateTime();
}

// D-day 계산 결과를 문자열로 반환
function formatCountdown(daysUntilReset: number) {
  if (daysUntilReset <= 0) return '오늘';
  return `${daysUntilReset}일 후`;
}

// 시작 기준일을 Temporal 객체로 변환
function getStartAnchor(task: RepeatTask) {
  return Temporal.PlainDateTime.from(task.startAnchor);
}

// temporal의 dayOfWeek를 한국어 요일로 반환
function getWeekdayLabel(dateTime: Temporal.PlainDateTime) {
  return DAY_OF_WEEK_LABELS[dateTime.dayOfWeek - 1];
}

// 반복 주기를 한국어 라벨로 반환
function getRepeatLabel(task: RepeatTask) {
  const start = getStartAnchor(task);
  const weekdayLabel = getWeekdayLabel(start);

  switch (task.intervalPreset) {
    case 'daily':
      return '매일';
    case 'weekly':
      return `매주 (${weekdayLabel})`;
    case 'monthly':
      return `매월 (${start.day})`;
    case 'yearly':
      return `매년 (${formatTwoDigit(start.month)}-${formatTwoDigit(start.day)})`;
    case 'custom':
      const intervalDays = task.customIntervalDays ?? 1;

      if (intervalDays === 1) return '매일';
      if (intervalDays === 7) return `매주 (${weekdayLabel})`;

      return `${intervalDays}일마다`;
  }
}

// 다음 초기화 시각 포맷팅
function formatNextReset(task: RepeatTask) {
  const now = getNow(task.timezone);
  const nextResetAt = computeNextResetAt(task);
  const dayOfWeek = getWeekdayLabel(nextResetAt);
  const daysUntilReset = now.toPlainDate().until(nextResetAt.toPlainDate(), { largestUnit: 'days' }).days;

  return `(${dayOfWeek}) ${formatTwoDigit(nextResetAt.month)}/${formatTwoDigit(nextResetAt.day)} ${formatTwoDigit(nextResetAt.hour)}:${formatTwoDigit(nextResetAt.minute)} - ${formatCountdown(daysUntilReset)}`;
}

// 마지막 완료 날짜 포맷팅
function formatCompletedAt(completedAt?: string) {
  if (!completedAt) return '-';

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const zoned = Temporal.Instant.from(completedAt).toZonedDateTimeISO(timezone);

    return `${formatTwoDigit(zoned.month)}/${formatTwoDigit(zoned.day)}`;
  } catch {
    return '-';
  }
}

export default function TaskItem({ task }: TaskItemProps) {
  const toggleSimpleCheck = useTaskStore((store) => store.toggleSimpleCheck);
  const toggleRepeatCheck = useTaskStore((store) => store.toggleRepeatCheck);

  // 노트 오픈 관리용 상태
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  // dnd-kit
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const completedCount = getCompletedCount(task);
  const isCompleted = isAllCompleted(task);
  const repeatLabel = task.kind === 'repeat' ? getRepeatLabel(task) : null;
  const nextResetLabel = task.kind === 'repeat' ? formatNextReset(task) : null;
  const completedAtLabel = formatCompletedAt(task.completedAt);
  // 접근성 떄문에 만들어둔건데 필요없을듯?
  const noteId = `task-note-${task.id}`;

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
              onPointerDown={stopDragPropagation}
              onKeyDown={stopDragPropagation}
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
                onPointerDown={stopDragPropagation}
                onKeyDown={stopDragPropagation}
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
      <div className={cn('flex min-w-0 items-start gap-[6px]')}>
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
              onPointerDown={stopDragPropagation}
              onKeyDown={stopDragPropagation}
              onClick={(event) => {
                stopDragPropagation(event);
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
              onPointerDown={stopDragPropagation}
              onKeyDown={stopDragPropagation}
              onClick={stopDragPropagation}
              className={cn('flex h-[18px] w-[18px] items-center justify-center text-gray-400 hover:text-gray-600')}>
              <Pencil className={cn('h-[14px] w-[14px]')} />
            </button>
            <button
              type="button"
              aria-disabled="true"
              aria-label={`${task.title} 삭제`}
              onPointerDown={stopDragPropagation}
              onKeyDown={stopDragPropagation}
              onClick={stopDragPropagation}
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

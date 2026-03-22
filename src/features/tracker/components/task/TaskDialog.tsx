import { Temporal } from '@js-temporal/polyfill';
import { ChevronDown, CircleHelp, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useRef, useState, type ChangeEvent, SubmitEventHandler } from 'react';
import { cn, getBrowserTimezone } from '@/lib/utils';
import type { TaskDraft, IntervalPreset } from '../../model/types';

const MAX_TARGET_COUNT = 10;
const MIN_TARGET_COUNT = 1;
const DEFAULT_TARGET_COUNT = 1;
const DEFAULT_INTERVAL_DAYS = '1';

type TaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: TaskDraft) => void;
  mode?: 'add' | 'update';
  defaultKind?: string;
  defaultTitle?: string;
  defaultNote?: string;
  defaultStartAnchor?: string;
  defaultTimezone?: string;
  defaultIntervalPreset?: string;
  defaultCustomIntervalDays?: string;
  defaultTargetCount?: string;
};

type TaskFormState = {
  kind: TaskDraft['kind'];
  title: string;
  note: string;
  startDate: string;
  startTime: string;
  timezone: string;
  intervalPreset: IntervalPreset;
  customIntervalDays: string;
  targetCount: string;
};

// segment 버튼용
type SegmentedOption<T extends string> = {
  label: string;
  value: T;
};
// segment 버튼용
const TASK_KIND_OPTIONS: SegmentedOption<TaskDraft['kind']>[] = [
  { label: '일반', value: 'simple' },
  { label: '반복', value: 'repeat' },
];
// segment 버튼용
const INTERVAL_OPTIONS: SegmentedOption<IntervalPreset>[] = [
  { label: '매일', value: 'daily' },
  { label: '매주', value: 'weekly' },
  { label: '매월', value: 'monthly' },
  { label: '매년', value: 'yearly' },
  { label: '직접 입력', value: 'custom' },
];
// 폼 입력할때 UI에서 반복 횟수 교정
function clampTargetCount(value: number) {
  return Math.min(MAX_TARGET_COUNT, Math.max(MIN_TARGET_COUNT, value));
}
// 폼 최초값 (formState에 저장)
function createInitialFormState(): TaskFormState {
  const now = Temporal.Now.plainDateTimeISO();

  return {
    kind: 'simple',
    title: '',
    note: '',
    startDate: now.toPlainDate().toString(),
    startTime: now.toPlainTime().toString().slice(0, 5),
    timezone: 'plain',
    intervalPreset: 'daily',
    customIntervalDays: DEFAULT_INTERVAL_DAYS,
    targetCount: String(DEFAULT_TARGET_COUNT),
  };
}
// 양의 정수로 변환
function parsePositiveInteger(value: string) {
  if (!/^\d+$/.test(value)) return null;
  return Number.parseInt(value, 10);
}
// 폼 상태를 실제 저장할 데이터로 변환
function buildTaskDraft(formState: TaskFormState): TaskDraft | null {
  const title = formState.title.trim();
  const note = formState.note.trim() || undefined;

  if (!title) return null;

  if (formState.kind === 'simple') {
    return {
      kind: 'simple',
      title,
      note,
    };
  }

  // targetCount 파싱
  const targetCount = parsePositiveInteger(formState.targetCount);
  if (targetCount === null || targetCount < MIN_TARGET_COUNT) return null;

  // startAnchor 저장
  let startAnchor: string;
  try {
    startAnchor = Temporal.PlainDateTime.from(`${formState.startDate}T${formState.startTime}`).toString({
      smallestUnit: 'minute',
    });
  } catch {
    return null;
  }

  // custom interval 처리
  if (formState.intervalPreset === 'custom') {
    const customIntervalDays = parsePositiveInteger(formState.customIntervalDays);
    if (customIntervalDays === null || customIntervalDays < 1) return null;

    return {
      kind: 'repeat',
      title,
      note,
      timezone: formState.timezone,
      startAnchor,
      intervalPreset: 'custom',
      customIntervalDays,
      targetCount,
    };
  }

  return {
    kind: 'repeat',
    title,
    note,
    timezone: formState.timezone,
    startAnchor,
    intervalPreset: formState.intervalPreset,
    targetCount,
  };
}

// 버튼 컴포넌트
function SegmentedButtonGroup<T extends string>({
  value,
  options,
  onChange,
  className,
  buttonClassName,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  buttonClassName?: string;
}) {
  return (
    <div className={className}>
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[14px] border px-[20px] py-[12px] text-[16px] leading-none transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/30',
              isActive
                ? 'border-[#d9d4ca] bg-white font-[700] text-black-text shadow-[0_0_0_1px_rgba(255,255,255,0.7)_inset]'
                : 'border-transparent bg-transparent font-[500] text-black-text/70',
              buttonClassName,
            )}>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// 메인 컴포넌트
export default function TaskDialog({
  open,
  onOpenChange,
  onSubmit,
  mode = 'add',
  defaultKind,
  defaultTitle,
  defaultNote,
  defaultStartAnchor,
  defaultTimezone,
  defaultIntervalPreset,
  defaultCustomIntervalDays,
  defaultTargetCount,
}: TaskDialogProps) {
  const [formState, setFormState] = useState(() => {
    const base = createInitialFormState();
    let startDate = base.startDate;
    let startTime = base.startTime;
    if (defaultStartAnchor) {
      const [d, t] = defaultStartAnchor.split('T');
      startDate = d ?? base.startDate;
      startTime = t?.slice(0, 5) ?? base.startTime;
    }

    return {
      ...base,
      kind: (defaultKind as TaskFormState['kind']) ?? base.kind,
      title: defaultTitle ?? base.title,
      note: defaultNote ?? base.note,
      startDate,
      startTime,
      timezone: defaultTimezone ?? base.timezone,
      intervalPreset: (defaultIntervalPreset as IntervalPreset) ?? base.intervalPreset,
      customIntervalDays: defaultCustomIntervalDays ?? base.customIntervalDays,
      targetCount: defaultTargetCount ?? base.targetCount,
    };
  });

  const isEditMode = mode;
  const dialogTitle = isEditMode === 'update' ? '작업 수정' : '새 작업';
  const submitLabel = isEditMode === 'update' ? '저장' : '추가';
  const dialogDescription =
    isEditMode === 'update' ? '작업을 수정하는 다이얼로그입니다.' : '새 작업을 추가하는 다이얼로그입니다.';

  const [browserTimezone] = useState(getBrowserTimezone);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const draft = buildTaskDraft(formState);
  const isRepeat = formState.kind === 'repeat';
  const showCustomIntervalInput = isRepeat && formState.intervalPreset === 'custom';

  // 타임존 선택 옵션. browserTimezone 가져올때 에러나면 plain으로 적용시킴
  const timezoneOptions = (() => {
    const options = [{ label: 'Plain (표준 시간대 없음)', value: 'plain' }];

    if (browserTimezone && browserTimezone !== 'plain') {
      options.push({ label: browserTimezone, value: browserTimezone });
    } else {
      options.push({ label: '에러', value: 'plain' });
    }

    const current = formState.timezone;
    if (current && current !== 'plain' && current !== browserTimezone) {
      options.push({ label: current, value: current });
    }

    return options;
  })();

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  // 상태 업데이트 헬퍼 함수
  const updateField = <K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };
  // targetCount 업데이트
  const handleTargetCountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value.replace(/[^\d]/g, '');

    if (!next) {
      updateField('targetCount', '');
      return;
    }

    updateField('targetCount', String(clampTargetCount(Number.parseInt(next, 10))));
  };
  // 포커스 잃으면 targetCount를 1로 변경
  const handleTargetCountBlur = () => {
    const parsed = parsePositiveInteger(formState.targetCount);
    updateField('targetCount', String(clampTargetCount(parsed ?? DEFAULT_TARGET_COUNT)));
  };

  const handleCustomIntervalChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateField('customIntervalDays', event.target.value.replace(/[^\d]/g, ''));
  };

  const handleCustomIntervalBlur = () => {
    const parsed = parsePositiveInteger(formState.customIntervalDays);
    updateField('customIntervalDays', String(Math.max(1, parsed ?? 1)));
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    if (!draft) return;

    onSubmit(draft);
    handleOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          )}
        />
        <DialogPrimitive.Content
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            titleInputRef.current?.focus();
          }}
          className={cn(
            'max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[500px]',
            'p-[16px] sm:p-[24px]',
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-y-auto z-51',
            'rounded-xl sm:rounded-4xl border border-[#dbd6ca] bg-[#fffdfa] shadow-[0_20px_60px_rgba(0,0,0,0.08)]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          )}>
          <DialogPrimitive.Description className="sr-only">{dialogDescription}</DialogPrimitive.Description>
          <form onSubmit={handleSubmit} className={cn('flex flex-col gap-[12px] sm:gap-[24px]')}>
            <div className={cn('flex items-center justify-between gap-[16px]')}>
              <DialogPrimitive.Title className={cn('pt-[4px] text-[18px] sm:text-[20px] font-[900] text-black-text')}>
                {dialogTitle}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="닫기"
                  className={cn(
                    'w-[34px] h-[34px] sm:w-[36px] sm:h-[36px]',
                    'flex justify-center items-center rounded-full text-black-text/65 transition-colors',
                    'hover:bg-black/5 hover:text-black-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/30',
                  )}>
                  <X className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
                </button>
              </DialogPrimitive.Close>
            </div>

            <SegmentedButtonGroup
              value={formState.kind}
              options={TASK_KIND_OPTIONS}
              onChange={(value) => updateField('kind', value)}
              className={cn('grid grid-cols-2 gap-[6px] rounded-[16px] bg-[#f3f0e7] p-[4px]')}
              buttonClassName="sm:min-h-[52px] justify-center"
            />

            <div className={cn('flex flex-col gap-[6px] sm:gap-[12px]')}>
              <label htmlFor="task-title" className={cn('text-[16px] font-[600] text-black-text')}>
                제목
              </label>
              <input
                id="task-title"
                ref={titleInputRef}
                type="text"
                value={formState.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="태스크 이름을 입력하세요"
                className={cn(
                  'w-full h-[40px] sm:h-[56px] rounded-xl border border-[#cbc6bb] bg-white px-[16px] text-[16px] text-black-text outline-none',
                  'placeholder:text-black-text/55 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
                )}
              />
            </div>

            <div className={cn('flex flex-col gap-[6px] sm:gap-[12px]')}>
              <label htmlFor="task-note" className={cn('text-[16px] font-[600] text-black-text')}>
                메모 (선택)
              </label>
              <textarea
                id="task-note"
                value={formState.note}
                onChange={(event) => updateField('note', event.target.value)}
                className={cn(
                  'w-full min-h-[56px] sm:min-h-[112px] resize-none rounded-xl border border-[#cbc6bb] bg-white px-[16px] py-[14px] text-[16px] text-black-text outline-none',
                  'placeholder:text-black-text/55 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
                )}
              />
            </div>

            {isRepeat && (
              <div className={cn('flex flex-col gap-[8px] sm:gap-[24px]')}>
                <div className={cn('border-t border-[#dfdbd2]')} />

                <div className={cn('flex flex-col gap-[6px] sm:gap-[12px]')}>
                  <label className={cn('text-[16px] font-[600] text-black-text')}>시작 시각</label>
                  <div className={cn('grid grid-cols-1 gap-[6px] sm:gap-[12px] sm:grid-cols-[minmax(0,1fr)_164px]')}>
                    <input
                      type="date"
                      value={formState.startDate}
                      onChange={(event) => updateField('startDate', event.target.value)}
                      className={cn(
                        'h-[40px] sm:h-[46px] rounded-xl border border-[#cbc6bb] bg-white px-[16px] text-[16px] text-black-text outline-none',
                        'focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
                      )}
                    />
                    <input
                      type="time"
                      value={formState.startTime}
                      onChange={(event) => updateField('startTime', event.target.value)}
                      className={cn(
                        'h-[40px] sm:h-[46px] rounded-[14px] border border-[#cbc6bb] bg-white px-[16px] text-[16px] text-black-text outline-none',
                        'focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
                      )}
                    />
                  </div>
                </div>

                <div className={cn('flex flex-col gap-[6px] sm:gap-[12px]')}>
                  <div className={cn('flex items-center gap-[6px]')}>
                    <label htmlFor="task-timezone" className={cn('text-[16px] font-[600] text-black-text')}>
                      표준 시간대
                    </label>
                    <CircleHelp className="h-[17px] w-[17px] text-black-text/45" />
                  </div>
                  <div className={cn('relative')}>
                    <select
                      id="task-timezone"
                      value={formState.timezone}
                      onChange={(event) => updateField('timezone', event.target.value)}
                      className={cn(
                        'w-full h-[40px] sm:h-[52px] appearance-none rounded-xl border border-[#cbc6bb] bg-white px-[16px] pr-[44px] text-[16px] text-black-text outline-none',
                        'focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
                      )}>
                      {timezoneOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-[16px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-black-text/55" />
                  </div>
                </div>

                <div className={cn('flex flex-col gap-[6px] sm:gap-[12px]')}>
                  <span className={cn('text-[16px] font-[600] text-black-text')}>반복 주기</span>
                  <SegmentedButtonGroup
                    value={formState.intervalPreset}
                    options={INTERVAL_OPTIONS}
                    onChange={(value) => updateField('intervalPreset', value)}
                    className={cn('flex flex-wrap gap-px sm:gap-[10px]')}
                    buttonClassName="min-h-[40px] sm:min-h-[44px] bg-white px-[8px] sm:px-[18px]"
                  />
                  {showCustomIntervalInput && (
                    <div className={cn('flex gap-[6px] sm:gap-[12px] flex-row items-center')}>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={formState.customIntervalDays}
                        onChange={handleCustomIntervalChange}
                        onBlur={handleCustomIntervalBlur}
                        className={cn(
                          'max-w-[78px] h-[40px] sm:h-[46px] rounded-[14px] border border-[#cbc6bb] bg-white text-center px-[16px] text-[16px] text-black-text outline-none sm:w-[120px]',
                          'focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
                        )}
                      />
                      <span className={cn('text-[16px] text-black-text/75')}>일마다 반복</span>
                    </div>
                  )}
                </div>

                <div className={cn('flex flex-col gap-[6px] sm:gap-[12px]')}>
                  <label htmlFor="task-target-count" className={cn('text-[16px] font-[600] text-black-text')}>
                    목표 횟수
                  </label>
                  <div className={cn('flex items-center gap-[12px]')}>
                    <input
                      id="task-target-count"
                      type="number"
                      inputMode="numeric"
                      min={MIN_TARGET_COUNT}
                      max={MAX_TARGET_COUNT}
                      value={formState.targetCount}
                      onChange={handleTargetCountChange}
                      onBlur={handleTargetCountBlur}
                      className={cn(
                        'w-[78px] h-[40px] sm:h-[46px] rounded-[14px] border border-[#cbc6bb] bg-white px-[16px] text-center text-[16px] text-black-text outline-none',
                        'focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
                      )}
                    />
                    <span className={cn('text-[16px] text-black-text/75')}>회</span>
                  </div>
                </div>
              </div>
            )}

            <div className={cn('flex justify-center sm:justify-end gap-[12px] pt-[8px]')}>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className={cn(
                    'px-[16px] sm:px-[28px] py-[12px] sm:py-[14px]',
                    'rounded-xl border border-[#cbc6bb] bg-white text-[16px] font-[500] text-black-text transition-colors',
                    'hover:bg-[#f5f2ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/30',
                  )}>
                  취소
                </button>
              </DialogPrimitive.Close>
              <button
                type="submit"
                disabled={!draft}
                className={cn(
                  'px-[16px] sm:px-[28px] py-[12px] sm:py-[14px]',
                  'rounded-[14px] border border-[#cbc6bb] bg-[#f3f0e7] text-[16px] font-[700] text-black-text transition-colors',
                  'hover:bg-[#ebe4d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/30',
                  'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#f3f0e7]',
                )}>
                {submitLabel}
              </button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

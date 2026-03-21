import { Temporal } from '@js-temporal/polyfill';
import { formatTwoDigit, getBrowserTimezone } from '@/lib/utils';
import type { RepeatTask, Task } from './types';

const DAY_OF_WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const;

// 내부용 헬퍼 함수

// 현재 시각을 Temporal 객체로 반환
function getNow(timezone: string): Temporal.PlainDateTime {
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

// temporal의 dayOfWeek를 한국어 요일로 반환
function getWeekdayLabel(dateTime: Temporal.PlainDateTime) {
  return DAY_OF_WEEK_LABELS[dateTime.dayOfWeek - 1];
}

// 시작 기준일을 Temporal 객체로 변환
function getStartAnchor(task: RepeatTask) {
  return Temporal.PlainDateTime.from(task.startAnchor);
}

// 주기 계산 (핵심 로직)

// 현재 주기 계산
export function computeCurrentCycle(task: RepeatTask, now = getNow(task.timezone)): number {
  const start = Temporal.PlainDateTime.from(task.startAnchor);

  if (Temporal.PlainDateTime.compare(now, start) < 0) return -1;

  switch (task.intervalPreset) {
    case 'daily':
      return start.until(now, { largestUnit: 'days' }).days;
    case 'weekly':
      return Math.floor(start.until(now, { largestUnit: 'days' }).days / 7);
    case 'custom':
      return Math.floor(start.until(now, { largestUnit: 'days' }).days / (task.customIntervalDays ?? 1));
    case 'monthly':
      let cycleMonthly = start.until(now, { largestUnit: 'months' }).months;
      while (Temporal.PlainDateTime.compare(start.add({ months: cycleMonthly + 1 }), now) <= 0) {
        cycleMonthly++;
      }
      while (cycleMonthly > 0 && Temporal.PlainDateTime.compare(start.add({ months: cycleMonthly }), now) > 0) {
        cycleMonthly--;
      }
      return cycleMonthly;
    case 'yearly':
      let cycleYearly = start.until(now, { largestUnit: 'years' }).years;
      while (Temporal.PlainDateTime.compare(start.add({ years: cycleYearly + 1 }), now) <= 0) {
        cycleYearly++;
      }
      while (cycleYearly > 0 && Temporal.PlainDateTime.compare(start.add({ years: cycleYearly }), now) > 0) {
        cycleYearly--;
      }
      return cycleYearly;
  }
}

// 다음 리셋 날짜 계산
export function computeNextResetAt(task: RepeatTask, now = getNow(task.timezone)): Temporal.PlainDateTime {
  const start = Temporal.PlainDateTime.from(task.startAnchor);
  const currentCycle = computeCurrentCycle(task, now);
  const nextCycle = currentCycle + 1;

  switch (task.intervalPreset) {
    case 'daily':
      return start.add({ days: nextCycle });
    case 'weekly':
      return start.add({ weeks: nextCycle });
    case 'monthly':
      return start.add({ months: nextCycle });
    case 'yearly':
      return start.add({ years: nextCycle });
    case 'custom':
      return start.add({ days: nextCycle * (task.customIntervalDays ?? 1) });
  }
}

// RepeatTask 체크박스 자동 해제
export function syncRepeatTask(task: RepeatTask, now = getNow(task.timezone)): RepeatTask {
  const currentCycle = computeCurrentCycle(task, now);
  const checksCorrupted = task.checks.length !== task.targetCount;

  if (task.lastCycle === currentCycle && !checksCorrupted) return task;

  return {
    ...task,
    checks: Array(task.targetCount).fill(false),
    completedAt: undefined,
    lastCycle: currentCycle,
    updatedAt: Temporal.Now.instant().toString(),
  };
}

// 포맷팅

// 반복 주기 포맷팅
export function getRepeatLabel(task: RepeatTask) {
  const start = getStartAnchor(task);
  const weekdayLabel = getWeekdayLabel(start);
  const timeZone = task.timezone !== 'plain' ? task.timezone : null;

  switch (task.intervalPreset) {
    case 'daily':
      return `매일${timeZone ? ` (${timeZone})` : ''}`;
    case 'weekly':
      return `매주 (${weekdayLabel})${timeZone ? ` (${timeZone})` : ''}`;
    case 'monthly':
      return `매월 (${start.day})${timeZone ? ` (${timeZone})` : ''}`;
    case 'yearly':
      return `매년 (${formatTwoDigit(start.month)}-${formatTwoDigit(start.day)})${timeZone ? ` (${timeZone})` : ''}`;
    case 'custom':
      const intervalDays = task.customIntervalDays ?? 1;

      if (intervalDays === 1) return `매일${timeZone ? ` (${timeZone})` : ''}`;
      if (intervalDays === 7) return `매주 (${weekdayLabel})${timeZone ? ` (${timeZone})` : ''}`;

      return `${intervalDays}일마다${timeZone ? ` (${timeZone})` : ''}`;
  }
}

// 다음 초기화 시각 포맷팅 - 로컬 타임존에 맞춰서 환산해서 보여줌
export function formatNextReset(task: RepeatTask) {
  const now = getNow(task.timezone);
  const nextResetAt = computeNextResetAt(task);

  if (task.timezone !== 'plain') {
    const localTimezone = getBrowserTimezone();
    const local = nextResetAt.toZonedDateTime(task.timezone).withTimeZone(localTimezone);
    const dayOfWeek = getWeekdayLabel(local.toPlainDateTime());
    const countdown = formatCountdown(
      Temporal.Now.plainDateISO().until(local.toPlainDate(), { largestUnit: 'days' }).days,
    );

    return `(${dayOfWeek}) ${formatTwoDigit(local.month)}/${formatTwoDigit(local.day)} ${formatTwoDigit(local.hour)}:${formatTwoDigit(local.minute)} - ${countdown}`;
  }

  const countdown = formatCountdown(now.toPlainDate().until(nextResetAt.toPlainDate(), { largestUnit: 'days' }).days);
  const dayOfWeek = getWeekdayLabel(nextResetAt);
  return `(${dayOfWeek}) ${formatTwoDigit(nextResetAt.month)}/${formatTwoDigit(nextResetAt.day)} ${formatTwoDigit(nextResetAt.hour)}:${formatTwoDigit(nextResetAt.minute)} - ${countdown}`;
}

// 완료 날짜 포맷팅
export function formatCompletedAt(completedAt?: string) {
  if (!completedAt) return '-';

  try {
    const timezone = getBrowserTimezone();
    const local = Temporal.Instant.from(completedAt).toZonedDateTimeISO(timezone);

    return `${formatTwoDigit(local.month)}/${formatTwoDigit(local.day)}`;
  } catch {
    return '-';
  }
}

// 상태 확인

// 완료 확인
export function isAllCompleted(task: Task): boolean {
  return task.checks.length > 0 && task.checks.every(Boolean);
}

// 완료 횟수 확인
export function getCompletedCount(task: Task): number | undefined {
  if (task.kind === 'repeat') return task.checks.filter(Boolean).length;
}

import { Temporal } from '@js-temporal/polyfill';
import type { RepeatTask } from './types';

// 헬퍼 함수 - 현재 날짜 (task에 저장된 timezone 맞춤형 계산을 위한 plain 날짜 생성)
function getNow(timezone: string): Temporal.PlainDateTime {
  if (timezone === 'plain') {
    return Temporal.Now.plainDateTimeISO();
  }
  return Temporal.Now.zonedDateTimeISO(timezone).toPlainDateTime();
}

// 헬퍼 함수 - 현재 주기 계산
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

// 완료 확인
export function isAllCompleted(task: RepeatTask): boolean {
  return task.checks.length > 0 && task.checks.every(Boolean);
}

// 동기화 함수 - RepeatTask 전용 체크박스 해제 로직
export function syncRepeatTask(task: RepeatTask, now = getNow(task.timezone)): RepeatTask {
  const currentCycle = computeCurrentCycle(task, now);

  if (task.lastCycle === currentCycle) return task;

  return {
    ...task,
    checks: Array(task.targetCount).fill(false),
    completedAt: undefined,
    lastCycle: currentCycle,
    updatedAt: Temporal.Now.instant().toString(),
  };
}

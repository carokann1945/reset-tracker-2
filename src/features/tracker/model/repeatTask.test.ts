import { Temporal } from '@js-temporal/polyfill';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  computeCurrentCycle,
  computeNextResetAt,
  isAllCompleted,
  syncRepeatTask,
} from './repeatTask';
import type { RepeatTask } from './types';

const dt = (value: string) => Temporal.PlainDateTime.from(value);

function makeRepeatTask(overrides: Partial<RepeatTask> = {}): RepeatTask {
  const targetCount = overrides.targetCount ?? 3;

  return {
    id: 'task-1',
    tabId: 'tab-1',
    kind: 'repeat',
    title: '반복 작업',
    timezone: 'plain',
    startAnchor: '2025-03-01T09:00',
    intervalPreset: 'daily',
    targetCount,
    checks: overrides.checks ?? Array(targetCount).fill(false),
    lastCycle: 0,
    position: 0,
    updatedAt: '2025-03-01T00:00:00Z',
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('주기 계산', () => {
  it.each([
    ['daily 시작 전', makeRepeatTask(), '2025-03-01T08:59', -1],
    ['daily 시작 시각', makeRepeatTask(), '2025-03-01T09:00', 0],
    ['daily 다음 경계 직전', makeRepeatTask(), '2025-03-02T08:59', 0],
    ['daily 다음 경계 정각', makeRepeatTask(), '2025-03-02T09:00', 1],
    ['weekly 첫 경계 직전', makeRepeatTask({ intervalPreset: 'weekly' }), '2025-03-08T08:59', 0],
    ['weekly 첫 경계 정각', makeRepeatTask({ intervalPreset: 'weekly' }), '2025-03-08T09:00', 1],
    ['custom 2일 경계 직전', makeRepeatTask({ intervalPreset: 'custom', customIntervalDays: 2 }), '2025-03-03T08:59', 0],
    ['custom 2일 경계 정각', makeRepeatTask({ intervalPreset: 'custom', customIntervalDays: 2 }), '2025-03-03T09:00', 1],
  ])('%s', (_label, task, now, expectedCycle) => {
    expect(computeCurrentCycle(task, dt(now))).toBe(expectedCycle);
  });

  it('monthly는 월말 경계를 실제 달력 기준으로 계산한다', () => {
    const task = makeRepeatTask({
      startAnchor: '2025-01-31T09:00',
      intervalPreset: 'monthly',
    });

    expect(computeCurrentCycle(task, dt('2025-02-28T08:59'))).toBe(0);
    expect(computeCurrentCycle(task, dt('2025-02-28T09:00'))).toBe(1);
    expect(computeCurrentCycle(task, dt('2025-03-30T09:00'))).toBe(1);
    expect(computeCurrentCycle(task, dt('2025-03-31T09:00'))).toBe(2);
  });

  it('yearly는 윤년 시작일 경계를 실제 달력 기준으로 계산한다', () => {
    const task = makeRepeatTask({
      startAnchor: '2024-02-29T09:00',
      intervalPreset: 'yearly',
    });

    expect(computeCurrentCycle(task, dt('2025-02-28T08:59'))).toBe(0);
    expect(computeCurrentCycle(task, dt('2025-02-28T09:00'))).toBe(1);
    expect(computeCurrentCycle(task, dt('2026-02-28T09:00'))).toBe(2);
    expect(computeCurrentCycle(task, dt('2028-02-29T09:00'))).toBe(4);
  });
});

describe('다음 리셋 계산', () => {
  it('시작 전이면 시작 시각을 다음 리셋으로 반환한다', () => {
    const task = makeRepeatTask();

    expect(computeNextResetAt(task, dt('2025-03-01T08:59')).equals(dt('2025-03-01T09:00'))).toBe(true);
  });

  it.each([
    ['daily', makeRepeatTask(), '2025-03-03T10:00', '2025-03-04T09:00'],
    ['weekly', makeRepeatTask({ intervalPreset: 'weekly' }), '2025-03-10T09:00', '2025-03-15T09:00'],
    ['custom 3일', makeRepeatTask({ intervalPreset: 'custom', customIntervalDays: 3 }), '2025-03-04T10:00', '2025-03-07T09:00'],
    ['monthly 월말', makeRepeatTask({ startAnchor: '2025-01-31T09:00', intervalPreset: 'monthly' }), '2025-02-28T09:00', '2025-03-31T09:00'],
    ['yearly 윤년', makeRepeatTask({ startAnchor: '2024-02-29T09:00', intervalPreset: 'yearly' }), '2026-05-01T09:00', '2027-02-28T09:00'],
  ])('%s에서 다음 리셋 시각을 계산한다', (_label, task, now, expectedNextResetAt) => {
    expect(computeNextResetAt(task, dt(now)).equals(dt(expectedNextResetAt))).toBe(true);
  });

  it.each([
    ['daily', makeRepeatTask(), '2025-03-03T10:00', '2025-03-04T09:00'],
    ['weekly', makeRepeatTask({ intervalPreset: 'weekly' }), '2025-03-10T09:00', '2025-03-15T09:00'],
    ['custom 2일', makeRepeatTask({ intervalPreset: 'custom', customIntervalDays: 2 }), '2025-03-04T10:00', '2025-03-05T09:00'],
    ['monthly 월말', makeRepeatTask({ startAnchor: '2025-01-31T09:00', intervalPreset: 'monthly' }), '2025-03-30T09:00', '2025-03-31T09:00'],
    ['yearly 윤년', makeRepeatTask({ startAnchor: '2024-02-29T09:00', intervalPreset: 'yearly' }), '2026-05-01T09:00', '2027-02-28T09:00'],
  ])('%s에서 다음 리셋 경계에 도달하면 cycle이 1 증가한다', (_label, task, now, expectedNextResetAt) => {
    const currentCycle = computeCurrentCycle(task, dt(now));
    const nextResetAt = computeNextResetAt(task, dt(now));

    expect(nextResetAt.equals(dt(expectedNextResetAt))).toBe(true);
    expect(computeCurrentCycle(task, nextResetAt.subtract({ minutes: 1 }))).toBe(currentCycle);
    expect(computeCurrentCycle(task, nextResetAt)).toBe(currentCycle + 1);
  });
});

describe('완료 상태 확인', () => {
  it.each([
    ['checks가 비어 있으면 false', makeRepeatTask({ targetCount: 0, checks: [] }), false],
    ['일부만 완료면 false', makeRepeatTask({ checks: [true, false, true] }), false],
    ['모두 완료면 true', makeRepeatTask({ checks: [true, true, true] }), true],
  ])('%s', (_label, task, expected) => {
    expect(isAllCompleted(task)).toBe(expected);
  });
});

describe('상태 동기화', () => {
  it('같은 주기면 원본 참조를 그대로 반환한다', () => {
    const task = makeRepeatTask({
      checks: [true, false, true],
      completedAt: '2025-03-01T10:00',
    });

    expect(syncRepeatTask(task, dt('2025-03-01T20:00'))).toBe(task);
  });

  it('주기가 바뀌면 checks와 완료 상태를 초기화하고 cycle을 갱신한다', () => {
    const fixedInstant = Temporal.Instant.from('1970-01-02T10:17:36.789Z');
    vi.spyOn(Temporal.Now, 'instant').mockReturnValue(fixedInstant);

    const task = makeRepeatTask({
      checks: [true, true, true],
      completedAt: '2025-03-01T10:00',
      lastCycle: 0,
    });

    const result = syncRepeatTask(task, dt('2025-03-02T09:00'));

    expect(result).not.toBe(task);
    expect(result.checks).toEqual([false, false, false]);
    expect(result.completedAt).toBeUndefined();
    expect(result.lastCycle).toBe(1);
    expect(result.updatedAt).toBe(fixedInstant.toString());
    expect(result.title).toBe(task.title);
  });

  it('시작 전 시각이면 lastCycle을 -1로 맞춘다', () => {
    const fixedInstant = Temporal.Instant.from('1970-01-01T00:00:00.099Z');
    vi.spyOn(Temporal.Now, 'instant').mockReturnValue(fixedInstant);

    const task = makeRepeatTask({
      checks: [true, true, false],
      lastCycle: 0,
    });

    const result = syncRepeatTask(task, dt('2025-03-01T08:59'));

    expect(result.lastCycle).toBe(-1);
    expect(result.checks).toEqual([false, false, false]);
    expect(result.updatedAt).toBe(fixedInstant.toString());
  });
});

describe('기본 시간 소스 선택', () => {
  it('timezone이 plain이면 Temporal.Now.plainDateTimeISO를 사용한다', () => {
    const plainSpy = vi.spyOn(Temporal.Now, 'plainDateTimeISO').mockReturnValue(dt('2025-03-03T09:00'));
    const zonedSpy = vi.spyOn(Temporal.Now, 'zonedDateTimeISO').mockImplementation(() => {
      throw new Error('zonedDateTimeISO should not be called');
    });

    const task = makeRepeatTask({ timezone: 'plain' });

    expect(computeCurrentCycle(task)).toBe(2);
    expect(plainSpy).toHaveBeenCalledTimes(1);
    expect(zonedSpy).not.toHaveBeenCalled();
  });

  it('timezone 문자열이면 Temporal.Now.zonedDateTimeISO를 사용한다', () => {
    const plainSpy = vi.spyOn(Temporal.Now, 'plainDateTimeISO').mockImplementation(() => {
      throw new Error('plainDateTimeISO should not be called');
    });
    const zonedSpy = vi
      .spyOn(Temporal.Now, 'zonedDateTimeISO')
      .mockReturnValue(Temporal.ZonedDateTime.from('2025-03-03T09:00:00+09:00[Asia/Seoul]'));

    const task = makeRepeatTask({ timezone: 'Asia/Seoul' });

    expect(computeNextResetAt(task).equals(dt('2025-03-04T09:00'))).toBe(true);
    expect(zonedSpy).toHaveBeenCalledWith('Asia/Seoul');
    expect(plainSpy).not.toHaveBeenCalled();
  });
});

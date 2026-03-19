import { Temporal } from '@js-temporal/polyfill';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RepeatTask, SimpleTask, Task, TaskState } from './types';

const { uidMock, loadTaskStateMock } = vi.hoisted(() => ({
  uidMock: vi.fn(),
  loadTaskStateMock: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  uid: uidMock,
}));

vi.mock('./taskStorage', () => ({
  loadTaskState: loadTaskStateMock,
}));

const dt = (value: string) => Temporal.PlainDateTime.from(value);
const instant = (value: string) => Temporal.Instant.from(value);

type TaskStoreHook = typeof import('./taskStore')['useTaskStore'];

function makeSimpleTask(overrides: Partial<SimpleTask> = {}): SimpleTask {
  return {
    id: 'simple-1',
    tabId: 'tab-1',
    kind: 'simple',
    title: '심플 작업',
    checks: [false],
    position: 0,
    updatedAt: '2025-03-01T00:00:00Z',
    ...overrides,
  };
}

function makeRepeatTask(overrides: Partial<RepeatTask> = {}): RepeatTask {
  const targetCount = overrides.targetCount ?? 3;

  return {
    id: 'repeat-1',
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

async function setupStore(savedState: TaskState | null = null) {
  vi.resetModules();
  uidMock.mockReset();
  loadTaskStateMock.mockReset();

  let nextId = 1;
  uidMock.mockImplementation(() => `task-${nextId++}`);
  loadTaskStateMock.mockReturnValue(savedState);

  const { useTaskStore } = await import('./taskStore');

  return {
    useTaskStore,
    uidMock,
    loadTaskStateMock,
  };
}

function seedState(useTaskStore: TaskStoreHook, tasks: Task[]) {
  useTaskStore.setState({
    state: { version: 1, tasks },
    hydrated: true,
  });
}

function mockInstantNow(value: string) {
  const fixed = instant(value);
  vi.spyOn(Temporal.Now, 'instant').mockReturnValue(fixed);
  return fixed;
}

function mockPlainNow(value: string) {
  const fixed = dt(value);
  vi.spyOn(Temporal.Now, 'plainDateTimeISO').mockReturnValue(fixed);
  return fixed;
}

afterEach(() => {
  vi.restoreAllMocks();
  uidMock.mockReset();
  loadTaskStateMock.mockReset();
});

describe('taskStore', () => {
  describe('hydrate', () => {
    it('저장된 상태를 한 번 로드하고 정렬하며 repeat task를 현재 주기로 동기화한다', async () => {
      const savedState: TaskState = {
        version: 1,
        tasks: [
          makeSimpleTask({ id: 'simple-2', position: 1, title: '두 번째 작업' }),
          makeRepeatTask({
            id: 'repeat-2',
            position: 0,
            targetCount: 2,
            checks: [true, true],
            completedAt: '2025-03-01T10:00:00Z',
            lastCycle: 0,
          }),
        ],
      };
      const { useTaskStore, loadTaskStateMock } = await setupStore(savedState);
      const fixedInstant = mockInstantNow('2025-03-02T00:00:00Z');
      mockPlainNow('2025-03-02T09:00');

      useTaskStore.getState().hydrate();

      const store = useTaskStore.getState();
      expect(store.hydrated).toBe(true);
      expect(loadTaskStateMock).toHaveBeenCalledTimes(1);
      expect(store.state.tasks.map((task) => task.id)).toEqual(['repeat-2', 'simple-2']);

      const repeat = store.state.tasks[0];
      expect(repeat.kind).toBe('repeat');
      if (repeat.kind !== 'repeat') throw new Error('repeat task expected');

      expect(repeat.checks).toEqual([false, false]);
      expect(repeat.completedAt).toBeUndefined();
      expect(repeat.lastCycle).toBe(1);
      expect(repeat.updatedAt).toBe(fixedInstant.toString());
    });

    it('이미 hydrate된 뒤에는 저장소를 다시 읽지 않는다', async () => {
      const { useTaskStore, loadTaskStateMock } = await setupStore({ version: 1, tasks: [] });

      useTaskStore.getState().hydrate();
      useTaskStore.getState().hydrate();

      expect(loadTaskStateMock).toHaveBeenCalledTimes(1);
    });

    it('버전이 맞지 않으면 빈 상태로 fallback한다', async () => {
      const invalidState = { version: 2, tasks: [makeSimpleTask()] } as unknown as TaskState;
      const { useTaskStore } = await setupStore(invalidState);

      useTaskStore.getState().hydrate();

      expect(useTaskStore.getState().state).toEqual({ version: 1, tasks: [] });
      expect(useTaskStore.getState().hydrated).toBe(true);
    });
  });

  describe('syncTasks', () => {
    it('현재 상태를 다시 정렬하고 repeat task를 현재 주기로 재동기화한다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-03T00:00:00Z');
      mockPlainNow('2025-03-03T09:00');

      seedState(useTaskStore, [
        makeSimpleTask({ id: 'simple-2', position: 1, title: '두 번째 작업' }),
        makeRepeatTask({
          id: 'repeat-2',
          position: 0,
          targetCount: 2,
          checks: [true, true],
          completedAt: '2025-03-01T10:00:00Z',
          lastCycle: 0,
        }),
      ]);

      useTaskStore.getState().syncTasks();

      const tasks = useTaskStore.getState().state.tasks;
      expect(tasks.map((task) => task.id)).toEqual(['repeat-2', 'simple-2']);

      const repeat = tasks[0];
      expect(repeat.kind).toBe('repeat');
      if (repeat.kind !== 'repeat') throw new Error('repeat task expected');

      expect(repeat.checks).toEqual([false, false]);
      expect(repeat.completedAt).toBeUndefined();
      expect(repeat.lastCycle).toBe(2);
      expect(repeat.updatedAt).toBe(fixedInstant.toString());
    });

    it('이미 같은 주기인 repeat task는 그대로 유지한다', async () => {
      const { useTaskStore } = await setupStore();
      const repeat = makeRepeatTask({
        id: 'repeat-keep',
        checks: [true, false, true],
        lastCycle: 0,
      });

      seedState(useTaskStore, [repeat]);
      mockPlainNow('2025-03-01T20:00');

      useTaskStore.getState().syncTasks();

      expect(useTaskStore.getState().state.tasks[0]).toBe(repeat);
    });
  });

  describe('addTask', () => {
    it('simple task를 trim된 값과 탭별 position으로 추가한다', async () => {
      const { useTaskStore, uidMock } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-05T00:00:00Z');

      seedState(useTaskStore, [
        makeSimpleTask({ id: 'tab1-0', tabId: 'tab-1', position: 0 }),
        makeSimpleTask({ id: 'tab2-0', tabId: 'tab-2', position: 0 }),
        makeSimpleTask({ id: 'tab2-1', tabId: 'tab-2', position: 1 }),
      ]);

      useTaskStore.getState().addTask('tab-1', {
        kind: 'simple',
        title: '  새 작업  ',
        note: '  메모  ',
      });

      const tasks = useTaskStore.getState().state.tasks;
      const added = tasks[tasks.length - 1];

      expect(uidMock).toHaveBeenCalledTimes(1);
      expect(added).toMatchObject({
        id: 'task-1',
        tabId: 'tab-1',
        kind: 'simple',
        title: '새 작업',
        note: '메모',
        position: 1,
        updatedAt: fixedInstant.toString(),
      });
      expect(added.kind).toBe('simple');
      if (added.kind !== 'simple') throw new Error('simple task expected');
      expect(added.checks).toEqual([false]);
    });

    it('repeat task를 추가할 때 현재 주기에 맞게 lastCycle을 반영한다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-03T00:00:00Z');
      mockPlainNow('2025-03-03T09:00');

      useTaskStore.getState().addTask('tab-1', {
        kind: 'repeat',
        title: '반복 작업',
        note: '  ',
        timezone: 'plain',
        startAnchor: '2025-03-01T09:00',
        intervalPreset: 'daily',
        targetCount: 3,
      });

      const added = useTaskStore.getState().state.tasks[0];
      expect(added.kind).toBe('repeat');
      if (added.kind !== 'repeat') throw new Error('repeat task expected');

      expect(added.checks).toEqual([false, false, false]);
      expect(added.note).toBeUndefined();
      expect(added.lastCycle).toBe(2);
      expect(added.updatedAt).toBe(fixedInstant.toString());
    });
  });

  describe('updateTask', () => {
    it('simple -> simple 수정 시 체크 상태와 completedAt을 유지한다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-04T00:00:00Z');

      seedState(useTaskStore, [
        makeSimpleTask({
          id: 'simple-checked',
          title: '기존 제목',
          note: '기존 메모',
          checks: [true],
          completedAt: '2025-03-01T10:00:00Z',
        }),
      ]);

      useTaskStore.getState().updateTask('simple-checked', {
        kind: 'simple',
        title: '  새 제목  ',
        note: '  새 메모  ',
      });

      const updated = useTaskStore.getState().state.tasks[0];
      expect(updated).toMatchObject({
        id: 'simple-checked',
        kind: 'simple',
        title: '새 제목',
        note: '새 메모',
        completedAt: '2025-03-01T10:00:00Z',
        updatedAt: fixedInstant.toString(),
      });
      expect(updated.kind).toBe('simple');
      if (updated.kind !== 'simple') throw new Error('simple task expected');
      expect(updated.checks).toEqual([true]);
    });

    it('simple -> repeat 전환 시 기존 완료 정보를 버리고 repeat 초기 상태로 바꾼다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-03T00:00:00Z');
      mockPlainNow('2025-03-03T09:00');

      seedState(useTaskStore, [
        makeSimpleTask({
          id: 'simple-to-repeat',
          checks: [true],
          completedAt: '2025-03-01T10:00:00Z',
        }),
      ]);

      useTaskStore.getState().updateTask('simple-to-repeat', {
        kind: 'repeat',
        title: '반복으로 전환',
        timezone: 'plain',
        startAnchor: '2025-03-01T09:00',
        intervalPreset: 'daily',
        targetCount: 2,
      });

      const updated = useTaskStore.getState().state.tasks[0];
      expect(updated.kind).toBe('repeat');
      if (updated.kind !== 'repeat') throw new Error('repeat task expected');

      expect(updated.checks).toEqual([false, false]);
      expect(updated.completedAt).toBeUndefined();
      expect(updated.lastCycle).toBe(2);
      expect(updated.updatedAt).toBe(fixedInstant.toString());
    });

    it('repeat -> simple 전환 시 single checkbox 규격으로 바꾸고 completedAt을 정리한다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-04T00:00:00Z');

      seedState(useTaskStore, [
        makeRepeatTask({
          id: 'repeat-to-simple',
          targetCount: 2,
          checks: [true, true],
          completedAt: '2025-03-01T10:00:00Z',
          lastCycle: 0,
        }),
      ]);

      useTaskStore.getState().updateTask('repeat-to-simple', {
        kind: 'simple',
        title: '심플로 전환',
        note: '  변환됨  ',
      });

      const updated = useTaskStore.getState().state.tasks[0];
      expect(updated).toMatchObject({
        id: 'repeat-to-simple',
        kind: 'simple',
        title: '심플로 전환',
        note: '변환됨',
        completedAt: undefined,
        updatedAt: fixedInstant.toString(),
      });
      expect(updated.kind).toBe('simple');
      if (updated.kind !== 'simple') throw new Error('simple task expected');
      expect(updated.checks).toEqual([false]);
    });

    it('repeat -> repeat 같은 설정 수정 시 checks, lastCycle, completedAt을 유지한다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-01T12:30:00Z');
      mockPlainNow('2025-03-01T12:00');

      seedState(useTaskStore, [
        makeRepeatTask({
          id: 'repeat-same-config',
          targetCount: 2,
          checks: [true, true],
          completedAt: '2025-03-01T10:00:00Z',
          lastCycle: 0,
        }),
      ]);

      useTaskStore.getState().updateTask('repeat-same-config', {
        kind: 'repeat',
        title: '  제목만 변경  ',
        note: '  메모 변경  ',
        timezone: 'plain',
        startAnchor: '2025-03-01T09:00',
        intervalPreset: 'daily',
        targetCount: 2,
      });

      const updated = useTaskStore.getState().state.tasks[0];
      expect(updated.kind).toBe('repeat');
      if (updated.kind !== 'repeat') throw new Error('repeat task expected');

      expect(updated.title).toBe('제목만 변경');
      expect(updated.note).toBe('메모 변경');
      expect(updated.checks).toEqual([true, true]);
      expect(updated.lastCycle).toBe(0);
      expect(updated.completedAt).toBe('2025-03-01T10:00:00Z');
      expect(updated.updatedAt).toBe(fixedInstant.toString());
    });

    it('repeat -> repeat 설정 변경 시 상태를 초기화하고 새 설정으로 동기화한다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-03T00:00:00Z');
      mockPlainNow('2025-03-03T09:00');

      seedState(useTaskStore, [
        makeRepeatTask({
          id: 'repeat-config-changed',
          targetCount: 2,
          checks: [true, true],
          completedAt: '2025-03-01T10:00:00Z',
          lastCycle: 0,
        }),
      ]);

      useTaskStore.getState().updateTask('repeat-config-changed', {
        kind: 'repeat',
        title: '설정 변경',
        timezone: 'plain',
        startAnchor: '2025-03-01T09:00',
        intervalPreset: 'daily',
        targetCount: 3,
      });

      const updated = useTaskStore.getState().state.tasks[0];
      expect(updated.kind).toBe('repeat');
      if (updated.kind !== 'repeat') throw new Error('repeat task expected');

      expect(updated.checks).toEqual([false, false, false]);
      expect(updated.completedAt).toBeUndefined();
      expect(updated.lastCycle).toBe(2);
      expect(updated.updatedAt).toBe(fixedInstant.toString());
    });
  });

  describe('deleteTask', () => {
    it('같은 탭 안에서만 position을 당겨오고 다른 탭은 그대로 둔다', async () => {
      const { useTaskStore } = await setupStore();

      seedState(useTaskStore, [
        makeSimpleTask({ id: 'tab1-0', tabId: 'tab-1', position: 0 }),
        makeSimpleTask({ id: 'tab1-1', tabId: 'tab-1', position: 1 }),
        makeSimpleTask({ id: 'tab1-2', tabId: 'tab-1', position: 2 }),
        makeSimpleTask({ id: 'tab2-0', tabId: 'tab-2', position: 0 }),
      ]);

      useTaskStore.getState().deleteTask('tab1-1');

      expect(useTaskStore.getState().state.tasks).toMatchObject([
        { id: 'tab1-0', tabId: 'tab-1', position: 0 },
        { id: 'tab1-2', tabId: 'tab-1', position: 1 },
        { id: 'tab2-0', tabId: 'tab-2', position: 0 },
      ]);
    });

    it('마지막 task를 삭제할 때 남은 순서를 유지한다', async () => {
      const { useTaskStore } = await setupStore();

      seedState(useTaskStore, [
        makeSimpleTask({ id: 'tab1-0', tabId: 'tab-1', position: 0 }),
        makeSimpleTask({ id: 'tab1-1', tabId: 'tab-1', position: 1 }),
        makeSimpleTask({ id: 'tab2-0', tabId: 'tab-2', position: 0 }),
      ]);

      useTaskStore.getState().deleteTask('tab1-1');

      expect(useTaskStore.getState().state.tasks).toMatchObject([
        { id: 'tab1-0', tabId: 'tab-1', position: 0 },
        { id: 'tab2-0', tabId: 'tab-2', position: 0 },
      ]);
    });
  });

  describe('deleteTasksByTab', () => {
    it('대상 탭의 task만 제거하고 다른 탭 task는 남긴다', async () => {
      const { useTaskStore } = await setupStore();

      seedState(useTaskStore, [
        makeSimpleTask({ id: 'tab1-0', tabId: 'tab-1', position: 0 }),
        makeRepeatTask({ id: 'tab1-repeat', tabId: 'tab-1', position: 1 }),
        makeSimpleTask({ id: 'tab2-0', tabId: 'tab-2', position: 0 }),
      ]);

      useTaskStore.getState().deleteTasksByTab('tab-1');

      expect(useTaskStore.getState().state.tasks).toMatchObject([{ id: 'tab2-0', tabId: 'tab-2', position: 0 }]);
    });
  });

  describe('reorderTasks', () => {
    it('같은 탭 안에서만 순서를 바꾸고 다른 탭 task는 그대로 둔다', async () => {
      const { useTaskStore } = await setupStore();

      seedState(useTaskStore, [
        makeSimpleTask({ id: 'tab1-0', tabId: 'tab-1', position: 0 }),
        makeSimpleTask({ id: 'tab1-1', tabId: 'tab-1', position: 1 }),
        makeSimpleTask({ id: 'tab1-2', tabId: 'tab-1', position: 2 }),
        makeSimpleTask({ id: 'tab2-0', tabId: 'tab-2', position: 0 }),
      ]);

      useTaskStore.getState().reorderTasks('tab-1', ['tab1-2', 'tab1-0', 'tab1-1']);

      expect(useTaskStore.getState().state.tasks).toMatchObject([
        { id: 'tab1-0', tabId: 'tab-1', position: 1 },
        { id: 'tab1-1', tabId: 'tab-1', position: 2 },
        { id: 'tab1-2', tabId: 'tab-1', position: 0 },
        { id: 'tab2-0', tabId: 'tab-2', position: 0 },
      ]);
    });

    it('재정렬 후 syncTasks를 거쳐도 같은 탭 내부 순서를 유지한다', async () => {
      const { useTaskStore } = await setupStore();
      mockPlainNow('2025-03-01T12:00');

      seedState(useTaskStore, [
        makeSimpleTask({ id: 'tab1-0', tabId: 'tab-1', position: 0 }),
        makeSimpleTask({ id: 'tab1-1', tabId: 'tab-1', position: 1 }),
        makeSimpleTask({ id: 'tab1-2', tabId: 'tab-1', position: 2 }),
        makeSimpleTask({ id: 'tab2-0', tabId: 'tab-2', position: 0 }),
      ]);

      useTaskStore.getState().reorderTasks('tab-1', ['tab1-1', 'tab1-2', 'tab1-0']);
      useTaskStore.getState().syncTasks();

      const tab1Tasks = useTaskStore
        .getState()
        .state.tasks.filter((task) => task.tabId === 'tab-1')
        .sort((a, b) => a.position - b.position);

      expect(tab1Tasks.map((task) => task.id)).toEqual(['tab1-1', 'tab1-2', 'tab1-0']);
    });
  });

  describe('toggleSimpleCheck', () => {
    it('미완료 -> 완료 시 completedAt과 updatedAt을 기록한다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-06T00:00:00Z');

      seedState(useTaskStore, [makeSimpleTask({ id: 'simple-toggle', checks: [false] })]);

      useTaskStore.getState().toggleSimpleCheck('simple-toggle');

      const toggled = useTaskStore.getState().state.tasks[0];
      expect(toggled.kind).toBe('simple');
      if (toggled.kind !== 'simple') throw new Error('simple task expected');

      expect(toggled.checks).toEqual([true]);
      expect(toggled.completedAt).toBe(fixedInstant.toString());
      expect(toggled.updatedAt).toBe(fixedInstant.toString());
    });

    it('완료 -> 미완료 시 completedAt을 지운다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-06T01:00:00Z');

      seedState(useTaskStore, [
        makeSimpleTask({
          id: 'simple-toggle',
          checks: [true],
          completedAt: '2025-03-01T10:00:00Z',
        }),
      ]);

      useTaskStore.getState().toggleSimpleCheck('simple-toggle');

      const toggled = useTaskStore.getState().state.tasks[0];
      expect(toggled.kind).toBe('simple');
      if (toggled.kind !== 'simple') throw new Error('simple task expected');

      expect(toggled.checks).toEqual([false]);
      expect(toggled.completedAt).toBeUndefined();
      expect(toggled.updatedAt).toBe(fixedInstant.toString());
    });
  });

  describe('toggleRepeatCheck', () => {
    it('같은 주기면 지정한 인덱스만 토글한다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-06T02:00:00Z');
      mockPlainNow('2025-03-01T20:00');

      seedState(useTaskStore, [
        makeRepeatTask({
          id: 'repeat-toggle',
          checks: [false, false, false],
          lastCycle: 0,
        }),
      ]);

      useTaskStore.getState().toggleRepeatCheck('repeat-toggle', 1);

      const toggled = useTaskStore.getState().state.tasks[0];
      expect(toggled.kind).toBe('repeat');
      if (toggled.kind !== 'repeat') throw new Error('repeat task expected');

      expect(toggled.checks).toEqual([false, true, false]);
      expect(toggled.lastCycle).toBe(0);
      expect(toggled.completedAt).toBeUndefined();
      expect(toggled.updatedAt).toBe(fixedInstant.toString());
    });

    it('주기 경과 후 첫 토글이면 먼저 새 주기로 sync한 뒤 토글한다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-06T03:00:00Z');
      mockPlainNow('2025-03-02T09:00');

      seedState(useTaskStore, [
        makeRepeatTask({
          id: 'repeat-sync-first',
          checks: [true, true, false],
          completedAt: '2025-03-01T10:00:00Z',
          lastCycle: 0,
        }),
      ]);

      useTaskStore.getState().toggleRepeatCheck('repeat-sync-first', 0);

      const toggled = useTaskStore.getState().state.tasks[0];
      expect(toggled.kind).toBe('repeat');
      if (toggled.kind !== 'repeat') throw new Error('repeat task expected');

      expect(toggled.checks).toEqual([true, false, false]);
      expect(toggled.lastCycle).toBe(1);
      expect(toggled.completedAt).toBeUndefined();
      expect(toggled.updatedAt).toBe(fixedInstant.toString());
    });

    it('마지막 남은 체크를 완료하면 completedAt을 기록한다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-06T04:00:00Z');
      mockPlainNow('2025-03-01T20:00');

      seedState(useTaskStore, [
        makeRepeatTask({
          id: 'repeat-complete',
          targetCount: 2,
          checks: [true, false],
          lastCycle: 0,
        }),
      ]);

      useTaskStore.getState().toggleRepeatCheck('repeat-complete', 1);

      const toggled = useTaskStore.getState().state.tasks[0];
      expect(toggled.kind).toBe('repeat');
      if (toggled.kind !== 'repeat') throw new Error('repeat task expected');

      expect(toggled.checks).toEqual([true, true]);
      expect(toggled.completedAt).toBe(fixedInstant.toString());
      expect(toggled.updatedAt).toBe(fixedInstant.toString());
    });

    it('완료된 상태에서 하나를 해제하면 completedAt을 지운다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-06T05:00:00Z');
      mockPlainNow('2025-03-01T20:00');

      seedState(useTaskStore, [
        makeRepeatTask({
          id: 'repeat-uncheck',
          targetCount: 2,
          checks: [true, true],
          completedAt: '2025-03-01T10:00:00Z',
          lastCycle: 0,
        }),
      ]);

      useTaskStore.getState().toggleRepeatCheck('repeat-uncheck', 0);

      const toggled = useTaskStore.getState().state.tasks[0];
      expect(toggled.kind).toBe('repeat');
      if (toggled.kind !== 'repeat') throw new Error('repeat task expected');

      expect(toggled.checks).toEqual([false, true]);
      expect(toggled.completedAt).toBeUndefined();
      expect(toggled.updatedAt).toBe(fixedInstant.toString());
    });

    it('저장 상태의 checks 길이가 어긋나도 토글 전에 복구한 배열 기준으로 동작한다', async () => {
      const { useTaskStore } = await setupStore();
      const fixedInstant = mockInstantNow('2025-03-06T06:00:00Z');
      mockPlainNow('2025-03-01T20:00');

      seedState(useTaskStore, [
        makeRepeatTask({
          id: 'repeat-corrupted',
          targetCount: 3,
          checks: [false, false],
          lastCycle: 0,
        }),
      ]);

      useTaskStore.getState().toggleRepeatCheck('repeat-corrupted', 1);

      const toggled = useTaskStore.getState().state.tasks[0];
      expect(toggled.kind).toBe('repeat');
      if (toggled.kind !== 'repeat') throw new Error('repeat task expected');

      expect(toggled.checks).toEqual([false, true, false]);
      expect(toggled.lastCycle).toBe(0);
      expect(toggled.completedAt).toBeUndefined();
      expect(toggled.updatedAt).toBe(fixedInstant.toString());
    });
  });
});

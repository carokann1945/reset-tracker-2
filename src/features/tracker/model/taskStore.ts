import { Temporal } from '@js-temporal/polyfill';
import { create } from 'zustand';
import { uid } from '@/lib/utils';
import { syncRepeatTask } from './repeatTask';
import { loadTaskState } from './taskStorage';
import type { TaskState, Task, RepeatTask, TaskDraft } from './types';

type TaskStore = {
  state: TaskState;
  hydrated: boolean;
  hydrate: () => void;
  syncTasks: () => void;
  reorderTasks: (tabId: string, orderedIds: string[]) => void;
  addTask: (tabId: string, draft: TaskDraft) => void;
  updateTask: (taskId: string, draft: TaskDraft) => void;
  deleteTask: (taskId: string) => void;
  restoreTask: (task: Task) => void;
  deleteTasksByTab: (tabId: string) => void;
  toggleSimpleCheck: (taskId: string) => void;
  toggleRepeatCheck: (taskId: string, index: number) => void;
};

const EMPTY_STATE: TaskState = {
  version: 1,
  tasks: [],
};

const MAX_REPEAT_TARGET_COUNT = 10;

// 헬퍼 함수 - 버전 검증, position으로 순서 정렬, task 동기화
function normalizeState(saved: TaskState | null | undefined): TaskState {
  const origin = saved?.version === 1 ? saved : EMPTY_STATE;
  const tasks = [...origin.tasks]
    .sort((a, b) => a.position - b.position)
    .map((task) => (task.kind === 'repeat' ? syncRepeatTask(task) : task));
  return { ...origin, tasks };
}

// 헬퍼 함수 - 반복 횟수 검증, 정상화
function normalizeRepeatConfig(draft: Extract<TaskDraft, { kind: 'repeat' }>) {
  const targetCountSource = draft.targetCount ?? 1;
  const targetCount = Math.min(MAX_REPEAT_TARGET_COUNT, Math.max(1, Math.trunc(targetCountSource)));

  if (draft.intervalPreset !== 'custom') {
    return {
      ...draft,
      customIntervalDays: undefined,
      targetCount,
    };
  }

  const customIntervalSource = draft.customIntervalDays ?? 1;

  return {
    ...draft,
    customIntervalDays: Math.max(1, Math.trunc(customIntervalSource)),
    targetCount,
  };
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  state: EMPTY_STATE,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ state: normalizeState(loadTaskState()), hydrated: true });
  },

  syncTasks: () => set((store) => ({ state: normalizeState(store.state) })),

  reorderTasks: (tabId, orderedIds) =>
    set((store) => {
      const targetTasks = store.state.tasks.filter((task) => task.tabId === tabId);
      const tasksById = new Map(targetTasks.map((task) => [task.id, task]));
      const reorderedTasks = orderedIds.map((taskId, index) => ({
        ...tasksById.get(taskId)!,
        position: index,
      }));
      const reorderedById = new Map(reorderedTasks.map((task) => [task.id, task]));

      return {
        state: {
          ...store.state,
          tasks: store.state.tasks.map((task) => (task.tabId === tabId ? reorderedById.get(task.id)! : task)),
        },
      };
    }),

  addTask: (tabId, draft) =>
    set((store) => {
      const title = draft.title.trim();
      if (!title) return store;

      const base = {
        id: uid(),
        tabId,
        title,
        note: draft.note?.trim() || undefined,
        position: store.state.tasks.filter((t) => t.tabId === tabId).length,
        updatedAt: Temporal.Now.instant().toString(),
      };

      let task: Task;
      if (draft.kind === 'simple') {
        task = { ...base, kind: 'simple', checks: [false] };
      } else {
        const normalizedDraft = normalizeRepeatConfig(draft);
        const raw: RepeatTask = {
          ...base,
          kind: 'repeat',
          timezone: normalizedDraft.timezone,
          startAnchor: normalizedDraft.startAnchor,
          intervalPreset: normalizedDraft.intervalPreset,
          customIntervalDays: normalizedDraft.customIntervalDays,
          targetCount: normalizedDraft.targetCount,
          checks: Array(normalizedDraft.targetCount).fill(false),
          lastCycle: 0,
        };
        task = syncRepeatTask(raw);
      }

      return { state: { ...store.state, tasks: [...store.state.tasks, task] } };
    }),

  updateTask: (taskId, draft) =>
    set((store) => {
      const idx = store.state.tasks.findIndex((t) => t.id === taskId);
      if (idx === -1) return store;
      const title = draft.title.trim();
      if (!title) return store;

      const prev = store.state.tasks[idx];

      const base = {
        id: prev.id,
        tabId: prev.tabId,
        title,
        note: draft.note?.trim() || undefined,
        position: prev.position,
        completedAt: prev.completedAt,
        updatedAt: Temporal.Now.instant().toString(),
      };

      let next: Task;

      if (draft.kind === 'simple') {
        const checked = prev.kind === 'simple' ? prev.checks[0] : false;
        next = { ...base, kind: 'simple', checks: [checked], completedAt: checked ? prev.completedAt : undefined };
      } else {
        const normalizedDraft = normalizeRepeatConfig(draft);
        const configChanged =
          prev.kind !== 'repeat' ||
          prev.startAnchor !== normalizedDraft.startAnchor ||
          prev.timezone !== normalizedDraft.timezone ||
          prev.intervalPreset !== normalizedDraft.intervalPreset ||
          prev.customIntervalDays !== normalizedDraft.customIntervalDays ||
          prev.targetCount !== normalizedDraft.targetCount;

        // 수정사항이 없으면 기존 체크 상태와 lastCycle을 그대로, 아니라면 초기화
        const checks =
          prev.kind === 'repeat' && !configChanged ? prev.checks : Array(normalizedDraft.targetCount).fill(false);
        const lastCycle = prev.kind === 'repeat' && !configChanged ? prev.lastCycle : 0;
        const completedAt = prev.kind === 'repeat' && !configChanged ? prev.completedAt : undefined;

        const raw: RepeatTask = {
          ...base,
          kind: 'repeat',
          timezone: normalizedDraft.timezone,
          startAnchor: normalizedDraft.startAnchor,
          intervalPreset: normalizedDraft.intervalPreset,
          customIntervalDays: normalizedDraft.customIntervalDays,
          targetCount: normalizedDraft.targetCount,
          checks,
          lastCycle,
          completedAt,
        };
        next = syncRepeatTask(raw);
      }

      const tasks = store.state.tasks.slice();
      tasks[idx] = next;
      return { state: { ...store.state, tasks } };
    }),

  deleteTask: (taskId) =>
    set((store) => {
      const deleted = store.state.tasks.find((t) => t.id === taskId);
      if (!deleted) return store;

      const tasks = store.state.tasks
        .filter((t) => t.id !== taskId)
        .map((t) =>
          t.tabId === deleted.tabId && t.position > deleted.position ? { ...t, position: t.position - 1 } : t,
        );
      return { state: { ...store.state, tasks } };
    }),

  deleteTasksByTab: (tabId) =>
    set((store) => ({
      state: { ...store.state, tasks: store.state.tasks.filter((t) => t.tabId !== tabId) },
    })),

  restoreTask: (task) =>
    set((store) => {
      const tasks = [...store.state.tasks, task].sort((a, b) => a.position - b.position);
      return { state: { ...store.state, tasks } };
    }),

  toggleSimpleCheck: (taskId) =>
    set((store) => {
      const idx = store.state.tasks.findIndex((t) => t.id === taskId);
      if (idx === -1) return store;

      const prev = store.state.tasks[idx];
      if (prev.kind !== 'simple') return store;

      const completed = !prev.checks[0];

      const next = store.state.tasks.slice();
      next[idx] = {
        ...prev,
        checks: [!prev.checks[0]],
        completedAt: completed ? Temporal.Now.instant().toString() : undefined,
        updatedAt: Temporal.Now.instant().toString(),
      };

      return { state: { ...store.state, tasks: next } };
    }),

  toggleRepeatCheck: (taskId, checksIdx) =>
    set((store) => {
      const idx = store.state.tasks.findIndex((t) => t.id === taskId);
      if (idx === -1) return store;

      const prev = store.state.tasks[idx];
      if (prev.kind !== 'repeat') return store;
      if (checksIdx < 0 || checksIdx >= prev.checks.length) return store;

      // 동기화가 안된 상태에서 체크했을때를 대비한 선 동기화
      const synced = syncRepeatTask(prev);
      if (checksIdx < 0 || checksIdx >= synced.checks.length) return store;

      const checks = synced.checks.map((v, i) => (i === checksIdx ? !v : v));
      const completed = checks.every(Boolean);

      const next = store.state.tasks.slice();
      next[idx] = {
        ...synced,
        checks,
        completedAt: completed ? Temporal.Now.instant().toString() : undefined,
        updatedAt: Temporal.Now.instant().toString(),
      };

      return { state: { ...store.state, tasks: next } };
    }),
}));

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
  addTask: (tabId: string, draft: TaskDraft) => void;
  updateTask: (taskId: string, draft: TaskDraft) => void;
  deleteTask: (taskId: string) => void;
  deleteTasksByTab: (tabId: string) => void;
  toggleSimpleCheck: (taskId: string) => void;
  toggleRepeatCheck: (taskId: string, index: number) => void;
};

const EMPTY_STATE: TaskState = {
  version: 1,
  tasks: [],
};

// 헬퍼 함수 - 버전 검증, position으로 순서 정렬, task 동기화
function normalizeState(saved: TaskState | null | undefined): TaskState {
  const origin = saved?.version === 1 ? saved : EMPTY_STATE;
  const tasks = [...origin.tasks]
    .sort((a, b) => a.position - b.position)
    .map((task) => (task.kind === 'repeat' ? syncRepeatTask(task) : task));
  return { ...origin, tasks };
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  state: EMPTY_STATE,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ state: normalizeState(loadTaskState()), hydrated: true });
  },

  syncTasks: () => set((store) => ({ state: normalizeState(store.state) })),

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
        const raw: RepeatTask = {
          ...base,
          kind: 'repeat',
          timezone: draft.timezone,
          startAnchor: draft.startAnchor,
          intervalPreset: draft.intervalPreset,
          customIntervalDays: draft.customIntervalDays,
          targetCount: draft.targetCount,
          checks: Array(draft.targetCount).fill(false),
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
        const configChanged =
          prev.kind !== 'repeat' ||
          prev.startAnchor !== draft.startAnchor ||
          prev.timezone !== draft.timezone ||
          prev.intervalPreset !== draft.intervalPreset ||
          prev.customIntervalDays !== draft.customIntervalDays ||
          prev.targetCount !== draft.targetCount;

        // 수정사항이 없으면 기존 체크 상태와 lastCycle을 그대로, 아니라면 초기화
        const checks = prev.kind === 'repeat' && !configChanged ? prev.checks : Array(draft.targetCount).fill(false);
        const lastCycle = prev.kind === 'repeat' && !configChanged ? prev.lastCycle : 0;
        const completedAt = prev.kind === 'repeat' && !configChanged ? prev.completedAt : undefined;

        const raw: RepeatTask = {
          ...base,
          kind: 'repeat',
          timezone: draft.timezone,
          startAnchor: draft.startAnchor,
          intervalPreset: draft.intervalPreset,
          customIntervalDays: draft.customIntervalDays,
          targetCount: draft.targetCount,
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

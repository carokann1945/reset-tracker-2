'use client';

import { useEffect, useRef, useState } from 'react';
import { bootstrapTracker, saveTrackerSnapshot } from '@/actions/tracker.actions';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { EMPTY_TAB_STATE, EMPTY_TASK_STATE, type TrackerSnapshotPayload } from './persistence';
import { loadState, saveState } from './tabStorage';
import { useTabStore } from './tabStore';
import { loadTaskState, saveTaskState } from './taskStorage';
import { useTaskStore } from './taskStore';

type StorageMode = 'local' | 'db';

function readLocalSnapshot(): TrackerSnapshotPayload {
  return {
    tabState: loadState() ?? EMPTY_TAB_STATE,
    taskState: loadTaskState() ?? EMPTY_TASK_STATE,
  };
}

export default function TrackerPersistenceProvider({ children }: { children: React.ReactNode }) {
  const tabState = useTabStore((store) => store.state);
  const taskState = useTaskStore((store) => store.state);
  const hydrateTabs = useTabStore((store) => store.hydrate);
  const hydrateTasks = useTaskStore((store) => store.hydrate);
  const resetTabs = useTabStore((store) => store.resetState);
  const resetTasks = useTaskStore((store) => store.resetState);

  const [bootstrapped, setBootstrapped] = useState(false);
  const [mode, setMode] = useState<StorageMode>('local');

  const sourceKeyRef = useRef<string | null>(null);
  const modeRef = useRef<StorageMode>('local');
  const latestSnapshotRef = useRef<TrackerSnapshotPayload | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingFlushRef = useRef(false);

  modeRef.current = mode;

  async function flushNow() {
    if (modeRef.current !== 'db') return;
    const snapshot = latestSnapshotRef.current;
    if (!snapshot) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (isSavingRef.current) {
      pendingFlushRef.current = true;
      return;
    }

    isSavingRef.current = true;

    try {
      await saveTrackerSnapshot(snapshot);
    } finally {
      isSavingRef.current = false;

      if (pendingFlushRef.current) {
        pendingFlushRef.current = false;
        void flushNow();
      }
    }
  }

  function scheduleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void flushNow();
    }, 800);
  }

  // 버그
  useEffect(() => {
    const supabase = createBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      sourceKeyRef.current = null;
      latestSnapshotRef.current = null;
      pendingFlushRef.current = false;
      isSavingRef.current = false;

      if (event === 'SIGNED_OUT') {
        const localSnapshot = readLocalSnapshot();

        setMode('local');
        hydrateTabs(localSnapshot.tabState);
        hydrateTasks(localSnapshot.taskState);
        setBootstrapped(true);
        return;
      }

      resetTabs();
      resetTasks();
      setMode('local');
      setBootstrapped(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hydrateTabs, hydrateTasks, resetTabs, resetTasks]);

  useEffect(() => {
    let cancelled = false;

    async function runBootstrap() {
      const localSnapshot = readLocalSnapshot();

      try {
        const result = await bootstrapTracker(localSnapshot);
        if (cancelled) return;

        if (sourceKeyRef.current === result.sourceKey && bootstrapped) return;

        sourceKeyRef.current = result.sourceKey;
        setMode(result.mode);
        hydrateTabs(result.snapshot.tabState);
        hydrateTasks(result.snapshot.taskState);
        setBootstrapped(true);
      } catch {
        if (cancelled) return;

        sourceKeyRef.current = 'local:fallback';
        setMode('local');
        hydrateTabs(localSnapshot.tabState);
        hydrateTasks(localSnapshot.taskState);
        setBootstrapped(true);
      }
    }

    void runBootstrap();

    return () => {
      cancelled = true;
    };
  }, [bootstrapped, hydrateTabs, hydrateTasks]);

  useEffect(() => {
    if (!bootstrapped) return;

    const snapshot = { tabState, taskState };
    latestSnapshotRef.current = snapshot;

    if (mode === 'local') {
      saveState(tabState);
      saveTaskState(taskState);
      return;
    }

    scheduleSave();
  }, [bootstrapped, mode, tabState, taskState]);

  useEffect(() => {
    if (!bootstrapped) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void flushNow();
      }
    };

    const handlePageHide = () => {
      void flushNow();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [bootstrapped]);

  // 4) repeat task 동기화
  useEffect(() => {
    if (!bootstrapped) return;

    const syncTasks = () => {
      useTaskStore.getState().syncTasks();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncTasks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    const intervalId = setInterval(() => {
      syncTasks();
    }, 10_000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
    };
  }, [bootstrapped]);

  if (!bootstrapped) return null;

  return <>{children}</>;
}

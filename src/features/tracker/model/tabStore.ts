'use client';

import { create } from 'zustand';
import type { TabState, Tab } from './types';
import { loadState } from './tabStorage';
import { uid } from '@/lib/utils';

type TabStore = {
  state: TabState;
  hydrated: boolean;
  hydrate: () => void;
  addTab: (name: string) => void;
  renameTab: (tabId: string, name: string) => void;
  deleteTab: (tabId: string) => void;
  reorderTabs: (nextOrderedIds: string[]) => void;
  setActiveTab: (tabId: string | null) => void;
};

const EMPTY_STATE: TabState = {
  version: 1,
  tabs: [],
  activeTabId: null,
};

// 헬퍼 함수 - 버전 검증, position으로 정렬, 활성화된 탭 유효성 체크
function normalizeState(saved: TabState | null | undefined): TabState {
  const validated = saved && saved.version === 1 ? saved : EMPTY_STATE;
  const sorted = [...validated.tabs].sort((a, b) => a.position - b.position);
  const activeExists = sorted.some((tab) => tab.id === validated.activeTabId);

  return {
    ...validated,
    tabs: sorted,
    activeTabId: activeExists ? validated.activeTabId : (sorted[0]?.id ?? null),
  };
}

export const useTabStore = create<TabStore>((set, get) => ({
  state: EMPTY_STATE,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;

    const saved = loadState();

    set({
      state: normalizeState(saved),
      hydrated: true,
    });
  },

  addTab: (name) =>
    set((store) => {
      const newName = name.trim() || '새 탭';
      const newPosition = store.state.tabs.length;

      const newTab: Tab = {
        id: uid(),
        name: newName,
        position: newPosition,
      };

      return {
        state: {
          ...store.state,
          tabs: [...store.state.tabs, newTab],
          activeTabId: store.state.activeTabId ?? newTab.id,
        },
      };
    }),

  renameTab: (tabId, name) =>
    set((store) => {
      const newName = name.trim();
      if (!newName) return store;

      return {
        state: {
          ...store.state,
          tabs: store.state.tabs.map((tab) => (tab.id === tabId ? { ...tab, name: newName } : tab)),
        },
      };
    }),

  deleteTab: (tabId) =>
    set((store) => {
      const tabs = store.state.tabs.filter((tab) => tab.id !== tabId);
      const activeTabId = store.state.activeTabId === tabId ? (tabs[0]?.id ?? null) : store.state.activeTabId;

      return {
        state: {
          ...store.state,
          tabs,
          activeTabId,
        },
      };
    }),

  reorderTabs: (orderedIds) =>
    set((store) => {
      const tabsById = new Map(store.state.tabs.map((tab) => [tab.id, tab]));
      const reorderedTabs = orderedIds.map((tabId, index) => {
        const tab = tabsById.get(tabId);
        if (!tab) return null;
        return { ...tab, position: index };
      });

      if (reorderedTabs.some((tab) => tab === null)) return store;

      return {
        state: {
          ...store.state,
          tabs: reorderedTabs.filter((tab): tab is Tab => tab !== null),
        },
      };
    }),

  setActiveTab: (tabId) =>
    set((store) => {
      if (tabId === null) {
        return {
          state: {
            ...store.state,
            activeTabId: null,
          },
        };
      }

      const exists = store.state.tabs.some((tab) => tab.id === tabId);
      if (!exists) return store;

      return {
        state: {
          ...store.state,
          activeTabId: tabId,
        },
      };
    }),
}));

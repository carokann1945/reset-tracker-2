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
  reorderTabs: (orderedIds: string[]) => void;
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

// 일반 함수 - 액티브 탭 이름 반환
export const selectActiveTabName = (store: TabStore) =>
  store.state.tabs.find((tab) => tab.id === store.state.activeTabId)?.name ?? '선택된 탭 없음';

export const useTabStore = create<TabStore>((set, get) => ({
  state: EMPTY_STATE,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ state: normalizeState(loadState()), hydrated: true });
  },

  addTab: (name) =>
    set((store) => {
      const newTab: Tab = {
        id: uid(),
        name,
        position: store.state.tabs.length,
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
    set((store) => ({
      state: {
        ...store.state,
        tabs: store.state.tabs.map((tab) => (tab.id === tabId ? { ...tab, name } : tab)),
      },
    })),

  deleteTab: (tabId) =>
    set((store) => {
      const tabs = store.state.tabs.filter((tab) => tab.id !== tabId);
      const activeTabId = store.state.activeTabId === tabId ? (tabs[0]?.id ?? null) : store.state.activeTabId;

      return {
        state: { ...store.state, tabs, activeTabId },
      };
    }),

  reorderTabs: (orderedIds) =>
    set((store) => {
      const tabsById = new Map(store.state.tabs.map((tab) => [tab.id, tab]));
      const reorderedTabs = orderedIds.map((tabId, index) => ({
        ...tabsById.get(tabId)!,
        position: index,
      }));

      return {
        state: { ...store.state, tabs: reorderedTabs },
      };
    }),

  setActiveTab: (tabId) =>
    set((store) => ({
      state: { ...store.state, activeTabId: tabId },
    })),
}));

'use client';

import { create } from 'zustand';
import { uid } from '@/lib/utils';
import { EMPTY_TAB_STATE } from './persistence';
import type { TabState, Tab } from './types';

type TabStore = {
  state: TabState;
  hydrated: boolean;
  hydrate: (saved: TabState | null) => void;
  resetState: () => void;
  addTab: (name: string) => void;
  renameTab: (tabId: string, name: string) => void;
  deleteTab: (tabId: string) => void;
  restoreTab: (tab: Tab, activate?: boolean) => void;
  reorderTabs: (orderedIds: string[]) => void;
  setActiveTab: (tabId: string | null) => void;
};

// 헬퍼 함수 - 버전 검증, position으로 정렬, 활성화된 탭 유효성 체크
function normalizeState(saved: TabState | null | undefined): TabState {
  const validated = saved && saved.version === 1 ? saved : EMPTY_TAB_STATE;
  const sorted = [...validated.tabs].sort((a, b) => a.position - b.position);
  const activeTabId =
    validated.activeTabId === null
      ? null
      : sorted.some((tab) => tab.id === validated.activeTabId)
        ? validated.activeTabId
        : null;

  return {
    ...validated,
    tabs: sorted,
    activeTabId,
  };
}

export const selectActiveTab = (store: TabStore) =>
  store.state.tabs.find((tab) => tab.id === store.state.activeTabId) ?? null;

// 일반 함수 - 액티브 탭 이름 반환
export const selectActiveTabName = (store: TabStore) => selectActiveTab(store)?.name ?? '선택된 탭 없음';

export const useTabStore = create<TabStore>((set) => ({
  state: EMPTY_TAB_STATE,
  hydrated: false,

  hydrate: (saved) => {
    set({
      state: normalizeState(saved),
      hydrated: true,
    });
  },

  resetState: () => {
    set({
      state: EMPTY_TAB_STATE,
      hydrated: false,
    });
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
      const tabs = store.state.tabs.filter((tab) => tab.id !== tabId).map((tab, i) => ({ ...tab, position: i }));
      const activeTabId = store.state.activeTabId === tabId ? null : store.state.activeTabId;

      return {
        state: { ...store.state, tabs, activeTabId },
      };
    }),

  restoreTab: (tab, activate = true) =>
    set((store) => {
      if (store.state.tabs.some((t) => t.id === tab.id)) return store;
      const tabs = store.state.tabs
        .map((t) => (t.position >= tab.position ? { ...t, position: t.position + 1 } : t))
        .concat(tab)
        .sort((a, b) => a.position - b.position);
      const activeTabId = activate ? tab.id : store.state.activeTabId;
      return { state: { ...store.state, tabs, activeTabId } };
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

'use client';

import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import type { AppState, Tab } from './types';
import { uid } from '@/lib/utils';
import { loadState, saveState } from './storage';

type AppStore = {
  state: AppState;
  hydrated: boolean;
  addTab: (name: string) => void;
  renameTab: (tabId: string, name: string) => void;
  deleteTab: (tabId: string) => void;
  reorderTabs: (nextOrderedIds: string[]) => void;
  setActiveTab: (tabId: string | null) => void;
};

type Action =
  | { type: 'HYDRATE'; payload: AppState | null }
  | { type: 'ADD_TAB'; name: string }
  | { type: 'RENAME_TAB'; tabId: string; name: string }
  | { type: 'DELETE_TAB'; tabId: string }
  | { type: 'REORDER_TABS'; nextOrderedIds: string[] }
  | { type: 'SET_ACTIVE_TAB'; tabId: string | null };

const EMPTY_STATE: AppState = {
  version: 1,
  tabs: [],
  activeTabId: null,
};

function reducer(state: AppState, action: Action): AppState {
  if (action.type === 'HYDRATE') {
    const next = action.payload && action.payload.version === 1 ? action.payload : EMPTY_STATE;
    const tabs = [...next.tabs].sort((a, b) => a.position - b.position);

    const activeExists = tabs.some((tab) => tab.id === next.activeTabId);

    return {
      ...next,
      tabs,
      activeTabId: activeExists ? next.activeTabId : (tabs[0]?.id ?? null),
    };
  }

  switch (action.type) {
    case 'ADD_TAB': {
      const name = action.name.trim() || '새 탭';
      const newPosition = state.tabs.length === 0 ? 0 : Math.max(...state.tabs.map((tab) => tab.position)) + 1;
      const newTab: Tab = { id: uid(), name, position: newPosition };
      const newTabs = [...state.tabs, newTab];
      return { ...state, tabs: newTabs, activeTabId: state.activeTabId ?? newTab.id };
    }

    case 'RENAME_TAB': {
      const name = action.name.trim();
      if (!name) return state;
      return {
        ...state,
        tabs: state.tabs.map((tab) => (tab.id === action.tabId ? { ...tab, name } : tab)),
      };
    }

    case 'DELETE_TAB': {
      const tabs = state.tabs.filter((tab) => tab.id !== action.tabId);
      let activeTabId = state.activeTabId;
      if (state.activeTabId === action.tabId) {
        activeTabId = tabs[0]?.id ?? null;
      }
      return { ...state, tabs, activeTabId };
    }

    case 'REORDER_TABS': {
      if (action.nextOrderedIds.length !== state.tabs.length) return state;

      const tabsById = new Map(state.tabs.map((tab) => [tab.id, tab]));
      const reorderedTabs = action.nextOrderedIds.map((tabId, index) => {
        const tab = tabsById.get(tabId);
        if (!tab) return null;
        return { ...tab, position: index };
      });

      if (reorderedTabs.some((tab) => tab === null)) return state;

      return {
        ...state,
        tabs: reorderedTabs.filter((tab): tab is Tab => tab !== null),
      };
    }

    case 'SET_ACTIVE_TAB': {
      if (action.tabId === null) {
        return { ...state, activeTabId: null };
      }

      const exists = state.tabs.some((tab) => tab.id === action.tabId);
      if (!exists) return state;

      return {
        ...state,
        activeTabId: action.tabId,
      };
    }

    default:
      return state;
  }
}

const Ctx = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  // 앱 최초 마운트시 1회 실행. localStorage에서 불러와서 state에 넣고, 완료되면 hydrated = true로 변경. 의도한 동작인데 폭포수 렌더링 에러때문에 eslint 끔.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = loadState();
    dispatch({ type: 'HYDRATE', payload: saved });
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [hydrated, state]);

  const api = useMemo<AppStore>(
    () => ({
      state,
      hydrated,
      addTab: (name) => dispatch({ type: 'ADD_TAB', name }),
      renameTab: (tabId, name) => dispatch({ type: 'RENAME_TAB', tabId, name }),
      deleteTab: (tabId) => dispatch({ type: 'DELETE_TAB', tabId }),
      reorderTabs: (nextOrderedIds) => dispatch({ type: 'REORDER_TABS', nextOrderedIds }),
      setActiveTab: (tabId) => dispatch({ type: 'SET_ACTIVE_TAB', tabId }),
    }),
    [state, hydrated],
  );

  // api를 Context에 넣어서 하위 컴포넌트 어디서든 useAppStore()로 꺼낼 수 있게 감싸서 반환
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppStore must be used within <AppProvider>');
  return v;
}

'use client';
// 사이드바 ui 상태 위주

import { create } from 'zustand';
import { useTabStore } from './tabStore';

type SidebarStore = {
  isOpen: boolean;
  isDesktop: boolean;
  isMounted: boolean;
  setIsOpen: (value: boolean) => void;
  sync: (matches: boolean) => void;
};

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: false,
  isDesktop: false,
  isMounted: false,

  setIsOpen: (value) => set({ isOpen: value }),

  sync: (matches) => {
    set({ isDesktop: matches, isOpen: matches });
    setTimeout(() => set({ isMounted: true }), 50);
  },
}));

export function handleTabSelect(tabId: string) {
  const { isDesktop, setIsOpen } = useSidebarStore.getState();
  const { setActiveTab } = useTabStore.getState();
  setActiveTab(tabId);
  if (!isDesktop) setIsOpen(false);
}

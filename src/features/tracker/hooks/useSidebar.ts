'use client';

import { useState, useEffect } from 'react';
import { useTabStore } from '../model/tabStore';

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { setActiveTab } = useTabStore();

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    if (!isDesktop) setIsOpen(false);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const syncSidebarState = (matches: boolean) => {
      setIsDesktop(matches);
      setIsOpen(matches);
      setTimeout(() => setIsMounted(true), 50);
    };
    syncSidebarState(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => {
      syncSidebarState(event.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { isOpen, setIsOpen, isMounted, handleTabSelect };
}

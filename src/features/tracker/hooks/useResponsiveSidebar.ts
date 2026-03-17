'use client';

import { useEffect } from 'react';
import { useSidebarStore } from '../model/sidebarStore';

export function useResponsiveSidebar() {
  const { sync } = useSidebarStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    sync(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => sync(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [sync]);
}

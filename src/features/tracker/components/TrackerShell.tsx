'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useTabStore } from '../model/tabStore';
import Sidebar from './sidebar/Sidebar';
import Header from './Header';

export default function TrackerShell() {
  // 사이드바 상태
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  // 초기렌더링 트렌지션 제어
  const [isMounted, setIsMounted] = useState(false);
  const { state, setActiveTab } = useTabStore();
  const activeTabName = state.tabs.find((tab) => tab.id === state.activeTabId)?.name ?? '선택된 탭 없음';

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);

    if (!isDesktop) {
      setIsOpen(false);
    }
  };

  // md를 기준으로 사이드바 자동 열고닫기
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const syncSidebarState = (matches: boolean) => {
      setIsDesktop(matches);
      setIsOpen(matches);
      // 초기렌더링 트렌지션 제어
      setTimeout(() => {
        setIsMounted(true);
      }, 50);
    };
    syncSidebarState(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => {
      syncSidebarState(event.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <div className={cn('w-full min-h-dvh', 'flex')}>
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} isMounted={isMounted} onTabSelect={handleTabSelect} />
      {isOpen && <div className="md:hidden fixed inset-0 bg-black/70 z-15" onClick={() => setIsOpen(false)} />}
      <div
        data-layout-content
        className={cn(
          'flex-1 h-full',
          'flex flex-col',
          'ml-0',
          isMounted && 'transition-all duration-300',
          isOpen ? 'md:ml-[300px]' : 'md:ml-0',
        )}>
        <Header isOpen={isOpen} setIsOpen={setIsOpen} activeTabName={activeTabName} />
        <main>
          <h1>메인</h1>
        </main>
      </div>
    </div>
  );
}

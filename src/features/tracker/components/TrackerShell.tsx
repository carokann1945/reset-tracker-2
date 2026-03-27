'use client';

import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResponsiveSidebar } from '../hooks/useResponsiveSidebar';
import { useSidebarStore } from '../model/sidebarStore';
import Header from './Header';
import Sidebar from './sidebar/Sidebar';
import TaskList from './task/TaskList';

export default function TrackerShell() {
  useResponsiveSidebar();
  const isOpen = useSidebarStore((store) => store.isOpen);
  const setIsOpen = useSidebarStore((store) => store.setIsOpen);
  const isMounted = useSidebarStore((store) => store.isMounted);

  return (
    <>
      <div className={cn('w-full min-h-dvh', 'flex')}>
        <Sidebar />
        {isMounted && isOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-[2px] z-15 transition-opacity"
            onClick={() => setIsOpen(false)}
          />
        )}
        <div
          className={cn(
            'flex-1 h-full',
            'flex flex-col',
            isMounted ? 'transition-all duration-300' : 'transition-none',
            isMounted ? (isOpen ? 'md:ml-[300px]' : 'md:ml-0') : 'md:ml-[300px]',
          )}>
          <Header />
          <main className={cn('flex-1 bg-custom-sidebar-bg px-[16px] py-[20px] md:px-[24px]')}>
            <TaskList />
          </main>
        </div>
      </div>
      {/* 사이드바 토글 버튼 */}
      {isMounted && (
        <button
          type="button"
          className={cn(
            'fixed top-[16px] z-30',
            'w-[30px] h-[30px] rounded-md',
            'flex justify-center items-center',
            'cursor-pointer hover:bg-gray-200/50',
            'transition-[left] duration-300 ease-in-out',
          )}
          style={{ left: isOpen ? '255px' : '16px' }}
          onClick={() => setIsOpen(!isOpen)}>
          <PanelLeft className={cn('w-[20px] h-[20px] text-custom-black-light')} />
        </button>
      )}
    </>
  );
}

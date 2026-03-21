'use client';

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
  if (!isMounted) return null;

  return (
    <div className={cn('w-full min-h-dvh', 'flex')}>
      <Sidebar />
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-[2px] z-15 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div
        className={cn(
          'flex-1 h-full',
          'flex flex-col',
          'transition-all duration-300',
          isOpen ? 'md:ml-[300px]' : 'md:ml-0',
        )}>
        <Header />
        <main className={cn('flex-1 bg-gray-50 px-[16px] py-[20px] md:px-[24px]')}>
          <TaskList />
        </main>
      </div>
    </div>
  );
}

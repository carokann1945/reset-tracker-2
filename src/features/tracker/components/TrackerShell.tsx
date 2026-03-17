'use client';

import { cn } from '@/lib/utils';
import Sidebar from './sidebar/Sidebar';
import Header from './Header';
import { useResponsiveSidebar } from '../hooks/useResponsiveSidebar';
import { useSidebarStore } from '../model/sidebarStore';

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
          className="md:hidden fixed inset-0 bg-black/50 z-15 backdrop-blur-sm transition-opacity"
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
        <main>
          <h1>화이팅</h1>
        </main>
      </div>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';
import Sidebar from './sidebar/Sidebar';
import Header from './Header';
import { useSidebar } from '../hooks/useSidebar';

export default function TrackerShell() {
  // useSidebar 커스텀 훅
  const { isOpen, setIsOpen, isMounted, handleTabSelect } = useSidebar();
  // 초기 화면 ui 이동하는거 안보이게
  if (!isMounted) return null;

  return (
    <div className={cn('w-full min-h-dvh', 'flex')}>
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} isMounted={isMounted} onTabSelect={handleTabSelect} />
      {isOpen && <div className="md:hidden fixed inset-0 bg-black/70 z-15" onClick={() => setIsOpen(false)} />}
      <div
        data-layout-content
        className={cn(
          'flex-1 h-full',
          'flex flex-col',
          'transition-all duration-300',
          isOpen ? 'md:ml-[300px]' : 'md:ml-0',
        )}>
        <Header isOpen={isOpen} setIsOpen={setIsOpen} />
        <main>
          <h1>메인</h1>
        </main>
      </div>
    </div>
  );
}

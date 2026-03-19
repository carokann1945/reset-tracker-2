import { PanelLeft, CircleUser, LogIn, FolderOpen } from 'lucide-react';
import SvgBluecube from '@/components/svgs/Bluecube';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '../../model/sidebarStore';
import TabButton from './TabButton';
import TabList from './TabList';

export default function Sidebar() {
  const isOpen = useSidebarStore((store) => store.isOpen);
  const setIsOpen = useSidebarStore((store) => store.setIsOpen);

  return (
    <aside
      className={cn(
        'z-20 w-[300px] h-screen',
        'flex flex-col',
        'p-[15px]',
        'fixed top-0 left-0',
        'bg-sidebar-bg text-white',
        'translate-x-full',
        'transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
      {/* 사이트 로고 */}
      <div className={cn('w-full h-[40px]', 'flex justify-between items-center', 'mb-[30px]')}>
        <div
          className={cn('w-[165px]', 'flex items-center gap-[8px]', 'cursor-pointer')}
          onClick={() => window.location.reload()}>
          <figure className={cn('w-[30px] h-[30px]', 'relative')}>
            <SvgBluecube className="h-full w-full text-white" />
          </figure>
          <h1 className={cn('typo-2')}>Reset Tracker</h1>
        </div>
        <div
          className={cn(
            'w-[30px] h-[30px] rounded-md',
            'flex justify-center items-center',
            'cursor-pointer hover:bg-gray-600',
            'transition-color duration-100',
          )}
          onClick={() => setIsOpen(!isOpen)}>
          <PanelLeft className={cn('w-[20px] h-[20px] text-white')} />
        </div>
      </div>
      {/* 로그인 상태 */}
      <div
        className={cn(
          'w-full',
          'flex flex-col gap-[12px] items-center',
          'mb-[30px] py-[16px] px-[40px]',
          'border border-gray-500 rounded-lg',
        )}>
        <CircleUser className={cn('w-[45px] h-[45px] text-gray-300')} />
        <h2 className="typo-1 text-white">비로그인 상태</h2>
        <button
          type="button"
          className={cn(
            'px-[24px] py-[8px]',
            'flex gap-[8px] items-center',
            'cursor-pointer bg-white rounded-lg hover:bg-gray-300',
            'typo-1 text-black-text',
            'transition-color duration-100',
          )}>
          <LogIn className={cn('w-[20px] h-[20px]')} />
          로그인
        </button>
      </div>
      {/* 탭 추가 */}
      <div
        className={cn(
          'w-full',
          'flex justify-between items-center',
          'px-[5px] py-[5px] mb-[8px] rounded-lg hover:bg-gray-600',
        )}>
        <div className={cn('flex gap-[8px] items-center')}>
          <FolderOpen className={cn('w-[25px] h-[25px] text-gray-300')} />
          <p className={cn('typo-1 text-gray-300')}>탭 목록</p>
        </div>
        <TabButton />
      </div>
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <TabList />
        </ScrollArea>
      </div>
    </aside>
  );
}

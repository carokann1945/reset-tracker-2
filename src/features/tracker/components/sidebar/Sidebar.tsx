import { PanelLeft, CircleUser, LogIn, FolderOpen } from 'lucide-react';
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
        'fixed top-0 left-0',
        'bg-[#faf9f4] text-custom-black border-r border-gray-300',
        'translate-x-full',
        'transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
      {/* 사이트 로고 */}
      <div className={cn('w-full h-[40px]', 'flex justify-between items-center', 'mb-[30px] px-[15px] py-[25px]')}>
        <div
          className={cn('w-[120px]', 'flex items-center gap-[8px]', 'cursor-pointer')}
          onClick={() => window.location.reload()}>
          <h1 className={cn('typo-second')}>Carokann</h1>
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
      {/* 탭 추가 */}
      <div className={cn('w-full max-w-[299px] min-h-0', 'flex flex-col flex-1', 'pl-[10px]')}>
        <div
          className={cn(
            'w-full max-w-[275px]',
            'flex justify-between items-center',
            'px-[5px] py-[5px] mb-[8px] rounded-lg hover:bg-custom-sidebar-hover',
          )}>
          <div className={cn('flex gap-[8px] items-center', 'text-custom-black-light')}>
            <FolderOpen className={cn('w-[20px] h-[20px]')} />
            <p className={cn('typo-common')}>탭 목록</p>
          </div>
          <TabButton />
        </div>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <TabList />
          </ScrollArea>
        </div>
      </div>

      {/* 로그인 정보 */}
      <div
        className={cn(
          'w-full h-[64px]',
          'flex justify-between items-center',
          'border-t border-gray-300 shrink-0 px-[15px]',
        )}>
        <div className={cn('flex gap-[8px] items-center')}>
          <figure>
            <CircleUser className={cn('w-[40px] h-[40px] text-custom-black-light')} />
          </figure>
          <div className={cn('flex flex-col gap-[6px]', 'typo-common text-custom-black-light')}>
            <span className={cn('text-[14px]')}>비로그인 상태</span>
            <span className={cn('text-[12px] text-gray-400')}>무료 요금제</span>
          </div>
        </div>
        <div
          className={cn(
            'cursor-pointer w-[30px] h-[30px]',
            'flex justify-center items-center',
            'hover:bg-custom-sidebar-hover rounded-lg',
          )}>
          <LogIn className={cn('w-[20px] h-[20px] text-custom-black-light')} />
        </div>
      </div>
    </aside>
  );
}

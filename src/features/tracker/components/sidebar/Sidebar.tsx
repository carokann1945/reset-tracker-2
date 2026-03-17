import TabList from './TabList';
import { cn } from '@/lib/utils';
import { PanelLeft } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import TabButton from './TabButton';
import { useSidebarStore } from '../../model/sidebarStore';

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
        'bg-white text-black border border-gray-200',
        'translate-x-full',
        'transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
      {/* 사이트 로고 */}
      <div className={cn('w-full h-[40px]', 'flex justify-between items-center', 'mb-[20px]')}>
        <div className={cn('w-[250px]', 'flex items-center gap-[8px]')}>
          <figure className={cn('w-[30px] h-[30px]', 'relative')}>
            <Image src="/images/cube.svg" alt="site logo" fill className={cn('object-cover')} />
          </figure>
          <h1 className={cn('typo-2')}>Reset Tracker</h1>
        </div>
        <div
          className={cn(
            'w-[30px] h-[30px] rounded-md',
            'flex justify-center items-center',
            'cursor-pointer hover:bg-gray-100',
            'transition-color duration-100',
          )}
          onClick={() => setIsOpen(!isOpen)}>
          <PanelLeft className={cn('w-[20px] h-[20px] text-gray-700')} />
        </div>
      </div>
      {/* 로그인 상태 */}
      <div className={cn('w-full', 'flex justify-between items-center', 'mb-[20px]')}>
        <h2 className="typo-2">비로그인 상태</h2>
      </div>
      {/* 탭 추가 */}
      <div
        className={cn('w-full', 'flex justify-between items-center', 'px-[5px] py-[5px] rounded-md hover:bg-gray-100')}>
        <p className={cn('typo-1')}>탭 목록</p>
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

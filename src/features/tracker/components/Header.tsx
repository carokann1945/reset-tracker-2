import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '../model/sidebarStore';
import { useTabStore, selectActiveTabName } from '../model/tabStore';

export default function Header() {
  const activeTabName = useTabStore(selectActiveTabName);
  const isOpen = useSidebarStore((store) => store.isOpen);
  const setIsOpen = useSidebarStore((store) => store.setIsOpen);

  return (
    <header
      className={cn(
        'z-10 w-full max-w-[1200px] min-h-[70px]',
        'flex items-center gap-[8px]',
        'px-[24px] pt-[24px] xl:px-[48px] xl:pt-[100px] mx-auto mb-[20px]',
        'bg-silver-custom',
      )}>
      <div
        className={cn(
          'w-[30px] h-[30px] rounded-md',
          'flex justify-center items-center',
          'cursor-pointer hover:bg-gray-100',
          'transition-color duration-100',
          isOpen ? 'hidden' : '',
        )}
        onClick={() => setIsOpen(!isOpen)}>
        <PanelLeft className={cn('w-[20px] h-[20px] text-gray-700')} />
      </div>
      <h1 className={cn('typo-3 text-[24px] md:text-[32px] text-black-text')}>{activeTabName}</h1>
    </header>
  );
}

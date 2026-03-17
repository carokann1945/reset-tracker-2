import { cn } from '@/lib/utils';
import { PanelLeft } from 'lucide-react';
import { useTabStore, selectActiveTabName } from '../model/tabStore';

type HeaderProps = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

export default function Header({ isOpen, setIsOpen }: HeaderProps) {
  const activeTabName = useTabStore(selectActiveTabName);
  return (
    <header
      className={cn(
        'z-10 min-h-[70px]',
        'flex items-center gap-[8px]',
        'pl-[16px] py-[18px]',
        'bg-white text-black border border-gray-200',
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
      <h1 className={cn('typo-2')}>{activeTabName}</h1>
    </header>
  );
}

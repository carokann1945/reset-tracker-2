'use client';

import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type TabDropdownMenuProps = {
  tabName: string;
  onRename: () => void;
  onDelete: () => void;
};

export default function TabDropdownMenu({ tabName, onRename, onDelete }: TabDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${tabName} 메뉴 열기`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'w-[30px] h-[30px]',
            'flex justify-center items-center shrink-0',
            'md:opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-gray-600 hover:bg-gray-600',
            'cursor-pointer rounded-md',
            'text-gray-300',
          )}>
          <MoreHorizontal className={cn('w-[25px] h-[15px]')} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onRename}>수정</DropdownMenuItem>
        <DropdownMenuItem onSelect={onDelete}>삭제</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

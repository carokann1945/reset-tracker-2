'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Tab } from '../../model/types';
import { useTabStore } from '../../model/tabStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GripVertical, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SubmitEventHandler, MouseEvent } from 'react';
import { useSidebarStore, handleTabSelect } from '../../model/sidebarStore';

type TabItemProps = {
  tab: Tab;
};

export default function TabItem({ tab }: TabItemProps) {
  const {} = useSidebarStore();
  const { state, deleteTab, renameTab } = useTabStore();
  const isActive = state.activeTabId === tab.id;
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingRenameOpen, setPendingRenameOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (!pendingRenameOpen || menuOpen) return;
    const frameId = window.requestAnimationFrame(() => {
      setRenameDialogOpen(true);
      setPendingRenameOpen(false);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [menuOpen, pendingRenameOpen]);

  const handleMenuClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

  const handleRenameDialogOpenChange = (nextOpen: boolean) => {
    setRenameDialogOpen(nextOpen);
    if (!nextOpen) {
      setDraftName('');
      setPendingRenameOpen(false);
    }
  };

  const handleRename = () => {
    setDraftName(tab.name);
    setPendingRenameOpen(true);
    setMenuOpen(false);
  };

  const handleRenameSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const trimmedName = draftName.trim();
    if (!trimmedName) return;
    renameTab(tab.id, trimmedName);
    handleRenameDialogOpenChange(false);
  };

  const handleDelete = () => {
    deleteTab(tab.id);
  };

  return (
    <Dialog open={renameDialogOpen} onOpenChange={handleRenameDialogOpenChange}>
      <li
        onClick={() => handleTabSelect(tab.id)}
        ref={setNodeRef}
        style={style}
        className={cn(
          'group w-full max-w-[255px]',
          'py-[4px] pl-[10px]',
          'flex justify-between items-center',
          'rounded-md cursor-pointer',
          'typo-1 text-start',
          !isActive && 'hover:bg-gray-100',
          isActive ? 'bg-accent-blue/10 text-accent-blue' : 'bg-white text-black',
          isDragging && 'z-10 bg-white shadow-sm ring-1 ring-accent-blue/20',
        )}>
        <div className={cn('min-w-0 flex items-center gap-[6px]')}>
          <button
            {...attributes}
            {...listeners}
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`${tab.name} 순서 변경`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'w-[18px] h-[18px]',
              'flex justify-center items-center shrink-0',
              'cursor-grab active:cursor-grabbing touch-none',
              'text-gray-400',
            )}>
            <GripVertical className={cn('w-[14px] h-[14px]')} />
          </button>
          <span className={cn('truncate')}>{tab.name}</span>
        </div>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${tab.name} 메뉴 열기`}
              onClick={handleMenuClick}
              className={cn(
                'w-[30px] h-[30px]',
                'flex justify-center items-center shrink-0',
                'md:opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-gray-200 hover:bg-gray-200',
                'cursor-pointer rounded-md',
              )}>
              <MoreHorizontal className={cn('w-[25px] h-[15px]')} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={handleRename}>수정</DropdownMenuItem>
            <DropdownMenuItem onSelect={handleDelete}>삭제</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
      <DialogContent>
        <form onSubmit={handleRenameSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>탭 이름 수정</DialogTitle>
            <DialogDescription>변경할 탭 이름을 입력하세요.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="탭 이름"
            aria-label="탭 이름"
          />
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => handleRenameDialogOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!draftName.trim()}>
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

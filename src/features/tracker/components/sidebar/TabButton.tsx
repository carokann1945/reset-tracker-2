'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTabStore } from '../../model/tabStore';
import { cn } from '@/lib/utils';
import type { SubmitEventHandler } from 'react';
import { useState } from 'react';

export default function TabButton() {
  const { addTab } = useTabStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    setName('');
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    addTab(trimmedName);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-[35px] h-[35px]',
            'rounded-md',
            'cursor-pointer',
            'hover:bg-gray-200',
            'transition-color duration-100',
          )}>
          +
        </button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>새 탭 만들기</DialogTitle>
            <DialogDescription>추가할 탭 이름을 입력하세요.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="탭 이름"
            aria-label="탭 이름"
          />
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

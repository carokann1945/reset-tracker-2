'use client';

import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { SubmitEventHandler } from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type TabDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
  title: string;
  description: string;
  submitLabel: string;
  defaultName?: string;
};

export default function TabDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  submitLabel,
  defaultName = '',
}: TabDialogProps) {
  const [name, setName] = useState(defaultName);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onSubmit(name.trim());
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'w-[calc(100%-32px)] max-w-[400px]',
            'p-[16px] sm:p-[24px]',
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-51',
            'rounded-xl sm:rounded-4xl border border-[#dbd6ca] bg-[#fffdfa] shadow-[0_20px_60px_rgba(0,0,0,0.08)]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          )}>
          <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
          <form onSubmit={handleSubmit} className="flex flex-col gap-[16px] sm:gap-[20px]">
            <div className="flex items-center justify-between gap-[16px]">
              <DialogPrimitive.Title className="pt-[4px] text-[18px] sm:text-[20px] font-[900] text-black-text">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="닫기"
                  className={cn(
                    'w-[34px] h-[34px] sm:w-[36px] sm:h-[36px]',
                    'flex justify-center items-center rounded-full text-black-text/65 transition-colors',
                    'hover:bg-black/5 hover:text-black-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/30',
                  )}>
                  <X className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
                </button>
              </DialogPrimitive.Close>
            </div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="탭 이름"
              aria-label="탭 이름"
              className={cn(
                'w-full h-[40px] sm:h-[56px] rounded-xl border border-[#cbc6bb] bg-white px-[16px] text-[16px] text-black-text outline-none',
                'placeholder:text-black-text/55 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
              )}
            />
            <div className="flex justify-center sm:justify-end gap-[12px] pt-[4px]">
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className={cn(
                    'px-[16px] sm:px-[28px] py-[12px] sm:py-[14px]',
                    'rounded-xl border border-[#cbc6bb] bg-white text-[16px] font-[500] text-black-text transition-colors',
                    'hover:bg-[#f5f2ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/30',
                  )}>
                  취소
                </button>
              </DialogPrimitive.Close>
              <button
                type="submit"
                disabled={!name.trim()}
                className={cn(
                  'px-[16px] sm:px-[28px] py-[12px] sm:py-[14px]',
                  'rounded-[14px] border border-[#cbc6bb] bg-[#f3f0e7] text-[16px] font-[700] text-black-text transition-colors',
                  'hover:bg-[#ebe4d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/30',
                  'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#f3f0e7]',
                )}>
                {submitLabel}
              </button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTabStore, selectActiveTab } from '../model/tabStore';
import { useTaskStore } from '../model/taskStore';
import TaskDialog from './task/TaskDialog';

export default function Header() {
  const activeTab = useTabStore(selectActiveTab);
  const addTask = useTaskStore((store) => store.addTask);
  const tabHydrated = useTabStore((store) => store.hydrated);
  const taskHydrated = useTaskStore((store) => store.hydrated);
  const isReady = tabHydrated && taskHydrated;
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          'z-10 w-full max-w-[1200px] min-h-[70px]',
          'flex justify-between items-center gap-[8px]',
          'px-[24px] pt-[70px] xl:px-[48px] xl:pt-[100px] mx-auto mb-[20px]',
          'bg-custom-main-bg',
        )}>
        <h1 className={cn('typo-first text-[24px] md:text-[32px] text-custom-black')}>
          {isReady ? (
            (activeTab?.name ?? '선택된 탭 없음')
          ) : (
            <span className="block h-[32px] w-[180px] animate-pulse rounded-md bg-[#e8e5da]" />
          )}
        </h1>
        <button
          type="button"
          disabled={!isReady || !activeTab}
          onClick={() => {
            if (!isReady || !activeTab) return;
            setTaskDialogOpen(true);
          }}
          className={cn(
            'rounded-lg px-[12px] py-[12px]',
            'border border-gray-300',
            'typo-1 text-[14px] text-custom-black-light',
            'transition-color duration-100',
            activeTab ? 'cursor-pointer hover:bg-custom-sidebar-hover' : 'cursor-not-allowed bg-gray-300',
          )}>
          {isReady ? '+ 추가' : '불러오는 중...'}
        </button>
      </header>

      {taskDialogOpen && (
        <TaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          onSubmit={(draft) => {
            if (!activeTab?.id) {
              setTaskDialogOpen(false);
              return;
            }
            addTask(activeTab.id, draft);
          }}
        />
      )}
    </>
  );
}

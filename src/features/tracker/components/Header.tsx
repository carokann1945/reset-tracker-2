import { PanelLeft } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '../model/sidebarStore';
import { useTabStore, selectActiveTab } from '../model/tabStore';
import { useTaskStore } from '../model/taskStore';
import TaskDialog from './task/TaskDialog';

export default function Header() {
  const activeTab = useTabStore(selectActiveTab);
  const isOpen = useSidebarStore((store) => store.isOpen);
  const setIsOpen = useSidebarStore((store) => store.setIsOpen);
  const addTask = useTaskStore((store) => store.addTask);
  const tabHydrated = useTabStore((store) => store.hydrated);
  const taskHydrated = useTaskStore((store) => store.hydrated);
  const isReady = tabHydrated && taskHydrated;
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const isMounted = useSidebarStore((store) => store.isMounted);
  const isClosing = useSidebarStore((store) => store.isClosing);
  const shouldShowPanelLeft = isMounted && !isOpen && !isClosing;

  return (
    <>
      {shouldShowPanelLeft && (
        <button
          type="button"
          className={cn(
            'fixed top-[16px] left-[16px] z-20',
            'w-[30px] h-[30px] rounded-md',
            'flex justify-center items-center',
            'cursor-pointer hover:bg-gray-100',
            'transition-colors duration-100',
          )}
          onClick={() => setIsOpen(true)}>
          <PanelLeft className={cn('w-[20px] h-[20px] text-gray-700')} />
        </button>
      )}
      <header
        className={cn(
          'z-10 w-full max-w-[1200px] min-h-[70px]',
          'flex justify-between items-center gap-[8px]',
          'px-[24px] pt-[70px] xl:px-[48px] xl:pt-[100px] mx-auto mb-[20px]',
          'bg-silver-custom',
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

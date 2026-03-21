import { PanelLeft } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '../model/sidebarStore';
import { useTabStore, selectActiveTabName } from '../model/tabStore';
import { useTaskStore } from '../model/taskStore';
import TaskDialog from './task/TaskDialog';

export default function Header() {
  const activeTabName = useTabStore(selectActiveTabName);
  const activeTabId = useTabStore((store) => store.state.activeTabId);
  const addTask = useTaskStore((store) => store.addTask);
  const isOpen = useSidebarStore((store) => store.isOpen);
  const setIsOpen = useSidebarStore((store) => store.setIsOpen);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          'z-10 w-full max-w-[1200px] min-h-[70px]',
          'flex justify-between items-center gap-[8px]',
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
        <button
          type="button"
          disabled={!activeTabId}
          onClick={() => {
            if (!activeTabId) return;
            setTaskDialogOpen(true);
          }}
          className={cn(
            'rounded-lg px-[12px] py-[12px]',
            'typo-1 text-[14px] text-white',
            'transition-color duration-100',
            activeTabId ? 'cursor-pointer bg-accent-blue hover:bg-accent-hover' : 'cursor-not-allowed bg-gray-300',
          )}>
          + 추가
        </button>
      </header>

      {taskDialogOpen && (
        <TaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          onSubmit={(draft) => {
            if (!activeTabId) {
              setTaskDialogOpen(false);
              return;
            }
            addTask(activeTabId, draft);
          }}
        />
      )}
    </>
  );
}

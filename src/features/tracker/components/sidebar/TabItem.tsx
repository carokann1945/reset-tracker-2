'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { handleTabSelect } from '../../model/sidebarStore';
import { useTabStore } from '../../model/tabStore';
import type { Tab } from '../../model/types';
import TabDialog from './TabDialog';
import TabDropdownMenu from './TabDropdownMenu';

type TabItemProps = {
  tab: Tab;
};

export default function TabItem({ tab }: TabItemProps) {
  const { state, renameTab, deleteTab } = useTabStore();
  const isActive = state.activeTabId === tab.id;
  const [tabDialogOpen, setTabDialogOpen] = useState(false);

  // dnd-kit
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
  });

  return (
    <>
      <li
        onClick={() => handleTabSelect(tab.id)}
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        className={cn(
          'group w-full max-w-[255px]',
          'py-[4px] pl-[10px]',
          'flex justify-between items-center',
          'rounded-md cursor-pointer',
          'typo-1 text-start',
          !isActive && 'hover:bg-gray-100',
          isActive ? 'bg-accent-blue/10 text-accent-blue' : 'bg-white text-black',
          isDragging && 'relative z-10 bg-white shadow-sm ring-1 ring-accent-blue/20',
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
        <TabDropdownMenu
          tabName={tab.name}
          onRename={() => setTabDialogOpen(true)}
          onDelete={() => deleteTab(tab.id)}
        />
      </li>
      {tabDialogOpen && (
        <TabDialog
          open={tabDialogOpen}
          onOpenChange={setTabDialogOpen}
          onSubmit={(name) => renameTab(tab.id, name)}
          title="탭 이름 수정"
          description="변경할 탭 이름을 입력하세요."
          submitLabel="저장"
          defaultName={tab.name}
        />
      )}
    </>
  );
}

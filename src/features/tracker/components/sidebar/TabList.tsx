'use client';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTabStore } from '../../model/tabStore';
import { cn } from '@/lib/utils';
import TabItem from './TabItem';

type TabListProps = {
  onTabSelect: (tabId: string) => void;
};

export default function TabList({ onTabSelect }: TabListProps) {
  const { state, reorderTabs } = useTabStore();

  const tabs = [...state.tabs].sort((a, b) => a.position - b.position);
  const tabIds = tabs.map((tab) => tab.id);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = tabIds.findIndex((tabId) => tabId === active.id);
    const newIndex = tabIds.findIndex((tabId) => tabId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    reorderTabs(arrayMove(tabIds, oldIndex, newIndex));
  };

  return (
    <div className={cn('pr-[15px]')}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tabIds} strategy={verticalListSortingStrategy}>
          <ul>
            {tabs.map((tab) => (
              <TabItem key={tab.id} tab={tab} onTabSelect={onTabSelect} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

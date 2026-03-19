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
import { cn } from '@/lib/utils';
import { useTabStore } from '../../model/tabStore';
import { useTaskStore } from '../../model/taskStore';
import TaskItem from './TaskItem';

export default function TaskList() {
  const activeTabId = useTabStore((store) => store.state.activeTabId);
  const taskState = useTaskStore((store) => store.state);
  const reorderTasks = useTaskStore((store) => store.reorderTasks);

  const tasks = activeTabId
    ? taskState.tasks.filter((task) => task.tabId === activeTabId).sort((a, b) => a.position - b.position)
    : [];
  const taskIds = tasks.map((task) => task.id);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!activeTabId || !over || active.id === over.id) return;

    const oldIndex = taskIds.findIndex((taskId) => taskId === active.id);
    const newIndex = taskIds.findIndex((taskId) => taskId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    reorderTasks(activeTabId, arrayMove(taskIds, oldIndex, newIndex));
  };

  if (!activeTabId) {
    return (
      <div
        className={cn(
          'max-w-[1200px]',
          'rounded-xl border border-dashed border-gray-500 bg-white px-[20px] py-[32px]',
          'text-center text-gray-500',
          'mx-auto',
        )}>
        <p className={cn('typo-2 text-gray-700')}>표시할 작업이 없습니다.</p>
        <p className={cn('mt-[6px] text-sm')}>탭을 선택하거나 새 탭을 만들어 작업을 시작하세요.</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div
        className={cn(
          'max-w-[1200px]',
          'rounded-xl border border-dashed border-gray-500 bg-white px-[20px] py-[32px]',
          'text-center text-gray-500',
          'mx-auto',
        )}>
        <p className={cn('typo-2 text-gray-700')}>아직 작업이 없습니다.</p>
        <p className={cn('mt-[6px] text-sm')}>상단 +create 버튼으로 첫 작업을 추가해보세요.</p>
      </div>
    );
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <ul className={cn('space-y-[8px]')}>
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

import { toast } from 'sonner';
import { useTaskStore } from '../model/taskStore';
import type { Task } from '../model/types';

export function useDeleteTask() {
  const deleteTask = useTaskStore((store) => store.deleteTask);
  const restoreTask = useTaskStore((store) => store.restoreTask);

  const handleDelete = (task: Task) => {
    deleteTask(task.id);

    toast(`${task.title} - 삭제됨`, {
      duration: 4000,
      action: {
        label: '복구',
        onClick: () => restoreTask(task),
      },
    });
  };

  return { handleDelete };
}

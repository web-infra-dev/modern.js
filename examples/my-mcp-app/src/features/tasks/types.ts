export type TaskStatus = 'todo' | 'in_progress' | 'done';
export interface Task {
  id: string;
  createdAt?: string;
  title: string;
  status: TaskStatus;
}

export const statusLabels: Record<TaskStatus, string> = {
  todo: '待办',
  in_progress: '进行中',
  done: '已完成',
};

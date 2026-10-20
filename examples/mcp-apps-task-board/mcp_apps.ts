import { defineMcpServer } from '@modern-js/mcp-apps/config';
import { name, version } from './package.json';
import {
  createTask,
  listTasks,
  updateTask,
} from './src/features/tasks/server/tools';

export default defineMcpServer({
  name,
  version,
  tools: [
    { ...listTasks, view: { module: './src/features/tasks/TaskBoard.tsx' } },
    createTask,
    updateTask,
  ],
});

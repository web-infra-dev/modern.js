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
    { ...createTask, view: { module: './src/features/tasks/TaskBoard.tsx' } },
    { ...updateTask, view: { module: './src/features/tasks/TaskBoard.tsx' } },
    {
      name: 'greet',
      description: 'Greet someone.',
      inputSchema: {
        name: { type: 'string', minLength: 1 },
      },
      annotations: { readOnlyHint: true },
      handler: async ({ name }) => {
        const message = `Hello, ${name}!`;
        return {
          content: [{ type: 'text', text: message }],
          structuredContent: { message },
          viewProps: { message },
        };
      },
      visibility: ['model', 'app'],
      view: { module: './src/components/Greeting.tsx' },
    },
    {
      name: 'add_numbers',
      description: 'Add two numbers.',
      inputSchema: {
        a: { type: 'number' },
        b: { type: 'number' },
      },
      annotations: { readOnlyHint: true },
      handler: ({ a, b }) => {
        const sum = a + b;
        return {
          content: [{ type: 'text', text: `${a} + ${b} = ${sum}` }],
          structuredContent: { a, b, sum },
          viewProps: { a, b, sum },
        };
      },
      visibility: ['model', 'app'],
      view: { module: './src/components/Sum.tsx' },
    },
  ],
});

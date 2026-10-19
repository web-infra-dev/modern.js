import { defineMcpServer, defineTool } from '@modern-js/mcp-apps/config';
import { name, version } from './package.json';
import {
  createTask,
  listTasks,
  updateTask,
} from './src/features/tasks/server/tools';

export default defineMcpServer({
  name,
  version,
  // Tool remote names match module-federation.config.ts.
  // The plugin discovers local manifest URLs from build output.
  // Configure remotes explicitly only for externally hosted MF applications.
  tools: [
    { ...listTasks, remote: 'mcp_ui', view: { module: './TaskBoard' } },
    { ...createTask, remote: 'mcp_ui', view: { module: './TaskBoard' } },
    { ...updateTask, remote: 'mcp_ui', view: { module: './TaskBoard' } },
    defineTool({
      name: 'greet',
      description: 'Greet someone.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string', minLength: 1 } },
        required: ['name'],
        additionalProperties: false,
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
      remote: 'mcp_ui',
      visibility: ['model', 'app'],
      view: { module: './Greeting' },
    }),
    defineTool({
      name: 'add_numbers',
      description: 'Add two numbers.',
      inputSchema: {
        type: 'object',
        properties: { a: { type: 'number' }, b: { type: 'number' } },
        required: ['a', 'b'],
        additionalProperties: false,
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
      remote: 'mcp_ui',
      visibility: ['model', 'app'],
      view: { module: './Sum' },
    }),
  ],
});

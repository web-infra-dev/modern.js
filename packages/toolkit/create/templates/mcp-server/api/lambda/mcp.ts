import { McpServer } from '@modelcontextprotocol/server';
import { createBffHandlers } from '@modern-js/mcp-apps/server';
import { z } from 'zod';
import { listTodos, addTodo } from '../server/store';

function createServer() {
  const server = new McpServer({ name: 'todo-mcp', version: '1.0.0' });
  server.registerTool(
    'list_todos',
    {
      description: 'List todos.',
      inputSchema: z.object({}),
    },
    async () => ({
      content: [{ type: 'text', text: 'Todo list opened.' }],
      structuredContent: { todos: listTodos() },
    }),
  );
  server.registerTool(
    'add_todo',
    {
      description: 'Add a todo.',
      inputSchema: z.object({ title: z.string().min(1) }),
    },
    async ({ title }) => ({
      content: [{ type: 'text', text: `Added: ${title}` }],
      structuredContent: { todo: addTodo(title) },
    }),
  );
  return server;
}
export const { POST, GET, DELETE } = createBffHandlers(createServer);

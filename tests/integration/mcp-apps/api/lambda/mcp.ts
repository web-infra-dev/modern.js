import { McpServer } from '@modelcontextprotocol/server';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import {
  createBffHandlers,
  loadUiManifest,
  registerUiResources,
} from '@modern-js/mcp-apps/server';
import { z } from 'zod';
import { listTodos, addTodo } from '../server/store';

async function createServer(request: Request) {
  const server = new McpServer({ name: 'todo-mcp', version: '1.0.0' });
  const manifest = await loadUiManifest();
  const ui = registerUiResources(server, manifest, { request });
  registerAppTool(
    server,
    'list_todos',
    {
      description: 'List todos and open the todo card.',
      inputSchema: z.object({}),
      _meta: { ui: { resourceUri: ui.todos } },
    },
    async () => ({
      content: [{ type: 'text', text: 'Todo list opened.' }],
      structuredContent: { todos: listTodos() },
    }),
  );
  registerAppTool(
    server,
    'local_todos',
    {
      description: 'Local todo card.',
      inputSchema: z.object({}),
      _meta: { ui: { resourceUri: ui.local } },
    },
    async () => ({ content: [], structuredContent: { todos: listTodos() } }),
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

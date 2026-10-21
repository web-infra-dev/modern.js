import { defineMcpServer } from '@modern-js/mcp-apps/config';
import { addTodo, deleteTodo, listTodos, updateTodo } from './server/store';
import { name, version } from '../package.json';

export default defineMcpServer({
  name,
  version,
  tools: [
    {
      name: 'list_todos',
      description: 'List all todos.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      handler: () => {
        const todos = listTodos();
        return {
          content: [{ type: 'text', text: JSON.stringify(todos) }],
          structuredContent: { todos },
        };
      },
    },
    {
      name: 'add_todo',
      description: 'Add a todo with a non-empty title.',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 120,
            pattern: '\\S',
          },
        },
        required: ['title'],
        additionalProperties: false,
      },
      handler: ({ title }) => {
        const todo = addTodo(title);
        return {
          content: [{ type: 'text', text: `Added: ${todo.title}` }],
          structuredContent: { todo },
        };
      },
    },
    {
      name: 'update_todo',
      description:
        'Edit a todo title or set its completion status using its ID from list_todos.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1 },
          completed: { type: 'boolean' },
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 120,
            pattern: '\\S',
          },
        },
        required: ['id'],
        minProperties: 2,
        additionalProperties: false,
      },
      annotations: { destructiveHint: false, idempotentHint: true },
      handler: ({ id, title, completed }) => {
        const todo = updateTodo(id, { title, completed });
        return todo
          ? {
              content: [
                {
                  type: 'text',
                  text: `Updated: ${todo.title} (${todo.completed ? 'completed' : 'active'})`,
                },
              ],
              structuredContent: { todo },
            }
          : {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: 'Todo not found. Refresh the list and try again.',
                },
              ],
            };
      },
    },
    {
      name: 'delete_todo',
      description: 'Delete a todo using its ID from list_todos.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', minLength: 1 } },
        required: ['id'],
        additionalProperties: false,
      },
      annotations: { destructiveHint: true, idempotentHint: true },
      handler: ({ id }) => {
        const todo = deleteTodo(id);
        return todo
          ? {
              content: [{ type: 'text', text: `Deleted: ${todo.title}` }],
              structuredContent: { todo },
            }
          : {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: 'Todo not found. Refresh the list and try again.',
                },
              ],
            };
      },
    },
  ],
});

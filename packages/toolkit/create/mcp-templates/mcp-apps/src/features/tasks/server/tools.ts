import { randomUUID } from 'node:crypto';
import { defineTool } from '@modern-js/mcp-apps/config';
import { taskOperation } from './store';

async function result(change?: Parameters<typeof taskOperation>[0]) {
  try {
    const tasks = await taskOperation(change);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(tasks) }],
      structuredContent: { tasks },
      viewProps: { tasks },
    };
  } catch (error) {
    console.error('Task operation failed', error);
    return {
      isError: true,
      content: [
        { type: 'text' as const, text: '任务操作失败，请刷新列表确认状态。' },
      ],
    };
  }
}
export const listTasks = defineTool({
  name: 'list_tasks',
  description: '读取服务端保存的共享演示任务列表。',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: () => result(),
});
export const createTask = defineTool({
  name: 'create_task',
  description: '创建并保存任务，由服务端生成 ID 和创建时间。',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 120, pattern: '\\S' },
    },
    required: ['title'],
    additionalProperties: false,
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
  handler: ({ title }) =>
    result(tasks => {
      if (tasks.length >= 100) throw new Error('Task limit reached');
      tasks.push({
        id: randomUUID(),
        title: title.trim(),
        status: 'todo',
        createdAt: new Date().toISOString(),
      });
    }),
});
export const updateTask = defineTool({
  name: 'update_task',
  description: '通过服务端任务 ID 更新任务状态并保存。',
  inputSchema: {
    id: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: ({ id, status }) =>
    result(tasks => {
      const task = tasks.find(item => item.id === id);
      if (!task) throw new Error('Task not found');
      task.status = status;
    }),
});

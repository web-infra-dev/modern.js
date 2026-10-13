import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Task } from '../types';

// Shared demo board, serialized within one server process. Use a database for multiple instances.
let queue: Promise<unknown> = Promise.resolve();
export function taskOperation(
  change?: (tasks: Task[]) => void,
): Promise<Task[]> {
  const operation = queue.then(async () => {
    const filename =
      process.env.MCP_TASKS_FILE ?? path.resolve('.mcp-demo/tasks.json');
    let tasks: Task[];
    try {
      tasks = JSON.parse(await readFile(filename, 'utf8')) as Task[];
      if (!Array.isArray(tasks)) throw new Error('Invalid task store');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      tasks = [];
    }
    if (change) {
      change(tasks);
      await mkdir(path.dirname(filename), { recursive: true });
      const temporary = `${filename}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(tasks, null, 2));
      await rename(temporary, filename);
    }
    return tasks;
  });
  queue = operation.catch(() => undefined);
  return operation;
}

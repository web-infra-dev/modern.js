import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from '@rstest/core';
import { taskOperation } from '../templates/mcp-apps/src/features/tasks/server/store';

it('persists serialized task writes and reads the file again on every query', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mcp-task-store-'));
  const previous = process.env.MCP_TASKS_FILE;
  const filename = path.join(directory, 'tasks.json');
  process.env.MCP_TASKS_FILE = filename;
  try {
    expect(await taskOperation()).toEqual([]);
    await Promise.all(
      ['one', 'two'].map(id =>
        taskOperation(tasks => {
          tasks.push({
            id,
            title: id,
            status: 'todo',
            createdAt: '2026-10-13T00:00:00.000Z',
          });
        }),
      ),
    );
    expect((await taskOperation()).map(task => task.id)).toEqual([
      'one',
      'two',
    ]);
    await taskOperation(tasks => {
      tasks[0].status = 'done';
    });
    expect(JSON.parse(await readFile(filename, 'utf8'))[0].status).toBe('done');
    await expect(
      taskOperation(() => {
        throw new Error('not found');
      }),
    ).rejects.toThrow('not found');
    expect((await taskOperation())[0].status).toBe('done');
    await writeFile(filename, '[]');
    expect(await taskOperation()).toEqual([]);
  } finally {
    if (previous === undefined) delete process.env.MCP_TASKS_FILE;
    else process.env.MCP_TASKS_FILE = previous;
    await rm(directory, { recursive: true, force: true });
  }
});

import { parseTasks } from './helper';
import { prebundle } from './prebundle';

async function run() {
  const parsedTasks = await parseTasks();

  for (const task of parsedTasks) {
    await prebundle(task);
  }
}

run();

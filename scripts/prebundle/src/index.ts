import { parseTasks } from './helper';
import { prebundle } from './prebundle';

async function run() {
  const parsedTasks = parseTasks();

  for (const task of parsedTasks) {
    await prebundle(task);
  }
}

run();

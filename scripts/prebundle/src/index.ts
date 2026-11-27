import { parseTasks } from './helper';
import { prebundle } from './prebundle';

async function run() {
  const parsedTasks = await parseTasks(process.argv[2]);

  for (const task of parsedTasks) {
    await prebundle(task);
  }
}

run();

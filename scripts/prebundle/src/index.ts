import { parseTasks } from './helper';
import { prebundle } from './prebundle';

const [, , packageName] = process.argv;

async function run() {
  const parsedTasks = parseTasks();
  for (const task of parsedTasks) {
    if (!packageName || task.packageName === packageName) {
      await prebundle(task);
    }
  }
}

run();

import { argv } from 'process';
import { parseTasks } from './helper';
import { prebundle } from './prebundle';

async function run() {
  let parsedTasks = await parseTasks();

  const startIndex = argv.findIndex(x =>
    parsedTasks.some(y => y.packageName === x),
  );
  if (startIndex !== -1) {
    const pkgs = argv.slice(startIndex);
    parsedTasks = parsedTasks.filter(x => pkgs.includes(x.packageName));
  }

  for (const task of parsedTasks) {
    await prebundle(task);
  }
}

run();

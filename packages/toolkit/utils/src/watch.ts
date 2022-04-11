import * as path from 'path';
import { chokidar } from './compiled';

export type WatchChangeTypeValueT = 'add' | 'unlink' | 'change';

export const WatchChangeType: Record<
  'ADD' | 'UNLINK' | 'CHANGE',
  WatchChangeTypeValueT
> = {
  ADD: 'add',
  UNLINK: 'unlink',
  CHANGE: 'change',
};

type RunTaskType = (option: {
  changedFilePath: string;
  changeType: WatchChangeTypeValueT;
}) => void | Promise<void>;

export const watch = (
  watchDir: string | string[],
  runTask: RunTaskType,
  ignored: string[] = [],
) => {
  let ready = false;
  const watcher = chokidar.watch(watchDir, {
    ignored,
  });

  watcher.on('ready', () => (ready = true));

  watcher.on('change', async filePath => {
    const changedFilePath = path.resolve(filePath);
    await runTask({ changedFilePath, changeType: WatchChangeType.CHANGE });
  });

  watcher.on('add', async filePath => {
    const changedFilePath = path.resolve(filePath);
    if (ready) {
      await runTask({ changedFilePath, changeType: WatchChangeType.ADD });
    }
  });

  watcher.on('unlink', async filePath => {
    const changedFilePath = path.resolve(filePath);
    await runTask({ changedFilePath, changeType: WatchChangeType.UNLINK });
  });

  watcher.on('error', err => {
    throw err;
  });

  return watcher;
};

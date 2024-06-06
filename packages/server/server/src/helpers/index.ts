import path from 'path';
import {
  SERVER_BUNDLE_DIRECTORY,
  SERVER_DIR,
  WatchOptions,
  logger,
} from '@modern-js/utils';
import {
  AGGRED_DIR,
  ServerBase,
  FileChangeEvent,
} from '@modern-js/server-core';
import Watcher, { WatchEvent, mergeWatchOptions } from '../dev-tools/watcher';
import { debug } from './utils';
import { registerMockHandlers } from './mock';

export * from './repack';
export * from './devOptions';
export * from './fileReader';
export * from './mock';

async function onServerChange({
  pwd,
  filepath,
  event,
  server,
}: {
  pwd: string;
  filepath: string;
  event: WatchEvent;
  server: ServerBase;
}) {
  const { mock } = AGGRED_DIR;
  const mockPath = path.normalize(path.join(pwd, mock));

  const { runner } = server;
  if (filepath.startsWith(mockPath)) {
    await registerMockHandlers({
      pwd,
      server,
    });
    logger.info('Finish registering the mock handlers');
  } else {
    try {
      const fileChangeEvent: FileChangeEvent = {
        type: 'file-change',
        payload: [{ filename: filepath, event }],
      };

      await runner.reset({
        event: fileChangeEvent,
      });
      debug(`Finish reload server, trigger by ${filepath} ${event}`);
    } catch (e) {
      logger.error(e as Error);
    }
  }
}

export function startWatcher({
  pwd,
  distDir,
  apiDir,
  sharedDir,
  watchOptions,
  server,
}: {
  pwd: string;
  distDir: string;
  apiDir: string;
  sharedDir: string;
  watchOptions?: WatchOptions;
  server: ServerBase;
}) {
  const { mock } = AGGRED_DIR;
  const defaultWatched = [
    `${mock}/**/*`,
    `${SERVER_DIR}/**/*`,
    `${apiDir}/**`,
    `${sharedDir}/**/*`,
    `${distDir}/${SERVER_BUNDLE_DIRECTORY}/*-server-loaders.js`,
  ];

  const mergedWatchOptions = mergeWatchOptions(watchOptions);

  const defaultWatchedPaths = defaultWatched.map(p => {
    const finalPath = path.isAbsolute(p) ? p : path.join(pwd, p);
    return path.normalize(finalPath);
  });

  const watcher = new Watcher();
  watcher.createDepTree();
  watcher.listen(defaultWatchedPaths, mergedWatchOptions, (filepath, event) => {
    // TODO: should delete this cache in onRepack
    if (filepath.includes('-server-loaders.js')) {
      delete require.cache[filepath];
    } else {
      watcher.updateDepTree();
      watcher.cleanDepCache(filepath);
    }

    onServerChange({
      pwd,
      filepath,
      event,
      server,
    });
  });

  return watcher;
}

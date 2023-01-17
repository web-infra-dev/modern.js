import crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { isDev, isTest, createDebugger, chokidar } from '@modern-js/utils';
import type { CliHooksRunner, IAppContext } from '../types';

const debug = createDebugger('watch-files');

const hashMap = new Map<string, string>();

const md5 = (data: string) =>
  crypto.createHash('md5').update(data).digest('hex');

export const createFileWatcher = async (
  appContext: IAppContext,
  hooksRunner: CliHooksRunner,
  // eslint-disable-next-line consistent-return
) => {
  // only add fs watcher on dev mode.
  if (isDev() || isTest()) {
    const { appDirectory } = appContext;
    const extraFiles = await hooksRunner.watchFiles();
    const watched = extraFiles.filter(Boolean);
    debug(`watched: %o`, watched);
    const watcher = chokidar.watch(watched, {
      cwd: appDirectory,
      ignoreInitial: true,
      ignorePermissionErrors: true,
      ignored: [
        /node_modules/,
        '**/__test__/**',
        '**/*.test.(js|jsx|ts|tsx)',
        '**/*.spec.(js|jsx|ts|tsx)',
        '**/*.stories.(js|jsx|ts|tsx)',
      ],
    });

    watcher.on('change', changed => {
      const lastHash = hashMap.get(changed);
      const currentHash = md5(
        fs.readFileSync(path.join(appDirectory, changed), 'utf8'),
      );
      if (currentHash !== lastHash) {
        debug(`file change: %s`, changed);
        hashMap.set(changed, currentHash);
        hooksRunner.fileChange({ filename: changed, eventType: 'change' });
      }
    });

    watcher.on('add', name => {
      debug(`add file: %s`, name);
      const currentHash = md5(
        fs.readFileSync(path.join(appDirectory, name), 'utf8'),
      );
      hashMap.set(name, currentHash);
      hooksRunner.fileChange({ filename: name, eventType: 'add' });
    });

    watcher.on('unlink', name => {
      debug(`remove file: %s`, name);
      if (hashMap.has(name)) {
        hashMap.delete(name);
      }
      hooksRunner.fileChange({ filename: name, eventType: 'unlink' });
    });

    watcher.on('error', err => {
      throw err;
    });
    return watcher;
  }
};

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { isDev, chokidar, createDebugger, isTest } from '@modern-js/utils';
import { LoadedConfig } from './config';
import { HooksRunner } from './manager';

const debug = createDebugger('watch-files');

const md5 = (data: string) =>
  crypto.createHash('md5').update(data).digest('hex');

const hashMap = new Map<string, string>();

export const initWatcher = async (
  loaded: LoadedConfig,
  appDirectory: string,
  configDir: string | undefined,
  hooksRunner: HooksRunner,
  argv: string[],
  // eslint-disable-next-line consistent-return
) => {
  // only add fs watcher on dev mode.
  if ((isDev() || isTest()) && argv[0] === 'dev') {
    const extraFiles = await hooksRunner.watchFiles();

    const configPath = path.join(appDirectory, configDir!);

    const watched = [
      `${configPath}/html`,
      ...extraFiles,
      loaded?.filePath,
      ...loaded.dependencies,
    ].filter(Boolean);

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

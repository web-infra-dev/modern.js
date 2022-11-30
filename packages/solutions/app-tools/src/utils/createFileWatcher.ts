import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  isDev,
  chokidar,
  createDebugger,
  isTest,
  getServerConfig,
} from '@modern-js/utils';
import { IAppContext, ToRunners } from '@modern-js/core';
import { AppToolsHooks } from '../types/hooks';

/**
 * Get user config from package.json.
 * @param appDirectory - App root directory.
 * @returns modernConfig or undefined
 */
// FIXME: read package.json again;
const getPackageConfig = <T>(
  appDirectory: string,
  packageJsonConfig?: string,
) => {
  const PACKAGE_JSON_CONFIG_NAME = 'modernConfig';
  const json = JSON.parse(
    fs.readFileSync(path.resolve(appDirectory, './package.json'), 'utf8'),
  );

  return json[packageJsonConfig ?? PACKAGE_JSON_CONFIG_NAME] as T | undefined;
};

const addServerConfigToDeps = async (
  dependencies: string[],
  appDirectory: string,
  serverConfigFile: string,
) => {
  const serverConfig = await getServerConfig(appDirectory, serverConfigFile);
  if (serverConfig) {
    dependencies.push(serverConfig);
  }
};

const debug = createDebugger('watch-files');

const md5 = (data: string) =>
  crypto.createHash('md5').update(data).digest('hex');

const hashMap = new Map<string, string>();

export const createFileWatcher = async (
  appContext: IAppContext,
  configDir: string | undefined,
  hooksRunner: ToRunners<AppToolsHooks>,
  // eslint-disable-next-line consistent-return
) => {
  // only add fs watcher on dev mode.
  if (isDev() || isTest()) {
    const { appDirectory, configFile } = appContext;

    const extraFiles = await hooksRunner.watchFiles();

    const configPath = path.join(appDirectory, configDir!);

    const dependencies: string[] = getPackageConfig(
      appContext.appDirectory,
      appContext.packageName,
    )
      ? [path.resolve(appDirectory, './package.json')]
      : [];

    // 将 server.config 加入到 loaded.dependencies，以便对文件监听做热更新
    await addServerConfigToDeps(
      dependencies,
      appContext.appDirectory,
      appContext.serverConfigFile,
    );

    const watched = [
      `${configPath}/html`,
      ...extraFiles,
      ...dependencies,
      configFile,
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

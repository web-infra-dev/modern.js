import fs from 'fs';
import path from 'path';
import {
  findExists,
  ensureAbsolutePath,
  JS_EXTENSIONS,
} from '@modern-js/utils';
import type { Entrypoint } from '@modern-js/types';
import type {
  AppNormalizedConfig,
  AppTools,
  IAppContext,
  PluginAPI,
} from '../../types';
import { INDEX_FILE_NAME } from './constants';
import { isDefaultExportFunction } from './isDefaultExportFunction';

export type { Entrypoint };

const hasIndex = (dir: string) =>
  findExists(
    JS_EXTENSIONS.map(ext => path.resolve(dir, `${INDEX_FILE_NAME}${ext}`)),
  );

const isBundleEntry = async (
  api: PluginAPI<AppTools<'shared'>>,
  dir: string,
) => {
  const hookRunners = api.useHookRunners();
  return (
    (
      await hookRunners.checkEntryPoint({
        path: dir,
        entry: false,
      })
    ).entry || hasIndex(dir)
  );
};

const scanDir = (
  api: PluginAPI<AppTools<'shared'>>,
  dirs: string[],
): Promise<Entrypoint[]> =>
  Promise.all(
    dirs.map(async (dir: string) => {
      const indexFile = hasIndex(dir);
      const customBootstrap = isDefaultExportFunction(indexFile)
        ? indexFile
        : false;

      const entryName = path.basename(dir);

      if (indexFile && !customBootstrap) {
        return {
          entryName,
          isMainEntry: false,
          entry: indexFile,
          absoluteEntryDir: path.resolve(dir),
          isAutoMount: false,
          customBootstrap,
        };
      }

      const entryFile = await isBundleEntry(api, dir);
      if (entryFile) {
        return {
          entryName,
          isMainEntry: false,
          entry: entryFile,
          absoluteEntryDir: path.resolve(dir),
          isAutoMount: true,
          customBootstrap,
        };
      }
      return {
        entryName,
        isMainEntry: false,
        entry: indexFile as string,
        absoluteEntryDir: path.resolve(dir),
        isAutoMount: false,
      };
    }),
  );

export const getFileSystemEntry = async (
  api: PluginAPI<AppTools<'shared'>>,
  appContext: IAppContext,
  config: AppNormalizedConfig<'shared'>,
): Promise<Entrypoint[]> => {
  const { appDirectory } = appContext;

  const {
    source: { entriesDir, disableEntryDirs },
  } = config;

  let disabledDirs: string[] = [];
  if (disableEntryDirs && Array.isArray(disableEntryDirs)) {
    disabledDirs = disableEntryDirs?.map(dir =>
      ensureAbsolutePath(appDirectory, dir),
    );
  }
  const src = ensureAbsolutePath(appDirectory, entriesDir || '');

  if (fs.existsSync(src)) {
    if (fs.statSync(src).isDirectory()) {
      if (await isBundleEntry(api, src)) {
        return scanDir(api, [src]);
      }
      const dirs: string[] = [];
      await Promise.all(
        fs.readdirSync(src).map(async filename => {
          const file = path.join(src, filename);
          if (
            fs.statSync(file).isDirectory() &&
            (await isBundleEntry(api, file)) &&
            !disabledDirs.includes(file)
          ) {
            dirs.push(file);
          }
        }),
      );
      return scanDir(api, dirs);
    } else {
      throw Error(`source.entriesDir accept a directory.`);
    }
  } else {
    throw Error(`src dir ${entriesDir} not found.`);
  }
};

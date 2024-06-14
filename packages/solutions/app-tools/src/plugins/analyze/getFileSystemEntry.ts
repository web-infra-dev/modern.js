import fs from 'fs';
import path from 'path';
import {
  findExists,
  ensureAbsolutePath,
  JS_EXTENSIONS,
} from '@modern-js/utils';
import type { Entrypoint } from '@modern-js/types';
import { CliHooksRunner } from '@modern-js/core';
import type { AppNormalizedConfig, AppTools, IAppContext } from '../../types';
import { ENTRY_FILE_NAME, INDEX_FILE_NAME } from './constants';
import { isDefaultExportFunction } from './isDefaultExportFunction';

export type { Entrypoint };

// compatible index entry
const hasIndex = (dir: string) =>
  findExists(
    JS_EXTENSIONS.map(ext => path.resolve(dir, `${INDEX_FILE_NAME}${ext}`)),
  );

// new entry
const hasEntry = (dir: string) =>
  findExists(
    JS_EXTENSIONS.map(ext => path.resolve(dir, `${ENTRY_FILE_NAME}${ext}`)),
  );

const isBundleEntry = async (
  hookRunners: CliHooksRunner<AppTools<'shared'>>,
  dir: string,
) => {
  return (
    (
      await hookRunners.checkEntryPoint({
        path: dir,
        entry: false,
      })
    ).entry ||
    hasEntry(dir) ||
    hasIndex(dir)
  );
};

const scanDir = (
  hookRunners: CliHooksRunner<AppTools<'shared'>>,
  dirs: string[],
): Promise<Entrypoint[]> =>
  Promise.all(
    dirs.map(async (dir: string) => {
      const indexFile = hasIndex(dir);
      const customBootstrap = isDefaultExportFunction(indexFile)
        ? indexFile
        : false;

      const entryName = path.basename(dir);
      const customEntryFile = hasEntry(dir);

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

      const entryFile = (
        await hookRunners.checkEntryPoint({
          path: dir,
          entry: false,
        })
      ).entry;
      if (entryFile) {
        return {
          entryName,
          isMainEntry: false,
          entry: customEntryFile || entryFile,
          absoluteEntryDir: path.resolve(dir),
          isAutoMount: true,
          customBootstrap,
          customEntry: customEntryFile,
        };
      }
      if (customEntryFile) {
        return {
          entryName,
          isMainEntry: false,
          entry: customEntryFile,
          absoluteEntryDir: path.resolve(dir),
          isAutoMount: false,
          customEntry: customEntryFile,
        };
      }
      throw Error('There is no valid entry point in the current project!');
    }),
  );

export const getFileSystemEntry = async (
  hookRunners: CliHooksRunner<AppTools<'shared'>>,
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
      if (await isBundleEntry(hookRunners, src)) {
        return scanDir(hookRunners, [src]);
      }
      const dirs: string[] = [];
      await Promise.all(
        fs.readdirSync(src).map(async filename => {
          const file = path.join(src, filename);
          if (
            fs.statSync(file).isDirectory() &&
            (await isBundleEntry(hookRunners, file)) &&
            !disabledDirs.includes(file)
          ) {
            dirs.push(file);
          }
        }),
      );
      return scanDir(hookRunners, dirs);
    } else {
      throw Error(`source.entriesDir accept a directory.`);
    }
  } else {
    throw Error(`src dir ${entriesDir} not found.`);
  }
};

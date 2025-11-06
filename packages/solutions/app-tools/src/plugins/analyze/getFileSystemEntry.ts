import fs from 'fs';
import path from 'path';
import type { Entrypoint } from '@modern-js/types';
import {
  JS_EXTENSIONS,
  ensureAbsolutePath,
  findExists,
} from '@modern-js/utils';
import type { AppNormalizedConfig } from '../../types';
import type { AppToolsContext, AppToolsHooks } from '../../types/plugin';
import { ENTRY_FILE_NAME } from './constants';

export type { Entrypoint };

export const hasEntry = (dir: string) =>
  findExists(
    JS_EXTENSIONS.map(ext => path.resolve(dir, `${ENTRY_FILE_NAME}${ext}`)),
  );

export const hasServerEntry = (dir: string) =>
  findExists(
    JS_EXTENSIONS.map(ext =>
      path.resolve(dir, `${ENTRY_FILE_NAME}.server${ext}`),
    ),
  );

const isBundleEntry = async (hooks: AppToolsHooks, dir: string) => {
  const { entry } = await hooks.checkEntryPoint.call({
    path: dir,
    entry: false,
  });
  if (entry) {
    return entry;
  }
  const customEntry = hasEntry(dir);
  if (customEntry) {
    return customEntry;
  }
  return false;
};

const scanDir = async (
  hooks: AppToolsHooks,
  dirs: string[],
): Promise<Entrypoint[]> => {
  const entries = await Promise.all(
    dirs.map(async (dir: string) => {
      const entryName = path.basename(dir);
      const customEntryFile = hasEntry(dir);
      const customServerEntry = hasServerEntry(dir);

      const entryFile = (
        await hooks.checkEntryPoint.call({
          path: dir,
          entry: false,
        })
      ).entry;

      if (entryFile) {
        return {
          entryName,
          isMainEntry: false,
          entry: customEntryFile || entryFile,
          customServerEntry,
          absoluteEntryDir: path.resolve(dir),
          isAutoMount: true,
          customEntry: Boolean(customEntryFile),
        };
      }

      if (customEntryFile) {
        return {
          entryName,
          isMainEntry: false,
          entry: customEntryFile,
          customServerEntry,
          absoluteEntryDir: path.resolve(dir),
          isAutoMount: false,
          customEntry: Boolean(customEntryFile),
        };
      }

      return false;
    }),
  ).then(entries => entries.filter(Boolean) as Entrypoint[]);
  if (entries.length === 0) {
    throw Error('There is no valid entry point in the current project!');
  }
  return entries;
};

export const getFileSystemEntry = async (
  hooks: AppToolsHooks,
  appContext: AppToolsContext,
  config: AppNormalizedConfig,
): Promise<Entrypoint[]> => {
  const { appDirectory } = appContext;

  const {
    source: { entriesDir },
  } = config;

  const src = ensureAbsolutePath(appDirectory, entriesDir || '');

  if (fs.existsSync(src)) {
    if (fs.statSync(src).isDirectory()) {
      if (await isBundleEntry(hooks, src)) {
        return scanDir(hooks, [src]);
      }
      const dirs: string[] = [];
      await Promise.all(
        fs.readdirSync(src).map(async filename => {
          const file = path.join(src, filename);
          if (
            fs.statSync(file).isDirectory() &&
            (await isBundleEntry(hooks, file))
          ) {
            dirs.push(file);
          }
        }),
      );
      return scanDir(hooks, dirs);
    } else {
      throw Error(`source.entriesDir accept a directory.`);
    }
  } else {
    throw Error(`src dir ${entriesDir} not found.`);
  }
};

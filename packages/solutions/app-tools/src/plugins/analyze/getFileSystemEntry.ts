import fs from 'fs';
import path from 'path';
import type { Entrypoint } from '@modern-js/types';
import {
  JS_EXTENSIONS,
  ensureAbsolutePath,
  findExists,
} from '@modern-js/utils';
import type { AppTools, AppToolsContext } from '../../new/types';
import type { AppNormalizedConfig } from '../../types';
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

const hasServerEntry = (dir: string) =>
  findExists(
    JS_EXTENSIONS.map(ext =>
      path.resolve(dir, `${ENTRY_FILE_NAME}.server${ext}`),
    ),
  );

const isBundleEntry = async (
  api: AppTools<'shared'>,
  dir: string,
  enableCustomEntry?: boolean,
) => {
  const hooks = api.getHooks();
  const { entry } = (await hooks.checkEntryPoint.call({
    path: dir,
    entry: false,
  })) as any;
  if (entry) {
    return entry;
  }
  const customEntry = hasEntry(dir);
  if (enableCustomEntry && customEntry) {
    return customEntry;
  }
  return hasIndex(dir);
};

const scanDir = async (
  api: AppTools<'shared'>,
  dirs: string[],
  enableCustomEntry?: boolean,
): Promise<Entrypoint[]> => {
  const hooks = api.getHooks();
  const entries = await Promise.all(
    dirs.map(async (dir: string) => {
      const indexFile = hasIndex(dir);
      const customBootstrap = isDefaultExportFunction(indexFile)
        ? indexFile
        : false;

      const entryName = path.basename(dir);
      const customEntryFile = hasEntry(dir);
      const customServerEntry = hasServerEntry(dir);

      if (!enableCustomEntry && indexFile && !customBootstrap) {
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
        (await hooks.checkEntryPoint.call({
          path: dir,
          entry: false,
        })) as any
      ).entry;

      if (entryFile) {
        return {
          entryName,
          isMainEntry: false,
          entry: enableCustomEntry ? customEntryFile || entryFile : entryFile,
          customServerEntry,
          absoluteEntryDir: path.resolve(dir),
          isAutoMount: true,
          customBootstrap,
          customEntry: enableCustomEntry ? Boolean(customEntryFile) : false,
        };
      }

      if (enableCustomEntry && customEntryFile) {
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
  api: AppTools<'shared'>,
  appContext: AppToolsContext<'shared'>,
  config: AppNormalizedConfig<'shared'>,
): Promise<Entrypoint[]> => {
  const { appDirectory } = appContext;

  const {
    source: { entriesDir, disableEntryDirs, enableCustomEntry },
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
      if (await isBundleEntry(api, src, enableCustomEntry)) {
        return scanDir(api, [src], enableCustomEntry);
      }
      const dirs: string[] = [];
      await Promise.all(
        fs.readdirSync(src).map(async filename => {
          const file = path.join(src, filename);
          if (
            fs.statSync(file).isDirectory() &&
            (await isBundleEntry(api, file, enableCustomEntry)) &&
            !disabledDirs.includes(file)
          ) {
            dirs.push(file);
          }
        }),
      );
      return scanDir(api, dirs, enableCustomEntry);
    } else {
      throw Error(`source.entriesDir accept a directory.`);
    }
  } else {
    throw Error(`src dir ${entriesDir} not found.`);
  }
};

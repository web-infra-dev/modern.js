import fs from 'fs';
import path from 'path';
import { findExists, ensureAbsolutePath } from '@modern-js/utils';
import type { Entrypoint } from '@modern-js/types';
import type { AppNormalizedConfig, IAppContext } from '../types';
import { isDefaultExportFunction } from './isDefaultExportFunction';
import {
  JS_EXTENSIONS,
  INDEX_FILE_NAME,
  APP_FILE_NAME,
  PAGES_DIR_NAME,
  FILE_SYSTEM_ROUTES_GLOBAL_LAYOUT,
  NESTED_ROUTES_DIR,
} from './constants';

export type { Entrypoint };

const hasIndex = (dir: string) =>
  findExists(
    JS_EXTENSIONS.map(ext => path.resolve(dir, `${INDEX_FILE_NAME}${ext}`)),
  );

const hasApp = (dir: string) =>
  findExists(
    JS_EXTENSIONS.map(ext => path.resolve(dir, `${APP_FILE_NAME}${ext}`)),
  );

const hasPages = (dir: string) => fs.existsSync(path.join(dir, PAGES_DIR_NAME));

const hasNestedRoutes = (dir: string) =>
  fs.existsSync(path.join(dir, NESTED_ROUTES_DIR));

const isBundleEntry = (dir: string) =>
  hasApp(dir) || hasPages(dir) || hasIndex(dir) || hasNestedRoutes(dir);

const scanDir = (dirs: string[]): Entrypoint[] =>
  dirs.map((dir: string) => {
    const indexFile = hasIndex(dir);

    const customBootstrap = isDefaultExportFunction(indexFile)
      ? indexFile
      : false;

    const entryName = path.basename(dir);

    if (indexFile && !customBootstrap) {
      return {
        entryName,
        entry: indexFile,
        absoluteEntryDir: path.resolve(dir),
        isAutoMount: false,
      };
    }

    const isHasApp = hasApp(dir);

    if (isHasApp) {
      return {
        entryName,
        entry: path.join(dir, APP_FILE_NAME),
        isAutoMount: true,
        absoluteEntryDir: path.resolve(dir),
        customBootstrap,
      };
    }

    const isHasNestedRoutes = hasNestedRoutes(dir);
    const isHasPages = hasPages(dir);

    if (isHasNestedRoutes || isHasPages) {
      const entrypoint: Entrypoint = {
        entryName,
        entry: '',
        fileSystemRoutes: {
          globalApp: findExists(
            JS_EXTENSIONS.map(ext =>
              path.resolve(
                dir,
                `./${PAGES_DIR_NAME}/${FILE_SYSTEM_ROUTES_GLOBAL_LAYOUT}${ext}`,
              ),
            ),
          ),
        },
        isAutoMount: true,
        absoluteEntryDir: path.resolve(dir),
        customBootstrap,
      };
      if (isHasPages) {
        entrypoint.entry = path.join(dir, PAGES_DIR_NAME);
        entrypoint.pageRoutesEntry = entrypoint.entry;
      }
      if (isHasNestedRoutes) {
        entrypoint.entry = path.join(dir, NESTED_ROUTES_DIR);
        entrypoint.nestedRoutesEntry = entrypoint.entry;
      }

      return entrypoint;
    }
    return {
      entryName,
      entry: indexFile as string,
      absoluteEntryDir: path.resolve(dir),
      isAutoMount: false,
    };
  });

export const getFileSystemEntry = (
  appContext: IAppContext,
  config: AppNormalizedConfig,
): Entrypoint[] => {
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
      return scanDir(
        isBundleEntry(src)
          ? [src]
          : fs
              .readdirSync(src)
              .map(file => path.join(src, file))
              .filter(
                file =>
                  fs.statSync(file).isDirectory() &&
                  isBundleEntry(file) &&
                  !disabledDirs.includes(file),
              ),
      );
    } else {
      throw Error(`source.entriesDir accept a directory.`);
    }
  } else {
    throw Error(`src dir ${entriesDir} not found.`);
  }
};

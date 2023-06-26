import path from 'path';
import {
  ensureAbsolutePath,
  fs,
  findExists,
  MAIN_ENTRY_NAME,
  isRouterV5,
} from '@modern-js/utils';
import type { Entrypoint } from '@modern-js/types';
import type { AppNormalizedConfig, IAppContext } from '../types';
import { getFileSystemEntry } from './getFileSystemEntry';
import { JS_EXTENSIONS } from './constants';

const ensureExtensions = (file: string) => {
  if (!path.extname(file)) {
    return findExists(JS_EXTENSIONS.map(ext => `${file}${ext}`)) || file;
  }
  return file;
};

/**
 *
 * Lightweight method for whether it is a directory.
 */
const isDirectory = (file: string) => !path.extname(file);

const ifAlreadyExists = (
  entrypoints: Entrypoint[],
  checked: Entrypoint,
): boolean =>
  entrypoints.some(entrypoint => {
    if (
      ensureExtensions(entrypoint.entry) === ensureExtensions(checked.entry)
    ) {
      // reset entryName
      checked.entryName = entrypoint.entryName;
      return true;
    }
    // filesystem routes entrypoint conflict with normal entrypoint.
    if (
      entrypoint.entry.startsWith(checked.entry) ||
      checked.entry.startsWith(entrypoint.entry)
    ) {
      throw new Error(
        `Entry configuration conflicts\n Your configuration: ${checked.entry}.\n Default entrypoint: ${entrypoint.entry}\n Please reset source.entries or set source.disableDefaultEntries to disable the default entry rules.`,
      );
    }

    return false;
  });

export const getBundleEntry = (
  appContext: IAppContext,
  config: AppNormalizedConfig<'shared'>,
) => {
  const { appDirectory, packageName } = appContext;
  const { disableDefaultEntries, entries, entriesDir, mainEntryName } =
    config.source;

  const defaults = disableDefaultEntries
    ? []
    : getFileSystemEntry(appContext, config);

  // merge entrypoints from user config with directory convention.
  if (entries) {
    Object.keys(entries).forEach(name => {
      const value = entries[name];
      const entrypoint: Entrypoint =
        typeof value === 'string'
          ? {
              entryName: name,
              isMainEntry: false,
              entry: ensureAbsolutePath(appDirectory, value),
              absoluteEntryDir: isDirectory(
                ensureAbsolutePath(appDirectory, value),
              )
                ? ensureAbsolutePath(appDirectory, value)
                : path.dirname(ensureAbsolutePath(appDirectory, value)),
              isAutoMount: true,
              fileSystemRoutes: fs
                .statSync(ensureAbsolutePath(appDirectory, value))
                .isDirectory()
                ? {}
                : undefined,
            }
          : {
              entryName: name,
              isMainEntry: false,
              entry: ensureAbsolutePath(appDirectory, value.entry),
              absoluteEntryDir: isDirectory(
                ensureAbsolutePath(appDirectory, value.entry),
              )
                ? ensureAbsolutePath(appDirectory, value.entry)
                : path.dirname(ensureAbsolutePath(appDirectory, value.entry)),
              isAutoMount: !value.disableMount,
              customBootstrap:
                value.customBootstrap &&
                ensureAbsolutePath(appDirectory, value.customBootstrap),
              fileSystemRoutes: fs
                .statSync(ensureAbsolutePath(appDirectory, value.entry))
                .isDirectory()
                ? {}
                : undefined,
            };

      if (entrypoint.fileSystemRoutes && !isRouterV5(config)) {
        entrypoint.nestedRoutesEntry = entrypoint.entry;
      }
      if (!ifAlreadyExists(defaults, entrypoint)) {
        defaults.push(entrypoint);
      }
    });
  }

  if (!disableDefaultEntries) {
    // find main entry point which server route is '/'.
    const entriesDirAbs = ensureAbsolutePath(appDirectory, entriesDir || '');
    const found = defaults.find(
      ({ entryName, entry, nestedRoutesEntry = '' }) =>
        entryName === packageName ||
        path.dirname(entry) === entriesDirAbs ||
        path.dirname(nestedRoutesEntry) === entriesDirAbs,
    );
    if (found) {
      found.entryName = mainEntryName || MAIN_ENTRY_NAME;
      found.isMainEntry = true;
    }
  }
  return defaults;
};

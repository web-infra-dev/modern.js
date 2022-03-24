import path from 'path';
import {
  ensureAbsolutePath,
  fs,
  findExists,
  MAIN_ENTRY_NAME,
} from '@modern-js/utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import type { Entrypoint } from '@modern-js/types';
import { getFileSystemEntry } from './getFileSystemEntry';
import { JS_EXTENSIONS } from './constants';

const ensureExtensions = (file: string) => {
  if (!path.extname(file)) {
    return findExists(JS_EXTENSIONS.map(ext => `${file}${ext}`)) || file;
  }
  return file;
};

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
  config: NormalizedConfig,
) => {
  const { appDirectory, packageName } = appContext;
  const {
    source: { disableDefaultEntries, entries, entriesDir },
  } = config;

  const defaults = disableDefaultEntries
    ? []
    : getFileSystemEntry(appContext, config);

  // merge entrypoints from user config with directory convention.
  if (entries) {
    Object.keys(entries).forEach(name => {
      const value = entries[name];
      const entrypoint =
        typeof value === 'string'
          ? {
              entryName: name,
              entry: ensureAbsolutePath(appDirectory, value),
              isAutoMount: true,
              fileSystemRoutes: fs
                .statSync(ensureAbsolutePath(appDirectory, value))
                .isDirectory()
                ? {}
                : undefined,
            }
          : {
              entryName: name,
              entry: ensureAbsolutePath(appDirectory, value.entry),
              isAutoMount: !value.disableMount,
              fileSystemRoutes: value.enableFileSystemRoutes ? {} : undefined,
            };

      if (!ifAlreadyExists(defaults, entrypoint)) {
        defaults.push(entrypoint);
      }
    });
  }

  // find main entry point which server route is '/'.
  const entriesDirAbs = ensureAbsolutePath(appDirectory, entriesDir!);
  const found = defaults.find(
    ({ entryName, entry }) =>
      entryName === packageName || path.dirname(entry) === entriesDirAbs,
  );
  found && (found.entryName = MAIN_ENTRY_NAME);

  return defaults;
};

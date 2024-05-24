import path from 'path';
import { IAppContext } from '@modern-js/core';
import { Entrypoint } from '@modern-js/types';
import {
  MAIN_ENTRY_NAME,
  ensureAbsolutePath,
  findExists,
  fs,
  chalk,
  inquirer,
} from '@modern-js/utils';
import { AppNormalizedConfig } from '../../types';
import { i18n, localeKeys } from '../../locale';
import { JS_EXTENSIONS, ENTRY_FILE_NAME } from './constants';
import { isSubDirOrEqual } from './utils';

const hasEntry = (dir: string) =>
  findExists(
    JS_EXTENSIONS.map(ext => path.resolve(dir, `${ENTRY_FILE_NAME}${ext}`)),
  );

const isBundleEntry = (dir: string) => hasEntry(dir);

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
      isSubDirOrEqual(entrypoint.entry, checked.entry) ||
      isSubDirOrEqual(checked.entry, entrypoint.entry)
    ) {
      throw new Error(
        `Entry configuration conflicts\n Your configuration: ${checked.entry}.\n Default entrypoint: ${entrypoint.entry}\n Please reset source.entries or set source.disableDefaultEntries to disable the default entry rules.`,
      );
    }

    return false;
  });

const scanDir = (dirs: string[]): Entrypoint[] =>
  dirs.map((dir: string) => {
    const entryFile = hasEntry(dir);
    const entryName = path.basename(dir);
    return {
      entryName,
      isMainEntry: false,
      entry: entryFile as string,
      absoluteEntryDir: path.resolve(dir),
      isAutoMount: true,
    };
  });
export const getFileSystemEntry = (
  appContext: IAppContext,
  config: AppNormalizedConfig<'shared'>,
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

/**
 *
 * Lightweight method for whether it is a directory.
 */
const isDirectory = (file: string) => !path.extname(file);

// 扫描 src 文件夹，获取所有的入口信息
export const getBundleEntry = (
  appContext: IAppContext,
  config: AppNormalizedConfig<'shared'>,
): Entrypoint[] => {
  const { appDirectory, packageName } = appContext;
  const { disableDefaultEntries, entries, entriesDir, mainEntryName } =
    config.source;

  const defaults = disableDefaultEntries
    ? []
    : getFileSystemEntry(appContext, config);

  if (entries) {
    Object.keys(entries).forEach(name => {
      const value = entries[name];
      const entryName = typeof value === 'string' ? value : value.entry;
      const isAutoMount = typeof value === 'string' ? true : value.disableMount;
      const entrypoint: Entrypoint = {
        entryName: name,
        isMainEntry: false,
        entry: ensureAbsolutePath(appDirectory, entryName),
        absoluteEntryDir: isDirectory(
          ensureAbsolutePath(appDirectory, entryName),
        )
          ? ensureAbsolutePath(appDirectory, entryName)
          : path.dirname(ensureAbsolutePath(appDirectory, entryName)),
        isAutoMount,
      };
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

/**
 * Allow user to select entrypoints to build.
 */
export const getSelectedEntries = async (
  entry: string[] | boolean,
  entrypoints: Entrypoint[],
): Promise<string[]> => {
  const entryNames = entrypoints.map(e => e.entryName);

  if (!entry) {
    return entryNames;
  }

  if (typeof entry === 'boolean') {
    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        choices: entryNames,
        message: i18n.t(localeKeys.command.dev.selectEntry),
        validate(answer: string[]) {
          if (answer.length < 1) {
            return i18n.t(localeKeys.command.dev.requireEntry);
          }
          return true;
        },
      },
    ]);

    return selected;
  }

  entry.forEach(name => {
    if (!entryNames.includes(name)) {
      throw new Error(
        `Can not found entry ${chalk.yellow(
          name,
        )}, the entry should be one of ${chalk.yellow(entryNames.join(', '))}`,
      );
    }
  });

  return entry;
};

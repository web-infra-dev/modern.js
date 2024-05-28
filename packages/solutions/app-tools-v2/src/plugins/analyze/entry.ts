import path from 'path';
import type { IAppContext, PluginAPI } from '@modern-js/core';
import { Entrypoint } from '@modern-js/types';
import {
  MAIN_ENTRY_NAME,
  ensureAbsolutePath,
  findExists,
  fs,
  chalk,
  inquirer,
} from '@modern-js/utils';
import { AppNormalizedConfig, AppTools } from '../../types';
import { i18n, localeKeys } from '../../locale';
import { JS_EXTENSIONS, ENTRY_FILE_NAME } from './constants';
import { isSubDirOrEqual } from './utils';

const hasEntry = (dir: string) =>
  findExists(
    JS_EXTENSIONS.map(ext => path.resolve(dir, `${ENTRY_FILE_NAME}${ext}`)),
  );

const isBundleEntry = async (
  api: PluginAPI<AppTools<'shared'>>,
  path: string,
) => {
  const hookRunners = api.useHookRunners();
  return (
    hasEntry(path) ||
    (
      await hookRunners.checkEntryPoint({
        path,
        entry: false,
      })
    ).entry
  );
};

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

const scanDir = async (
  api: PluginAPI<AppTools<'shared'>>,
  dirs: string[],
): Promise<Entrypoint[]> =>
  Promise.all(
    dirs.map(async (dir: string) => {
      const entryFile = await isBundleEntry(api, dir);
      const entryName = path.basename(dir);
      return {
        entryName,
        isMainEntry: false,
        entry: entryFile as string,
        absoluteEntryDir: path.resolve(dir),
        isAutoMount: true,
        isCustomEntry: Boolean(hasEntry(dir)),
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
      console.log(dirs);
      return scanDir(api, dirs);
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
export const getBundleEntry = async (
  api: PluginAPI<AppTools<'shared'>>,
  appContext: IAppContext,
  config: AppNormalizedConfig<'shared'>,
): Promise<Entrypoint[]> => {
  const { appDirectory, packageName } = appContext;
  const { disableDefaultEntries, entries, entriesDir, mainEntryName } =
    config.source;

  const defaults = disableDefaultEntries
    ? []
    : await getFileSystemEntry(api, appContext, config);

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
        isCustomEntry: Boolean(hasEntry(path.join(appDirectory, entryName))),
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

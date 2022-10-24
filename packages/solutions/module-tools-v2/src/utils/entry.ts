import path from 'path';
import { ModuleContext } from '../types';
import type {
  Entry,
  BaseBuildConfig,
  PartialBuildConfig,
} from '../types/config';

interface EntryOptions {
  appDirectory: string;
}

export const getAbsEntry = (entry: Entry, options: EntryOptions) => {
  const { appDirectory } = options;
  // if (typeof entry === 'string') {
  //   return path.join(options.appDirectory, entry);
  // }

  if (Array.isArray(entry)) {
    return entry.map(p =>
      path.isAbsolute(p) ? p : path.join(appDirectory, p),
    );
  }

  const newEntry: Record<string, string> = {};
  for (const key of Object.keys(entry)) {
    newEntry[key] = path.isAbsolute(entry[key])
      ? entry[key]
      : path.join(appDirectory, entry[key]);
  }
  return newEntry;
};

export const addEntryToPreset = async (
  config: PartialBuildConfig,
  context: ModuleContext,
) => {
  if (Array.isArray(config)) {
    for (const c of config) {
      if (c.buildType === 'bundle') {
        c.bundleOptions = {
          ...(c.bundleOptions ?? {}),
          entry: await getDefaultIndexEntry(context),
        };
      } else if (c.buildType === 'bundleless') {
        c.bundlelessOptions = {
          ...(c.bundlelessOptions ?? {}),
          sourceDir: './src',
        };
      }
    }
  } else if (config.buildType === 'bundle') {
    config.bundleOptions = {
      ...(config.bundleOptions ?? {}),
      entry: await getDefaultIndexEntry(context),
    };
  } else if (config.buildType === 'bundleless') {
    config.bundlelessOptions = {
      ...(config.bundlelessOptions ?? {}),
      sourceDir: './src',
    };
  }

  return config;
};

export const getDefaultIndexEntry = async ({
  isTsProject,
  appDirectory,
}: {
  isTsProject: boolean;
  appDirectory: string;
}) => {
  const { fs } = await import('@modern-js/utils');
  let entry = isTsProject
    ? path.join(appDirectory, './src/index.ts')
    : path.join(appDirectory, './src/index.js');
  if (fs.existsSync(entry)) {
    return [`./${path.relative(appDirectory, entry)}`];
  }

  entry = isTsProject
    ? path.join(appDirectory, './src/index.tsx')
    : path.join(appDirectory, './src/index.jsx');
  if (fs.existsSync(entry)) {
    return [`./${path.relative(appDirectory, entry)}`];
  }

  return [];
};

export const transformEntryToAbsPath = async (
  baseConfig: BaseBuildConfig,
  options: EntryOptions,
) => {
  if (baseConfig.buildType === 'bundle' && baseConfig.bundleOptions.entry) {
    baseConfig.bundleOptions.entry = getAbsEntry(
      baseConfig.bundleOptions.entry,
      options,
    );
  }

  return baseConfig;
};

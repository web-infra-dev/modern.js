import path from 'path';
import { ModuleContext } from '../types';
import type {
  Input,
  BaseBuildConfig,
  PartialBuildConfig,
} from '../types/config';

interface EntryOptions {
  appDirectory: string;
}

export const getAbsInput = async (entry: Input, options: EntryOptions) => {
  const { slash } = await import('@modern-js/utils');
  const { appDirectory } = options;

  if (Array.isArray(entry)) {
    return entry.map(p =>
      path.isAbsolute(p) ? slash(p) : slash(path.join(appDirectory, p)),
    );
  }

  const newEntry: Record<string, string> = {};
  for (const key of Object.keys(entry)) {
    newEntry[key] = path.isAbsolute(entry[key])
      ? slash(entry[key])
      : slash(path.join(appDirectory, entry[key]));
  }
  return newEntry;
};

export const addInputToPreset = async (
  config: PartialBuildConfig,
  context: ModuleContext,
) => {
  if (Array.isArray(config)) {
    for (const c of config) {
      if (c.buildType === 'bundle') {
        c.input = await getDefaultIndexEntry(context);
      } else if (c.buildType === 'bundleless') {
        c.sourceDir = './src';
      }
    }
  } else if (config.buildType === 'bundle') {
    config.input = await getDefaultIndexEntry(context);
  } else if (config.buildType === 'bundleless') {
    config.sourceDir = './src';
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

export const normalizeInput = async (
  baseConfig: BaseBuildConfig,
  options: EntryOptions,
) => {
  if (baseConfig.buildType === 'bundleless' && !baseConfig.input) {
    const { slash } = await import('@modern-js/utils');
    return [slash(baseConfig.sourceDir)];
  }
  return getAbsInput(baseConfig.input, options);
};

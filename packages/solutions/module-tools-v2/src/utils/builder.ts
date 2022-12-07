import path from 'path';
import type { BaseBuildConfig } from '../types/config';

export const getFinalExternals = async (
  config: BaseBuildConfig,
  options: { appDirectory: string },
) => {
  const { autoExternal, externals } = config;
  const { appDirectory } = options;

  if (typeof autoExternal === 'boolean') {
    if (!autoExternal) {
      return externals || [];
    }

    const deps = await getAllDeps(appDirectory, {
      dependencies: true,
      peerDependencies: true,
    });
    return [
      ...deps.map(dep => new RegExp(`^${dep}($|\\/|\\\\)`)),
      ...(externals || []),
    ];
  }

  const deps = await getAllDeps(appDirectory, autoExternal);
  return [
    ...deps.map(dep => new RegExp(`^${dep}($|\\/|\\\\)`)),
    ...(externals || []),
  ];
};

export const getAllDeps = async <T>(
  appDirectory: string,
  options: {
    dependencies?: boolean;
    peerDependencies?: boolean;
  } = {},
) => {
  const { fs } = await import('@modern-js/utils');
  try {
    const json = JSON.parse(
      fs.readFileSync(path.resolve(appDirectory, './package.json'), 'utf8'),
    );

    let deps: string[] = [];

    if (options.dependencies) {
      deps = [
        ...deps,
        ...Object.keys((json.dependencies as T | undefined) || {}),
      ];
    }

    if (options.peerDependencies) {
      deps = [
        ...deps,
        ...Object.keys((json.peerDependencies as T | undefined) || {}),
      ];
    }

    return deps;
  } catch (e) {
    console.warn('[WARN] package.json is broken');
    return [];
  }
};

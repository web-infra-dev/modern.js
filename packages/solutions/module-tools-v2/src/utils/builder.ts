import path from 'path';
import type { BaseBundleBuildConfig } from '../types/config';

export const getFinalExternals = async (
  config: BaseBundleBuildConfig,
  options: { appDirectory: string },
) => {
  const {
    bundleOptions: { skipDeps, externals },
  } = config;
  const { appDirectory } = options;

  if (typeof skipDeps === 'boolean') {
    if (!skipDeps) {
      return externals || [];
    }

    const deps = await getAllDeps(appDirectory, {
      dependencies: true,
      devDependencies: true,
      peerDependencies: true,
    });
    return [
      ...deps.map(dep => new RegExp(`^${dep}($|\\/|\\\\)`)),
      ...(externals || []),
    ];
  }

  const deps = await getAllDeps(appDirectory, skipDeps);
  return [
    ...deps.map(dep => new RegExp(`^${dep}($|\\/|\\\\)`)),
    ...(externals || []),
  ];
};

export const getAllDeps = async <T>(
  appDirectory: string,
  options: {
    dependencies?: boolean;
    devDependencies?: boolean;
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

    if (options.devDependencies) {
      deps = [
        ...deps,
        ...Object.keys((json.devDependencies as T | undefined) || {}),
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

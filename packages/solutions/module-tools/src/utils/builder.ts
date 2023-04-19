import path from 'path';
import { logger } from '@modern-js/utils/logger';
import type { BaseBuildConfig, ExternalHelpers } from '../types/config';

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
    logger.warn('package.json is broken');
    return [];
  }
};

export const checkSwcHelpers = async (options: {
  appDirectory: string;
  externalHelpers: ExternalHelpers;
}) => {
  const { appDirectory, externalHelpers } = options;
  if (
    (typeof externalHelpers === 'object' &&
      externalHelpers.disableHelpersCheck) ||
    externalHelpers === false
  ) {
    return;
  }
  const deps = await getAllDeps(appDirectory, {
    dependencies: true,
    devDependencies: true,
  });
  const swcHelpersPkgName = '@swc/helpers';
  if (!deps.includes(swcHelpersPkgName)) {
    const local = await import('../locale');
    throw new Error(local.i18n.t(local.localeKeys.errors.externalHelpers));
  }
};

import path from 'path';
import { logger } from '@modern-js/utils/logger';
import type {
  BaseBuildConfig,
  ExternalHelpers,
  BuildType,
  Format,
  Target,
} from '../types/config';

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
  if (externalHelpers === false) {
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

export const matchSwcTransformCondition = (condtionOptions: {
  sourceType: 'commonjs' | 'module';
  buildType: BuildType;
  format: Format;
  disableSwcTransform?: boolean;
}) => {
  const { sourceType, buildType, format, disableSwcTransform } =
    condtionOptions;

  if (disableSwcTransform) {
    return false;
  }

  // 1. source code is esm
  // 2. bundleless
  // 3. bundle and format is esm

  if (sourceType === 'commonjs') {
    return false;
  }

  if (buildType === 'bundleless') {
    return true;
  }

  if (format === 'esm' || format === 'iife') {
    // when format is iife, swc-transform only transform syntax, esbuild transform js format.
    return true;
  }

  // bundle only use esbuild-transform in cjs format, because have some limitations
  // eg: treeshaking

  return false;
};

export const matchEs5PluginCondition = (condtionOptions: {
  sourceType: 'commonjs' | 'module';
  buildType: BuildType;
  format: Format;
  target: Target;
  disableSwcTransform?: boolean;
}) => {
  const { sourceType, buildType, format, target, disableSwcTransform } =
    condtionOptions;

  // dist is es5
  if (target !== 'es5') {
    return false;
  }

  // when use disbaleSwcTransform option, we must be use es5Plugin when target is es5
  if (disableSwcTransform) {
    return true;
  }

  // only use esbuild-transform, so need es5Plugin
  if (sourceType === 'commonjs') {
    return true;
  }

  // when source code is esm and dist is bundle + cjs, we can`t use swc-transform.
  // so we only use esbuild-transform and es5Plugin
  if (buildType === 'bundle' && format === 'cjs') {
    return true;
  }

  return false;
};

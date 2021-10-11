import {
  getBabelConfig,
  getModuleBabelChain,
} from '@modern-js/babel-preset-module';
import { TransformOptions } from '@babel/core';
import { applyOptionsChain, getAlias } from '@modern-js/utils';
import { NormalizedConfig } from '@modern-js/core';
import type { BabelChain } from '@modern-js/babel-chain';
import { IPackageModeValue, ModuleToolsConfig } from '../types';

export const getFinalAlias: any = (
  modernConfig: NormalizedConfig,
  option: { appDirectory: string; tsconfigPath: string; sourceAbsDir: string },
) => {
  const aliasConfig = getAlias(modernConfig.source.alias, option);
  // 排除内部别名，因为不需要处理
  const finalPaths: Record<string, string | string[]> = {};
  const internalAliasPrefix = '@modern-js/runtime';
  if (aliasConfig.paths && typeof aliasConfig.paths === 'object') {
    const pathsKey = Object.keys(aliasConfig.paths);
    for (const key of pathsKey) {
      if (!key.includes(internalAliasPrefix)) {
        finalPaths[key] = aliasConfig.paths[key];
      }
    }
  }

  aliasConfig.paths = finalPaths;
  return aliasConfig;
};

export const resolveBabelConfig = (
  appDirectory: string,
  modernConfig: NormalizedConfig,
  option: Pick<IPackageModeValue, 'syntax' | 'type'> & {
    sourceAbsDir: string;
    tsconfigPath: string;
  },
) => {
  const {
    source: { envVars, globalVars, jsxTransformRuntime = 'automatic' },
    output: { importStyle },
    tools: { lodash: userLodashOption },
  } = modernConfig as ModuleToolsConfig;

  // alias config
  const aliasConfig = getFinalAlias(modernConfig, {
    appDirectory,
    ...option,
  });

  // lodash config
  const lodashOptions = applyOptionsChain(
    { id: ['lodash', 'ramda'] },
    // TODO: 需要处理类型问题
    userLodashOption as any,
  );
  // babel config
  const internalBabelConfig = getBabelConfig(
    {
      appDirectory,
      enableReactPreset: true,
      enableTypescriptPreset: true,
      alias: aliasConfig,
      envVars,
      globalVars,
      lodashOptions,
      jsxTransformRuntime,
      importStyle,
    },
    {
      type: option.type,
      syntax: option.syntax,
    },
  );

  // Preventing warning when files are too large
  internalBabelConfig.compact = false;

  const babelChain = getModuleBabelChain(
    {
      appDirectory,
      enableReactPreset: true,
      enableTypescriptPreset: true,
      alias: aliasConfig,
      envVars,
      globalVars,
      lodashOptions,
      jsxTransformRuntime,
      importStyle,
    },
    {
      type: option.type,
      syntax: option.syntax,
    },
  );
  const userBabelConfig = modernConfig.tools.babel;
  return applyOptionsChain<TransformOptions, { chain: BabelChain }>(
    internalBabelConfig,
    // TODO: 感觉 userBabelConfig 的类型应该是TransformOptions
    userBabelConfig as any,
    { chain: babelChain },
  );
};

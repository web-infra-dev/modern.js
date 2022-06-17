import path from 'path';
import { SpeedyBundler } from '@speedy-js/speedy-core';
import type { CLIConfig } from '@speedy-js/speedy-types';
import type { PluginAPI } from '@modern-js/core';
import { applyOptionsChain, ensureAbsolutePath } from '@modern-js/utils';
import { NormalizedBundleBuildConfig } from '../types';
import { ModuleBuildError } from '../error';

export type ResolveAlias = { [index: string]: string };
export const getAlias = (api: PluginAPI) => {
  const { appDirectory, srcDirectory } = api.useAppContext();
  const { source } = api.useResolvedConfigContext();
  // TODO: maybe check tsconfig `paths`
  const defaultAlias = {
    '@': srcDirectory,
  };

  const alias = applyOptionsChain<ResolveAlias, undefined>(
    defaultAlias,
    source?.alias as ResolveAlias,
  );

  return Object.keys(alias).reduce((o, name) => {
    return {
      ...o,
      [name]: ensureAbsolutePath(appDirectory, alias[name]),
    };
  }, {});
};
export const getDefine = (api: PluginAPI) => {
  const {
    source: { envVars, globalVars },
  } = api.useResolvedConfigContext();
  const envVarsDefine = ['NODE_ENV', ...(envVars || [])].reduce<
    Record<string, string>
  >((memo, name) => {
    memo[`process.env.${name}`] = JSON.stringify(process.env[name]);
    return memo;
  }, {});
  const globalVarsDefine = Object.keys(globalVars || {}).reduce<
    Record<string, string>
  >((memo, name) => {
    memo[name] = globalVars ? JSON.stringify(globalVars[name]) : '';
    return memo;
  }, {});

  return {
    ...envVarsDefine,
    ...globalVarsDefine,
  };
};

export const runSpeedy = async (
  api: PluginAPI,
  config: NormalizedBundleBuildConfig,
) => {
  const { appDirectory } = api.useAppContext();
  const {
    output: { path: distPath = 'dist', disableSourceMap },
    tools: { speedy: userSpeedyConfig },
  } = api.useResolvedConfigContext();
  const { target, watch, bundleOptions, outputPath, format, sourceMap } =
    config;
  const { entry, platform, splitting, minify, externals } = bundleOptions;
  const distDir = path.join(appDirectory, distPath, outputPath);
  const alias = getAlias(api);
  const define = getDefine(api);
  const internalSpeedyConfig: CLIConfig = {
    command: 'build',
    mode: 'production',
    html: false,
    preset: 'webapp', // support css and json
    platform,
    watch,
    input: entry,
    target,
    output: {
      path: distDir,
      format,
      splitting,
      filename: '[name]',
    },
    resolve: { alias },
    define,
    // TODO: disableSourceMap will remove at next version
    sourceMap: disableSourceMap ? false : sourceMap,
    minify,
    external: externals,
  };
  const speedyConfig = applyOptionsChain(
    internalSpeedyConfig,
    userSpeedyConfig,
  );
  const compiler = await SpeedyBundler.create(speedyConfig);
  try {
    await compiler.build();
  } catch (e) {
    throw new ModuleBuildError(e);
  }
};

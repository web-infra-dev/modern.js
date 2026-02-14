import { type RsbuildConfig, mergeRsbuildConfig } from '@rsbuild/core';
import type { ExtendConfig } from '@rstest/core';

export function toRstestExtendConfig(
  config: any,
  environmentName?: string,
): ExtendConfig {
  const { environments, ...rawBuildConfig } = config;

  const environmentConfig = environmentName
    ? environments?.[environmentName]
    : undefined;

  const rsbuildConfig = environmentConfig
    ? mergeRsbuildConfig<RsbuildConfig>(
        rawBuildConfig as RsbuildConfig,
        environmentConfig as RsbuildConfig,
      )
    : (rawBuildConfig as RsbuildConfig);

  // Allow modification of rsbuild config
  const finalBuildConfig = rsbuildConfig;

  const { rspack, swc, bundlerChain } = finalBuildConfig.tools || {};
  const { cssModules, target, module } = finalBuildConfig.output || {};
  const { decorators, define, include, exclude, tsconfigPath } =
    finalBuildConfig.source || {};

  // Convert rsbuild config to rstest config
  const rstestConfig: ExtendConfig = {
    root: finalBuildConfig.root,
    name: environmentName,
    plugins: finalBuildConfig.plugins,
    source: {
      decorators,
      define,
      include,
      exclude,
      tsconfigPath,
    },
    resolve: finalBuildConfig.resolve,
    output: {
      cssModules,
      module,
    },
    tools: {
      rspack,
      swc,
      bundlerChain,
    } as ExtendConfig['tools'],

    testEnvironment: target === 'node' ? 'node' : 'happy-dom',
  };

  return rstestConfig;
}

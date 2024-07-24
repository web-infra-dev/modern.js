import { createRsbuild } from '@rsbuild/core';
import type {
  RsbuildConfig,
  RsbuildPlugin,
  RsbuildInstance,
} from '@rsbuild/core';
import type {
  UniBuilderConfig,
  CreateUniBuilderOptions,
  CreateBuilderCommonOptions,
  OverridesUniBuilderInstance,
} from '../types';
import { parseCommonConfig } from '../shared/parseCommonConfig';
import { compatLegacyPlugin } from '../shared/compatLegacyPlugin';
import { SERVICE_WORKER_ENVIRONMENT_NAME } from '../shared/utils';

export async function parseConfig(
  uniBuilderConfig: UniBuilderConfig,
  options: CreateBuilderCommonOptions,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const { rsbuildConfig, rsbuildPlugins } = await parseCommonConfig(
    uniBuilderConfig,
    options,
  );

  if (uniBuilderConfig.experiments?.lazyCompilation) {
    rsbuildConfig.dev!.lazyCompilation =
      uniBuilderConfig.experiments.lazyCompilation;
  }

  if (uniBuilderConfig.tools?.babel) {
    const { pluginBabel } = await import('@rsbuild/plugin-babel');
    const { pluginBabelPost } = await import('./plugins/babel-post');
    rsbuildPlugins.push(
      pluginBabel({
        babelLoaderOptions: uniBuilderConfig.tools?.babel,
      }),
      pluginBabelPost(),
    );
  }

  if (uniBuilderConfig.tools?.styledComponents !== false) {
    const { pluginStyledComponents } = await import(
      '@rsbuild/plugin-styled-components'
    );
    const options = uniBuilderConfig.tools?.styledComponents || {};
    if (uniBuilderConfig.environments?.[SERVICE_WORKER_ENVIRONMENT_NAME]) {
      options.ssr = true;
    }
    rsbuildPlugins.push(pluginStyledComponents(options));
  }

  return {
    rsbuildConfig,
    rsbuildPlugins,
  };
}

export type UniBuilderInstance = Omit<
  RsbuildInstance,
  keyof OverridesUniBuilderInstance
> &
  OverridesUniBuilderInstance;

export async function createRspackBuilder(
  options: CreateUniBuilderOptions,
): Promise<UniBuilderInstance> {
  const { cwd = process.cwd(), config, ...rest } = options;

  const { rsbuildConfig, rsbuildPlugins } = await parseConfig(config, {
    ...rest,
    cwd,
  });

  const rsbuild = await createRsbuild({
    cwd,
    rsbuildConfig,
  });

  rsbuild.addPlugins(rsbuildPlugins);

  return {
    ...rsbuild,
    addPlugins: (plugins, options) => {
      const warpedPlugins = plugins.map(plugin => {
        return compatLegacyPlugin(plugin, { cwd });
      });
      rsbuild.addPlugins(warpedPlugins, options);
    },
  };
}

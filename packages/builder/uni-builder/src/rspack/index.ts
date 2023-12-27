import { createRsbuild } from '@rsbuild/core';
import type {
  RsbuildConfig,
  RsbuildPlugin,
  RsbuildInstance,
} from '@rsbuild/core';
import type {
  BuilderConfig,
  CreateUniBuilderOptions,
  CreateBuilderCommonOptions,
} from '../types';
import { parseCommonConfig } from '../shared/parseCommonConfig';
import type {
  StartDevServerOptions,
  UniBuilderStartServerResult,
} from '../shared/devServer';

export async function parseConfig(
  uniBuilderConfig: BuilderConfig,
  options: CreateBuilderCommonOptions,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const { rsbuildConfig, rsbuildPlugins } = await parseCommonConfig(
    uniBuilderConfig,
    options,
  );

  if (uniBuilderConfig.output?.enableAssetManifest) {
    const { pluginManifest } = await import('./plugins/manifest');
    rsbuildPlugins.push(pluginManifest());
  }

  if (uniBuilderConfig.tools?.babel) {
    const { pluginBabel } = await import('@rsbuild/plugin-babel');
    rsbuildPlugins.push(
      pluginBabel({
        babelLoaderOptions: uniBuilderConfig.tools?.babel,
      }),
    );
  }

  if (uniBuilderConfig.tools?.styledComponents !== false) {
    const { pluginStyledComponents } = await import(
      '@rsbuild/plugin-styled-components'
    );
    rsbuildPlugins.push(
      pluginStyledComponents(uniBuilderConfig.tools?.styledComponents),
    );
  }

  return {
    rsbuildConfig,
    rsbuildPlugins,
  };
}

export type UniBuilderInstance = Omit<RsbuildInstance, 'startDevServer'> & {
  /**
   * should be used in conjunction with the upper-layer framework:
   *
   * missing route.json (required in modern server)
   */
  startDevServer: (
    options: StartDevServerOptions,
  ) => Promise<UniBuilderStartServerResult>;
};

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
    startDevServer: async (options: StartDevServerOptions = {}) => {
      const { startDevServer } = await import('../shared/devServer');

      return startDevServer(rsbuild, options, config);
    },
  };
}

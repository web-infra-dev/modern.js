import { createRsbuild } from '@rsbuild/core';
import type {
  RsbuildConfig,
  RsbuildPlugin,
  RsbuildInstance,
} from '@rsbuild/core';
import type { RsbuildProvider } from '@rsbuild/shared';
import type {
  UniBuilderRspackConfig,
  CreateRspackBuilderOptions,
} from '../types';
import { parseCommonConfig } from '../shared/parseCommonConfig';
import { pluginStyledComponents } from '@rsbuild/plugin-styled-components';
import { withDefaultConfig } from './defaults';
import type { StartDevServerOptions } from '../shared/devServer';

export async function parseConfig(
  uniBuilderConfig: UniBuilderRspackConfig,
  cwd: string,
  frameworkConfigPath?: string,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const { rsbuildConfig, rsbuildPlugins } = await parseCommonConfig<'rspack'>(
    uniBuilderConfig,
    cwd,
    frameworkConfigPath,
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

  rsbuildPlugins.push(
    pluginStyledComponents(uniBuilderConfig.tools?.styledComponents),
  );

  return {
    rsbuildConfig,
    rsbuildPlugins,
  };
}

export async function createRspackBuilder(
  options: CreateRspackBuilderOptions,
): Promise<RsbuildInstance<RsbuildProvider>> {
  const { cwd = process.cwd() } = options;

  const uniBuilderConfig = withDefaultConfig(options.config);

  const { rsbuildConfig, rsbuildPlugins } = await parseConfig(
    uniBuilderConfig,
    cwd,
    options.frameworkConfigPath,
  );
  const rsbuild = await createRsbuild({
    cwd,
    rsbuildConfig,
  });

  rsbuild.addPlugins(rsbuildPlugins);

  return {
    ...rsbuild,
    startDevServer: async (options: StartDevServerOptions = {}) => {
      const { startDevServer } = await import('../shared/devServer');

      return startDevServer(rsbuild, options, uniBuilderConfig);
    },
  };
}

import {
  createRsbuild,
  type RsbuildConfig,
  type RsbuildPlugin,
  type RsbuildInstance,
} from '@rsbuild/core';
import type { StartServerResult } from '@rsbuild/shared';
import type {
  UniBuilderWebpackConfig,
  CreateWebpackBuilderOptions,
  CreateBuilderCommonOptions,
} from '../types';
import { parseCommonConfig } from '../shared/parseCommonConfig';
import { pluginModuleScopes } from './plugins/moduleScopes';
import { pluginBabel } from './plugins/babel';
import { pluginReact } from './plugins/react';
import type { StartDevServerOptions } from '../shared/devServer';

export async function parseConfig(
  uniBuilderConfig: UniBuilderWebpackConfig,
  options: CreateBuilderCommonOptions,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const { rsbuildConfig, rsbuildPlugins } = await parseCommonConfig<'webpack'>(
    uniBuilderConfig,
    options,
  );

  rsbuildPlugins.push(
    pluginBabel({
      babelLoaderOptions: uniBuilderConfig.tools?.babel,
    }),
  );
  rsbuildPlugins.push(pluginReact());

  if (uniBuilderConfig.tools?.tsLoader) {
    const { pluginTsLoader } = await import('./plugins/tsLoader');
    rsbuildPlugins.push(
      pluginTsLoader(
        uniBuilderConfig.tools.tsLoader,
        uniBuilderConfig.tools.babel,
      ),
    );
  }

  if (uniBuilderConfig.output?.enableAssetManifest) {
    const { pluginManifest } = await import('./plugins/manifest');
    rsbuildPlugins.push(pluginManifest());
  }

  if (uniBuilderConfig.security?.sri) {
    const { pluginSRI } = await import('./plugins/sri');
    rsbuildPlugins.push(pluginSRI(uniBuilderConfig.security?.sri));
  }

  if (uniBuilderConfig.experiments?.lazyCompilation) {
    const { pluginLazyCompilation } = await import('./plugins/lazyCompilation');
    rsbuildPlugins.push(
      pluginLazyCompilation(uniBuilderConfig.experiments?.lazyCompilation),
    );
  }

  if (uniBuilderConfig.tools?.styledComponents !== false) {
    const { pluginStyledComponents } = await import(
      './plugins/styledComponents'
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

type UniBuilderWebpackInstance = Omit<RsbuildInstance, 'startDevServer'> & {
  startDevServer: (
    options: StartDevServerOptions,
  ) => Promise<StartServerResult>;
};

export async function createWebpackBuilder(
  options: CreateWebpackBuilderOptions,
): Promise<UniBuilderWebpackInstance> {
  const { cwd = process.cwd(), config, ...rest } = options;

  const { rsbuildConfig, rsbuildPlugins } = await parseConfig(config, {
    ...rest,
    cwd,
  });

  const { webpackProvider } = await import('@rsbuild/webpack');
  rsbuildConfig.provider = webpackProvider;

  const rsbuild = await createRsbuild({
    rsbuildConfig,
    cwd,
  });

  rsbuild.addPlugins([
    ...rsbuildPlugins,
    pluginModuleScopes(options.config.source?.moduleScopes),
  ]);

  return {
    ...rsbuild,
    startDevServer: async (options: StartDevServerOptions = {}) => {
      const { startDevServer } = await import('../shared/devServer');

      return startDevServer(rsbuild, options, config);
    },
  };
}

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
  CreateBuilderCommonOptions,
} from '../types';
import { parseCommonConfig } from '../shared/parseCommonConfig';

export async function parseConfig(
  uniBuilderConfig: UniBuilderRspackConfig,
  options: CreateBuilderCommonOptions,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const { rsbuildConfig, rsbuildPlugins } = await parseCommonConfig<'rspack'>(
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

export async function createRspackBuilder(
  options: CreateRspackBuilderOptions,
): Promise<RsbuildInstance<RsbuildProvider>> {
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

  return rsbuild;
}

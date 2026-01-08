import {
  type RsbuildConfig,
  type RsbuildInstance,
  type RsbuildPlugin,
  createRsbuild,
} from '@rsbuild/core';
import type { PluginBabelOptions } from '@rsbuild/plugin-babel';
import { compatLegacyPlugin } from '../shared/compatLegacyPlugin';
import { parseCommonConfig } from '../shared/parseCommonConfig';
import { pluginPostcss } from '../shared/plugins/postcss';
import { rsbuildRscPlugin } from '../shared/rsc/plugins/rsbuild-rsc-plugin';
import { rscClientBrowserFallbackPlugin } from '../shared/rsc/rscClientBrowserFallback';
import { SERVICE_WORKER_ENVIRONMENT_NAME, castArray } from '../shared/utils';
import type {
  CreateBuilderCommonOptions,
  CreateUniBuilderOptions,
  OverridesUniBuilderInstance,
  UniBuilderConfig,
} from '../types';
import { pluginBabel } from './plugins/babel';
import { pluginInclude } from './plugins/include';
import { pluginModuleScopes } from './plugins/moduleScopes';
import { pluginReact } from './plugins/react';

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

  rsbuildPlugins.push(
    pluginPostcss({ autoprefixer: uniBuilderConfig.tools?.autoprefixer }),
  );

  const hasEnvironmentBabelConfig = Object.values(
    uniBuilderConfig.environments || {},
  ).some(c => c.tools?.babel !== undefined);

  // Add babel plugin into each environment separately
  if (hasEnvironmentBabelConfig) {
    const mergeSharedBabelConfig = (
      config: PluginBabelOptions['babelLoaderOptions'],
    ) => {
      if (uniBuilderConfig.tools?.babel) {
        return castArray(config).concat(
          ...castArray(uniBuilderConfig.tools?.babel),
        );
      }
      return config;
    };

    Object.entries(uniBuilderConfig.environments!).forEach(([name, config]) => {
      const environmentConfig = rsbuildConfig.environments?.[name];
      if (!environmentConfig) {
        return;
      }
      environmentConfig.plugins ??= [];

      if (config.tools?.babel) {
        environmentConfig.plugins.push(
          pluginBabel(
            {
              babelLoaderOptions: mergeSharedBabelConfig(config.tools?.babel),
            },
            {
              transformLodash:
                uniBuilderConfig.performance?.transformLodash ?? true,
            },
          ),
        );
      } else {
        environmentConfig.plugins.push(
          pluginBabel(
            {
              babelLoaderOptions: uniBuilderConfig.tools?.babel,
            },
            {
              transformLodash:
                uniBuilderConfig.performance?.transformLodash ?? true,
            },
          ),
        );
      }
    });
  } else {
    rsbuildPlugins.push(
      pluginBabel(
        {
          babelLoaderOptions: uniBuilderConfig.tools?.babel,
        },
        {
          transformLodash:
            uniBuilderConfig.performance?.transformLodash ?? true,
        },
      ),
    );
  }

  rsbuildPlugins.push(pluginReact());

  const enableRsc = uniBuilderConfig.server?.rsc ?? false;
  if (enableRsc) {
    const { rscClientRuntimePath, rscServerRuntimePath, internalDirectory } =
      options;
    rsbuildPlugins.push(
      rsbuildRscPlugin({
        appDir: options.cwd,
        isRspack: false,
        rscClientRuntimePath,
        rscServerRuntimePath,
        internalDirectory,
      }),
    );
  } else {
    rsbuildPlugins.push(rscClientBrowserFallbackPlugin());
  }

  if (uniBuilderConfig.tools?.tsLoader) {
    const { pluginTsLoader } = await import('./plugins/tsLoader');
    rsbuildPlugins.push(
      pluginTsLoader(
        uniBuilderConfig.tools.tsLoader,
        uniBuilderConfig.tools.babel,
      ),
    );
  }

  if (!uniBuilderConfig.output?.disableMinimize) {
    const { pluginMinimize } = await import('./plugins/minimize');
    rsbuildPlugins.push(pluginMinimize(uniBuilderConfig.tools?.terser));
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
    const options = uniBuilderConfig.tools?.styledComponents || {};
    if (uniBuilderConfig.environments?.[SERVICE_WORKER_ENVIRONMENT_NAME]) {
      options.ssr = true;
    }

    rsbuildPlugins.push(pluginStyledComponents(options));
  }

  rsbuildPlugins.push(
    pluginModuleScopes(uniBuilderConfig.source?.moduleScopes),
  );

  rsbuildPlugins.push(pluginInclude());

  return {
    rsbuildConfig,
    rsbuildPlugins,
  };
}

export type UniBuilderWebpackInstance = Omit<
  RsbuildInstance,
  keyof OverridesUniBuilderInstance
> &
  OverridesUniBuilderInstance;

export async function createWebpackBuilder(
  options: CreateUniBuilderOptions,
): Promise<UniBuilderWebpackInstance> {
  const { cwd = process.cwd(), config, ...rest } = options;

  const { rsbuildConfig, rsbuildPlugins } = await parseConfig(config, {
    ...rest,
    cwd,
  });

  const { webpackProvider } = await import('@rsbuild/webpack');

  rsbuildConfig.provider = webpackProvider;

  rsbuildConfig.plugins = [...rsbuildPlugins, ...(rsbuildConfig.plugins || [])];

  const rsbuild = await createRsbuild({
    rsbuildConfig,
    cwd,
  });

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

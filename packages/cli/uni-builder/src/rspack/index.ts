import { createRsbuild } from '@rsbuild/core';
import type {
  RsbuildConfig,
  RsbuildInstance,
  RsbuildPlugin,
} from '@rsbuild/core';
import type { PluginBabelOptions } from '@rsbuild/plugin-babel';
import { compatLegacyPlugin } from '../shared/compatLegacyPlugin';
import { parseCommonConfig } from '../shared/parseCommonConfig';
import { rsbuildRscPlugin } from '../shared/rsc/plugins/rsbuild-rsc-plugin';
import { addRscExternalFallback } from '../shared/rsc/rscExternalFallback';
import { SERVICE_WORKER_ENVIRONMENT_NAME, castArray } from '../shared/utils';
import type {
  CreateBuilderCommonOptions,
  CreateUniBuilderOptions,
  OverridesUniBuilderInstance,
  UniBuilderConfig,
} from '../types';

export async function parseConfig(
  uniBuilderConfig: UniBuilderConfig,
  options: CreateBuilderCommonOptions,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  uniBuilderConfig.performance ??= {};
  uniBuilderConfig.performance.buildCache ??= true;

  const { rsbuildConfig, rsbuildPlugins } = await parseCommonConfig(
    uniBuilderConfig,
    options,
  );

  if (uniBuilderConfig.experiments?.lazyCompilation) {
    rsbuildConfig.dev!.lazyCompilation =
      uniBuilderConfig.experiments.lazyCompilation;
  }

  // Rsbuild enable lazyCompilation by default, we need to disable it
  if (!rsbuildConfig.dev!.lazyCompilation) {
    rsbuildConfig.dev!.lazyCompilation = false;
  }

  const { sri } = uniBuilderConfig.security || {};
  if (sri) {
    if (sri === true) {
      rsbuildConfig.security!.sri = {
        enable: 'auto',
      };
    } else {
      const algorithm = Array.isArray(sri.hashFuncNames)
        ? (sri.hashFuncNames[0] as 'sha256' | 'sha384' | 'sha512')
        : undefined;

      rsbuildConfig.security!.sri = {
        enable: sri.enabled,
        algorithm,
      };
    }
  }

  if (Boolean(rsbuildConfig.tools!.lightningcssLoader) === false) {
    const { pluginPostcss } = await import('../shared/plugins/postcss');
    rsbuildPlugins.push(
      pluginPostcss({ autoprefixer: uniBuilderConfig.tools?.autoprefixer }),
    );
  }

  const hasEnvironmentBabelConfig = Object.values(
    uniBuilderConfig.environments || {},
  ).some(c => c.tools?.babel !== undefined);

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

    const { pluginBabel } = await import('@rsbuild/plugin-babel');
    const { pluginBabelPost } = await import('./plugins/babel-post');
    Object.entries(uniBuilderConfig.environments!).forEach(([name, config]) => {
      const environmentConfig = rsbuildConfig.environments?.[name];
      if (!environmentConfig) {
        return;
      }
      if (config.tools?.babel) {
        environmentConfig.plugins ??= [];
        environmentConfig.plugins.push(
          pluginBabel({
            babelLoaderOptions: mergeSharedBabelConfig(config.tools?.babel),
          }),
          pluginBabelPost(),
        );
      } else if (uniBuilderConfig.tools?.babel) {
        environmentConfig.plugins ??= [];
        environmentConfig.plugins.push(
          pluginBabel({
            babelLoaderOptions: uniBuilderConfig.tools?.babel,
          }),
          pluginBabelPost(),
        );
      }
    });
  } else if (uniBuilderConfig.tools?.babel) {
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

  const enableRsc = uniBuilderConfig.server?.rsc ?? false;
  if (enableRsc) {
    const { rscClientRuntimePath, rscServerRuntimePath, internalDirectory } =
      options;
    rsbuildPlugins.push(
      rsbuildRscPlugin({
        appDir: options.cwd,
        isRspack: true,
        rscClientRuntimePath,
        rscServerRuntimePath,
        internalDirectory,
      }),
    );
  } else {
    addRscExternalFallback(rsbuildConfig, rsbuildPlugins);
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

  // uni-builder plugins should be registered earlier than user plugins
  rsbuildConfig.plugins = [...rsbuildPlugins, ...(rsbuildConfig.plugins || [])];

  const rsbuild = await createRsbuild({
    cwd,
    rsbuildConfig,
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

import { createRsbuild } from '@rsbuild/core';
import type {
  RsbuildConfig,
  RsbuildInstance,
  RsbuildPlugin,
} from '@rsbuild/core';
import type { PluginBabelOptions } from '@rsbuild/plugin-babel';
import { rsbuildRscPlugin } from './rsc/plugins/rsbuild-rsc-plugin';
import { parseCommonConfig } from './shared/parseCommonConfig';
import { castArray } from './shared/utils';
import type {
  BuilderConfig,
  CreateBuilderCommonOptions,
  CreateBuilderOptions,
} from './types';

export async function parseConfig(
  builderConfig: BuilderConfig,
  options: CreateBuilderCommonOptions,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  builderConfig.performance ??= {};
  builderConfig.performance.buildCache ??= false;

  const { rsbuildConfig, rsbuildPlugins } = await parseCommonConfig(
    builderConfig,
    options,
  );

  const { sri } = builderConfig.security || {};
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
    const { pluginPostcss } = await import('./plugins/postcss');
    rsbuildPlugins.push(
      pluginPostcss({ autoprefixer: builderConfig.tools?.autoprefixer }),
    );
  }

  const hasEnvironmentBabelConfig = Object.values(
    builderConfig.environments || {},
  ).some(c => c.tools?.babel !== undefined);

  if (hasEnvironmentBabelConfig) {
    const mergeSharedBabelConfig = (
      config: PluginBabelOptions['babelLoaderOptions'],
    ) => {
      if (builderConfig.tools?.babel) {
        return castArray(config).concat(
          ...castArray(builderConfig.tools?.babel),
        );
      }
      return config;
    };

    const { pluginBabel } = await import('@rsbuild/plugin-babel');
    const { pluginBabelPost } = await import('./plugins/babel-post');
    Object.entries(builderConfig.environments!).forEach(([name, config]) => {
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
      } else if (builderConfig.tools?.babel) {
        environmentConfig.plugins ??= [];
        environmentConfig.plugins.push(
          pluginBabel({
            babelLoaderOptions: builderConfig.tools?.babel,
          }),
          pluginBabelPost(),
        );
      }
    });
  } else if (builderConfig.tools?.babel) {
    const { pluginBabel } = await import('@rsbuild/plugin-babel');
    const { pluginBabelPost } = await import('./plugins/babel-post');
    rsbuildPlugins.push(
      pluginBabel({
        babelLoaderOptions: builderConfig.tools?.babel,
      }),
      pluginBabelPost(),
    );
  }

  const enableRsc = builderConfig.server?.rsc ?? false;
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
  }

  return {
    rsbuildConfig,
    rsbuildPlugins,
  };
}

export type BuilderInstance = RsbuildInstance;

export async function createRspackBuilder(
  options: CreateBuilderOptions,
): Promise<BuilderInstance> {
  const {
    cwd = process.cwd(),
    config,
    rscClientRuntimePath,
    rscServerRuntimePath,
    ...rest
  } = options;

  const { rsbuildConfig, rsbuildPlugins } = await parseConfig(config, {
    ...rest,
    cwd,
  });

  // builder plugins should be registered earlier than user plugins
  rsbuildConfig.plugins = [...rsbuildPlugins, ...(rsbuildConfig.plugins || [])];

  const rsbuild = await createRsbuild({
    cwd,
    rsbuildConfig,
  });

  return {
    ...rsbuild,
  };
}

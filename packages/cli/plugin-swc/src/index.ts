import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import type { ToolsUserConfig } from '@modern-js/app-tools/src/types/config/tools';
import { isSSR } from '@modern-js/utils';
import { logger } from '@modern-js/utils/logger';
import {
  type ObjPluginSwcOptions,
  type PluginSwcOptions,
  pluginSwc,
} from '@rsbuild/plugin-webpack-swc';

export function factory(
  name: string,
  modifySwcOptions: (options: PluginSwcOptions) => PluginSwcOptions,
): () => CliPlugin<AppTools> {
  return () => ({
    name,
    setup: api => ({
      prepare() {
        const context = api.useAppContext();
        if (!context.builder || context.bundlerType === 'rspack') {
          return;
        }

        const config = api.useResolvedConfigContext();
        const { esbuild, swc = {} } = config.tools;
        const swcOptions = modifySwcOptions(swc);
        const finalConfig = applyBuilderSwcConfig(
          swcOptions,
          esbuild,
          isSSR(config),
        );

        context.builder.addPlugins([
          pluginSwc(
            applyConfig(finalConfig, swcConfig => {
              swcConfig.transformLodash =
                config.performance.transformLodash ?? true;
            }),
          ),
        ]);
      },
    }),
  });
}

export function applyBuilderSwcConfig(
  swc: PluginSwcOptions,
  esbuild: ToolsUserConfig['esbuild'] | undefined,
  isSSR: boolean,
): PluginSwcOptions {
  // common configuration
  let swcConfig = swc;
  if (isSSR) {
    swcConfig = applyConfig(swc, config => {
      config.extensions ??= {};
      config.extensions.loadableComponents = true;
    });
  }

  return applyConfig(swcConfig, config => {
    if (esbuild) {
      if (config.jsMinify !== false && esbuild.minimize !== false) {
        logger.warn(
          'You have enabled both esbuild minimizer and SWC minimizer, which will cause conflicts. Please remove `tools.esbuild` config and only use SWC to minimize your code.',
        );
      }
      if (esbuild.loader !== false) {
        logger.warn(
          'You have enabled both esbuild loader and SWC loader, which will cause conflicts. Please remove `tools.esbuild` config and only use SWC to transform your code.',
        );
      }
    }
  });
}

const PLUGIN_NAME = '@modern-js/plugin-swc';

export const swcPlugin = factory(PLUGIN_NAME, swcOptions => {
  return applyConfig(swcOptions, swcOptions => {
    swcOptions.extensions ??= {};
    swcOptions.extensions.ssrLoaderId = {
      runtimePackageName: '@modern-js/runtime',
      functionUseLoaderName: 'useLoader',
    };
  });
});

function applyConfig(
  rawConfig: PluginSwcOptions,
  handler: (config: ObjPluginSwcOptions) => void,
): PluginSwcOptions {
  if (typeof rawConfig === 'function') {
    return (config, utils) => {
      handler(config);

      // in the last invoke user config
      return rawConfig(config, utils) || config;
    };
  } else {
    handler(rawConfig);

    return rawConfig;
  }
}

export default swcPlugin;

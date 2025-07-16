import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { isSSR } from '@modern-js/utils';
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
        const { swc = {} } = config.tools;
        const swcOptions = modifySwcOptions(swc as any);
        const finalConfig = applyBuilderSwcConfig(swcOptions, isSSR(config));

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

  return applyConfig(swcConfig, () => {});
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

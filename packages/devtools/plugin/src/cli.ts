import type { AppTools, CliPlugin, UserConfig } from '@modern-js/app-tools';
import { ClientDefinition } from '@modern-js/devtools-kit/node';
import { logger } from '@modern-js/utils';
import createDeferred from 'p-defer';
import { createHooks } from 'hookable';
import type { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';
import { proxy } from 'valtio';
import { DevtoolsPluginOptions, resolveContext } from './options';
import { CliPluginAPI, Plugin, PluginApi } from './types';

export type { DevtoolsPluginOptions };

export type DevtoolsPlugin = CliPlugin<AppTools> & {
  setClientDefinition: (def: ClientDefinition) => void;
};

export const BUILTIN_PLUGINS: Plugin[] = [];

export const devtoolsPlugin = (
  inlineOptions: DevtoolsPluginOptions = {},
): DevtoolsPlugin => {
  const ctx = proxy(resolveContext(inlineOptions));
  const setupBuilder = createDeferred<RsbuildPluginAPI>();
  const setupFramework = createDeferred<CliPluginAPI>();
  const api: PluginApi = {
    builderHooks: createHooks(),
    frameworkHooks: createHooks(),
    setupBuilder: () => setupBuilder.promise,
    setupFramework: () => setupFramework.promise,
    context: () => ctx,
  };

  return {
    name: '@modern-js/plugin-devtools',
    usePlugins: [],
    setClientDefinition(def) {
      Object.assign(ctx.def, def);
    },
    async setup(frameworkApi) {
      if (!ctx.enable) return {};
      setupFramework.resolve(frameworkApi);

      return {
        async prepare() {
          await api.frameworkHooks.callHook('prepare');
        },
        async modifyFileSystemRoutes(params) {
          await api.frameworkHooks.callHook('modifyFileSystemRoutes', params);
          return params;
        },
        async afterCreateCompiler(params) {
          await api.frameworkHooks.callHook('afterCreateCompiler', params);
        },
        async beforeRestart() {
          await api.frameworkHooks.callHook('beforeRestart');
        },
        async beforeExit() {
          await api.frameworkHooks.callHook('beforeExit');
        },
        async modifyServerRoutes(params) {
          await api.frameworkHooks.callHook('modifyServerRoutes', params);
          return params;
        },
        async config() {
          logger.info(`${ctx.def.name.formalName} DevTools is enabled`);
          const config: UserConfig<AppTools> = {};
          await api.frameworkHooks.callHook('config', config);

          const builderPlugin: RsbuildPlugin = {
            name: 'builder-plugin-devtools',
            setup(builderApi) {
              setupBuilder.resolve(builderApi);

              builderApi.modifyBundlerChain(async (options, utils) => {
                await api.builderHooks.callHook(
                  'modifyBundlerChain',
                  options,
                  utils,
                );
              });
              builderApi.modifyWebpackConfig(async (config, utils) => {
                await api.builderHooks.callHook(
                  'modifyWebpackConfig',
                  config,
                  utils,
                );
              });
              builderApi.modifyRspackConfig(async (config, utils) => {
                await api.builderHooks.callHook(
                  'modifyRspackConfig',
                  config,
                  utils,
                );
              });
              builderApi.onBeforeCreateCompiler(async params => {
                await api.builderHooks.callHook(
                  'onBeforeCreateCompiler',
                  params,
                );
              });
              builderApi.onAfterCreateCompiler(async params => {
                await api.builderHooks.callHook(
                  'onAfterCreateCompiler',
                  params,
                );
              });
              builderApi.onDevCompileDone(async params => {
                await api.builderHooks.callHook('onDevCompileDone', params);
              });
              builderApi.onAfterBuild(async params => {
                await api.builderHooks.callHook('onAfterBuild', params);
              });
            },
          };
          config.builderPlugins ||= [];
          config.builderPlugins.push(builderPlugin);

          return config;
        },
      };
    },
  };
};

export default devtoolsPlugin;

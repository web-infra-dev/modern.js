import {
  mergeConfig,
  type AppTools,
  type CliPlugin,
  type UserConfig,
} from '@modern-js/app-tools';
import { ClientDefinition } from '@modern-js/devtools-kit/node';
import { logger } from '@modern-js/utils';
import createDeferred from 'p-defer';
import { createHooks } from 'hookable';
import type { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';
import { proxy } from 'valtio';
import { DevtoolsPluginOptions, resolveContext } from './options';
import { CliPluginAPI, Plugin, PluginApi } from './types';
import { pluginDebug } from './plugins/debug';
import { pluginHttp } from './plugins/http';
import { pluginState } from './plugins/state';
import { pluginWatcher } from './plugins/watcher';
import { pluginServiceWorker } from './plugins/service-worker';
import { pluginHtml } from './plugins/html';
import { pluginRpc } from './plugins/rpc';

export type { DevtoolsPluginOptions };

export type DevtoolsPlugin = CliPlugin<AppTools> & {
  setClientDefinition: (def: ClientDefinition) => void;
};

export const BUILTIN_PLUGINS: Plugin[] = [
  pluginDebug,
  pluginWatcher,
  pluginServiceWorker,
  pluginHtml,
  // --- //
  pluginState,
  pluginHttp,
  pluginRpc,
];

export const devtoolsPlugin = (
  inlineOptions: DevtoolsPluginOptions = {},
): DevtoolsPlugin => {
  const ctx = proxy(resolveContext(inlineOptions));
  const setupBuilder = createDeferred<RsbuildPluginAPI>();
  const setupFramework = createDeferred<CliPluginAPI>();
  const _sharedVars: Record<string, unknown> = {};
  const api: PluginApi = {
    builderHooks: createHooks(),
    frameworkHooks: createHooks(),
    setupBuilder: () => setupBuilder.promise,
    setupFramework: () => setupFramework.promise,
    get context() {
      return ctx;
    },
    get vars() {
      return _sharedVars as any;
    },
  };
  const cleanup = () => {
    setupBuilder.reject(new Error('Devtools Plugin is disabled'));
    setupFramework.reject(new Error('Devtools Plugin is disabled'));
    api.builderHooks.removeAllHooks();
    api.frameworkHooks.removeAllHooks();
  };
  for (const plugin of BUILTIN_PLUGINS) {
    plugin.setup(api);
  }

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
        async modifyServerRoutes(params) {
          await api.frameworkHooks.callHook('modifyServerRoutes', params);
          return params;
        },
        async beforeRestart() {
          await api.frameworkHooks.callHook('beforeRestart');
          cleanup();
        },
        beforeExit() {
          api.frameworkHooks.callHookWith(
            hooks => hooks.forEach(hook => hook()),
            'beforeExit',
          );
          cleanup();
        },
        async afterBuild(params) {
          api.frameworkHooks.callHook('afterBuild', params);
          cleanup();
        },
        async config() {
          logger.info(`${ctx.def.name.formalName} DevTools is enabled`);
          const configs: UserConfig<AppTools>[] =
            await api.frameworkHooks.callHookParallel('config');

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
              builderApi.onExit(() => {
                api.builderHooks.callHookWith(
                  hooks => hooks.forEach(hook => hook()),
                  'onExit',
                );
              });
            },
          };
          configs.push({ builderPlugins: [builderPlugin] });
          return mergeConfig(configs) as unknown as UserConfig<AppTools>;
        },
      };
    },
  };
};

export default devtoolsPlugin;

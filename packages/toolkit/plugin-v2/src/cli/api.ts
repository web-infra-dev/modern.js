import { merge } from '@modern-js/utils/lodash';
import type { PluginHook } from '../types';
import type {
  AllKeysForCLIPluginExtendsAPI,
  AllValueForCLIPluginExtendsAPI,
  CLIPluginAPI,
  CLIPluginExtendsAPI,
} from '../types/cli/api';
import type { AppContext, InternalContext } from '../types/cli/context';
import type { CLIPluginExtends } from '../types/cli/plugin';
import type { PluginManager } from '../types/plugin';
import type { DeepPartial } from '../types/utils';
import { debug } from './run/utils/debug';

export function initPluginAPI<Extends extends CLIPluginExtends>({
  context,
  pluginManager,
}: {
  context: InternalContext<Extends>;
  pluginManager: PluginManager;
}): CLIPluginAPI<Extends> {
  const { hooks, extendsHooks, plugins } = context;
  function getAppContext() {
    if (context) {
      const {
        hooks,
        extendsHooks,
        config,
        normalizedConfig,
        pluginAPI,
        ...appContext
      } = context;
      appContext._internalContext = context;
      return appContext as AppContext<Extends> & Extends['extendContext'];
    }
    throw new Error('Cannot access context');
  }

  function getConfig() {
    if (context.config) {
      return context.config;
    }
    throw new Error('Cannot access config');
  }
  function getNormalizedConfig() {
    if (context.normalizedConfig) {
      return context.normalizedConfig;
    }
    throw new Error('Cannot access normalized config');
  }

  function getHooks() {
    return context.hooks;
  }

  const extendsPluginApi: Partial<CLIPluginExtendsAPI<Extends>> = {};

  plugins.forEach(plugin => {
    const { _registryApi } = plugin;
    if (_registryApi) {
      const apis = _registryApi(getAppContext, updateAppContext);
      Object.keys(apis).forEach(apiName => {
        extendsPluginApi[apiName as AllKeysForCLIPluginExtendsAPI<Extends>] =
          apis[apiName] as AllValueForCLIPluginExtendsAPI<Extends>;
      });
    }
  });

  if (extendsHooks) {
    Object.keys(extendsHooks!).forEach(hookName => {
      extendsPluginApi[hookName as AllKeysForCLIPluginExtendsAPI<Extends>] = (
        extendsHooks as Record<string, PluginHook<(...args: any[]) => any>>
      )[hookName].tap as AllValueForCLIPluginExtendsAPI<Extends>;
    });
  }

  function updateAppContext(updateContext: DeepPartial<AppContext<Extends>>) {
    context = merge(context, updateContext);
  }

  const pluginAPI = {
    isPluginExists: pluginManager.isPluginExists,
    getAppContext,
    getConfig,
    getNormalizedConfig,
    getHooks,
    updateAppContext,

    config: hooks.config.tap,

    modifyConfig: hooks.modifyConfig.tap,
    modifyResolvedConfig: hooks.modifyResolvedConfig.tap,

    modifyRsbuildConfig: hooks.modifyRsbuildConfig.tap,
    modifyBundlerChain: hooks.modifyBundlerChain.tap,
    modifyRspackConfig: hooks.modifyRspackConfig.tap,
    modifyWebpackChain: hooks.modifyWebpackChain.tap,
    modifyWebpackConfig: hooks.modifyWebpackConfig.tap,
    modifyHtmlPartials: hooks.modifyHtmlPartials.tap,

    addCommand: hooks.addCommand.tap,

    onPrepare: hooks.onPrepare.tap,
    addWatchFiles: hooks.addWatchFiles.tap,
    onFileChanged: hooks.onFileChanged.tap,
    onBeforeRestart: hooks.onBeforeRestart.tap,
    onBeforeCreateCompiler: hooks.onBeforeCreateCompiler.tap,
    onDevCompileDone: hooks.onDevCompileDone.tap,
    onAfterCreateCompiler: hooks.onAfterCreateCompiler.tap,
    onBeforeBuild: hooks.onBeforeBuild.tap,
    onAfterBuild: hooks.onAfterBuild.tap,
    onBeforeDev: hooks.onBeforeDev.tap,
    onAfterDev: hooks.onAfterDev.tap,
    onBeforeDeploy: hooks.onBeforeDeploy.tap,
    onAfterDeploy: hooks.onAfterDeploy.tap,
    onBeforeExit: hooks.onBeforeExit.tap,
    _internalRuntimePlugins: hooks._internalRuntimePlugins.tap,
    _internalServerPlugins: hooks._internalServerPlugins.tap,
    modifyServerRoutes: hooks.modifyServerRoutes.tap,
    ...extendsPluginApi,
  };

  if (typeof Proxy === 'undefined') {
    return pluginAPI as CLIPluginAPI<Extends>;
  }

  return new Proxy(pluginAPI, {
    get(target: Record<string, any>, prop: string) {
      // hack then function to fix p-defer handle error
      if (prop === 'then') {
        return undefined;
      }
      if (prop in target) {
        return target[prop];
      }
      return () => {
        debug(`api.${prop.toString()} not exist`);
      };
    },
  }) as CLIPluginAPI<Extends>;
}

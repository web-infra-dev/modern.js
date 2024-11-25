import { merge, update } from '@modern-js/utils/lodash';
import type { PluginHookTap } from '../types';
import type { CLIPluginAPI } from '../types/cli/api';
import type { AppContext, InternalContext } from '../types/cli/context';
import type { PluginManager } from '../types/plugin';
import type { DeepPartial } from '../types/utils';

export function initPluginAPI<
  Config,
  NormalizedConfig,
  ExtendsHooksKey extends string,
>({
  context,
}: {
  context: InternalContext<Config, NormalizedConfig, ExtendsHooksKey>;
  pluginManager: PluginManager;
}): CLIPluginAPI<Config, NormalizedConfig> {
  const { hooks, extendsHooks, plugins } = context;
  function getAppContext() {
    if (context) {
      const { hooks, config, normalizedConfig, pluginAPI, ...appContext } =
        context;
      appContext._internalContext = context;
      return appContext;
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

  const extendsPluginApi: Record<
    string,
    PluginHookTap<(...args: any[]) => any>
  > = {};

  plugins.forEach(plugin => {
    const { _registryApi } = plugin;
    if (_registryApi) {
      const apis = _registryApi(getAppContext, updateAppContext);
      Object.keys(apis).forEach(apiName => {
        extendsPluginApi[apiName] = apis[apiName];
      });
    }
  });

  (Object.keys(extendsHooks) as ExtendsHooksKey[]).forEach(hookName => {
    extendsPluginApi[hookName] = extendsHooks[hookName].tap;
  });

  function updateAppContext(
    updateContext: DeepPartial<AppContext<Config, NormalizedConfig>>,
  ) {
    context = merge(context, updateContext);
  }

  return {
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
    onWatchFiles: hooks.addWatchFiles.tap,
    onFileChanged: hooks.onFileChanged.tap,
    onBeforeRestart: hooks.onBeforeRestart.tap,
    onBeforeCreateCompiler: hooks.onBeforeCreateCompiler.tap,
    onAfterCreateCompiler: hooks.onAfterCreateCompiler.tap,
    onBeforeBuild: hooks.onBeforeBuild.tap,
    onAfterBuild: hooks.onAfterBuild.tap,
    onBeforeDev: hooks.onBeforeDev.tap,
    onAfterDev: hooks.onAfterDev.tap,
    onBeforeDeploy: hooks.onBeforeDeploy.tap,
    onAfterDeploy: hooks.onAfterDeploy.tap,
    onBeforeExit: hooks.onBeforeExit.tap,
    ...extendsPluginApi,
  };
}

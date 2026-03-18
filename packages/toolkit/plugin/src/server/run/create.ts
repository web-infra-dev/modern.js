import { createPluginManager } from '../../manager';
import { initPluginAPI } from '../../server/api';
import { createServerContext, initServerContext } from '../../server/context';
import type {
  ServerPlugin,
  ServerPluginExtends,
} from '../../types/server/plugin';
import type { ServerRunOptions } from './types';

export const createServer = <Extends extends ServerPluginExtends>() => {
  let initOptions: ServerRunOptions;
  const pluginManager = createPluginManager();

  function init(options: ServerRunOptions) {
    pluginManager.clear();
    initOptions = options;

    const {
      plugins: allPlugins,
      options: runOptions,
      handleSetupResult,
    } = initOptions;

    pluginManager.addPlugins(allPlugins);

    const plugins = pluginManager.getPlugins() as ServerPlugin<Extends>[];

    const context = createServerContext<Extends>({
      serverContext: initServerContext({ plugins, options: runOptions }),
      config: initOptions.config,
    });

    context.dependencies = options.options.appContext.dependencies;

    const pluginAPI = initPluginAPI<Extends>({
      context,
      pluginManager,
    });

    context.pluginAPI = pluginAPI;

    for (const plugin of plugins) {
      const setupResult = plugin.setup?.(pluginAPI);
      if (handleSetupResult) {
        handleSetupResult(setupResult, pluginAPI);
      }
    }
    return { serverContext: context };
  }

  async function run(options: ServerRunOptions) {
    const { serverContext } = init(options);
    const config = await serverContext.hooks.modifyConfig.call(
      serverContext.config,
    );
    serverContext.config = config as Extends['config'];

    return { serverContext };
  }

  return {
    run,
  };
};

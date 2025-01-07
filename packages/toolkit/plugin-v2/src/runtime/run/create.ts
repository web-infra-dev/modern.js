import { createPluginManager } from '../../manager';
import { initPluginAPI } from '../../runtime/api';
import {
  createRuntimeContext,
  initRuntimeContext,
} from '../../runtime/context';
import type {
  RuntimePlugin,
  RuntimePluginExtends,
} from '../../types/runtime/plugin';
import type { RuntimeRunOptions } from './types';

export const createRuntime = <Extends extends RuntimePluginExtends>() => {
  let initOptions: RuntimeRunOptions;
  const pluginManager = createPluginManager();

  function init(options: RuntimeRunOptions) {
    pluginManager.clear();
    initOptions = options;

    const { plugins: allPlugins, handleSetupResult } = options;

    pluginManager.addPlugins(allPlugins);

    const plugins = pluginManager.getPlugins() as RuntimePlugin<Extends>[];

    const context = createRuntimeContext<Extends>({
      runtimeContext: initRuntimeContext(),
      config: initOptions.config,
      plugins,
    });

    const pluginAPI = initPluginAPI<Extends>({
      context,
      pluginManager,
      plugins,
    });

    context.pluginAPI = pluginAPI;

    for (const plugin of plugins) {
      const setupResult = plugin.setup?.(pluginAPI);
      if (handleSetupResult) {
        handleSetupResult(setupResult, pluginAPI);
      }
    }
    return { runtimeContext: context };
  }

  async function run(options: RuntimeRunOptions) {
    await init(options);
  }

  return {
    init,
    run,
    getPrevInitOptions: () => initOptions,
  };
};

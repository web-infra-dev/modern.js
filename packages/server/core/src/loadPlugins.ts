import { compatRequire, tryResolve } from '@modern-js/utils';
import { createPlugin, ServerPlugin } from './plugin';

type Plugin = string | [string, any] | ServerPlugin;
export const loadPlugins = (plugins: Plugin[], appDirectory: string) => {
  const resolvePlugin = (p: Plugin) => {
    const isPluginInstance = typeof p !== 'string' && !Array.isArray(p);
    if (isPluginInstance) {
      return {
        module: createPlugin(p.setup, p),
      };
    }

    const [pkg, options] = typeof p === 'string' ? [p, undefined] : p;
    const pluginPath = tryResolve(pkg, appDirectory);
    let module = compatRequire(pluginPath);

    const useNewSyntax = typeof module === 'function';
    if (useNewSyntax) {
      const plugin = module(options);
      module = createPlugin(plugin.setup, plugin);
    }

    return {
      pkg,
      path: pluginPath,
      module,
    };
  };

  return plugins.map(plugin => {
    const { pkg, path, module } = resolvePlugin(plugin);
    return { ...module, pluginPath: path, pkg };
  });
};

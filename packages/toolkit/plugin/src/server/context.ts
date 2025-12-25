import type { PluginHook } from '../types/hooks';
import type {
  InternalServerContext,
  ServerContext,
} from '../types/server/context';
import type { ServerPlugin, ServerPluginExtends } from '../types/server/plugin';
import { initHooks } from './hooks';
import type { ServerCreateOptions } from './run/types';

interface ContextParams<Extends extends ServerPluginExtends> {
  serverContext: ServerContext<Extends>;
  config: Extends['config'];
}

export function initServerContext<Extends extends ServerPluginExtends>(params: {
  options: ServerCreateOptions;
  plugins: ServerPlugin<Extends>[];
}): ServerContext<Extends> & Extends['extendContext'] {
  const { options, plugins } = params;
  return {
    routes: options.routes || [],
    appDirectory: options.appContext.appDirectory || '',
    apiDirectory: options.appContext.apiDirectory,
    lambdaDirectory: options.appContext.lambdaDirectory,
    internalDirectory: options.appContext.internalDirectory || '',
    sharedDirectory: options.appContext.sharedDirectory || '',
    distDirectory: options.pwd,
    metaName: options.metaName || 'modern-js',
    plugins: plugins,
    middlewares: [],
    bffRuntimeFramework: options.appContext.bffRuntimeFramework,
    renderMiddlewares: [],
    appDependencies: options.appContext.appDependencies,
  };
}

export function createServerContext<Extends extends ServerPluginExtends>({
  serverContext,
  config,
}: ContextParams<Extends>): InternalServerContext<Extends> {
  const { plugins } = serverContext;
  const extendsHooks: Record<string, PluginHook<(...args: any[]) => any>> = {};
  plugins.forEach(plugin => {
    const { registryHooks = {} } = plugin;
    Object.keys(registryHooks).forEach(hookName => {
      extendsHooks[hookName] = registryHooks[hookName];
    });
  });
  return {
    ...serverContext,
    hooks: {
      ...initHooks<Extends['config']>(),
      ...extendsHooks,
    },
    extendsHooks,
    config,
  };
}

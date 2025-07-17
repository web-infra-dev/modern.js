import path from 'path';
import type { AppContext, InternalContext } from '../types/cli/context';
import type { CLIPlugin, CLIPluginExtends } from '../types/cli/plugin';
import type { PluginHook } from '../types/hooks';
import { initHooks } from './hooks';

interface ContextParams<Extends extends CLIPluginExtends> {
  appContext: AppContext<Extends>;
  config: Extends['config'];
  normalizedConfig: Extends['normalizedConfig'];
}

export function initAppContext<Extends extends CLIPluginExtends>(params: {
  packageName: string;
  configFile: string;
  command: string;
  appDirectory: string;
  metaName: string;
  plugins: CLIPlugin<Extends>[];
  srcDir?: string;
  distDir?: string;
}): AppContext<Extends> {
  const { appDirectory, srcDir = 'src', distDir = 'dist' } = params;
  return {
    metaName: params.metaName,
    packageName: params.packageName,
    configFile: params.configFile,
    command: params.command,
    isProd: process.env.NODE_ENV === 'production',
    appDirectory: appDirectory,
    srcDirectory: path.resolve(appDirectory, srcDir),
    distDirectory: '',
    nodeModulesDirectory: path.resolve(appDirectory, 'node_modules'),
    plugins: params.plugins,
  };
}

export async function createContext<Extends extends CLIPluginExtends>({
  appContext,
  config,
  normalizedConfig,
}: ContextParams<Extends>): Promise<InternalContext<Extends>> {
  const { plugins } = appContext;
  const extendsHooks: Record<string, PluginHook<(...args: any[]) => any>> = {};
  plugins.forEach(plugin => {
    const { registryHooks = {} } = plugin;
    Object.keys(registryHooks).forEach(hookName => {
      extendsHooks[hookName] = registryHooks[hookName];
    });
  });
  return {
    ...appContext,
    hooks: {
      ...initHooks<
        Extends['config'],
        Extends['normalizedConfig'],
        Extends['extendBuildUtils'],
        Extends['extendConfigUtils']
      >(),
      ...extendsHooks,
    },
    extendsHooks,
    config,
    normalizedConfig,
  };
}

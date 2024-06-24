import path from 'path';
import { address } from '@modern-js/utils';
import { createContext } from '@modern-js/plugin';
import type {
  CliPlugin,
  UserConfig,
  IAppContext,
  NormalizedConfig,
} from './types';

export const AppContext = createContext<IAppContext>({} as IAppContext);

export const ConfigContext = createContext<UserConfig<any>>({});

export const ResolvedConfigContext = createContext<NormalizedConfig<any>>(
  {} as NormalizedConfig<any>,
);

/**
 * Set app context.
 * @param value new app context. It will override previous app context.
 */
export const setAppContext = (value: IAppContext) => AppContext.set(value);

/**
 * Get app context, including directories, plugins and some static infos.
 */
export const useAppContext = () => AppContext.use().value;

/**
 * Get original content of user config.
 */
export const useConfigContext: <
  Extends extends Record<string, any>,
>() => UserConfig<Extends> = () => ConfigContext.use().value;

/**
 * Get normalized content of user config.
 */
export const useResolvedConfigContext: <
  Extends extends Record<string, any>,
>() => NormalizedConfig<Extends> = () => ResolvedConfigContext.use().value;

export const initAppContext = ({
  appDirectory,
  plugins,
  configFile,
  runtimeConfigFile,
  options,
  serverConfigFile,
}: {
  appDirectory: string;
  plugins: CliPlugin[];
  configFile: string | false;
  runtimeConfigFile: string | false;
  options?: {
    metaName?: string;
    srcDir?: string;
    apiDir?: string;
    distDir?: string;
    sharedDir?: string;
  };
  serverConfigFile: string;
}): IAppContext => {
  const {
    metaName = 'modern-js',
    srcDir = 'src',
    distDir = '',
    apiDir = 'api',
    sharedDir = 'shared',
  } = options || {};
  return {
    metaName,
    appDirectory,
    configFile,
    runtimeConfigFile,
    serverConfigFile,
    ip: address.ip(),
    port: 0,
    packageName: require(path.resolve(appDirectory, './package.json')).name,
    srcDirectory: path.resolve(appDirectory, srcDir),
    apiDirectory: path.resolve(appDirectory, apiDir),
    lambdaDirectory: path.resolve(appDirectory, apiDir, 'lambda'),
    distDirectory: distDir,
    sharedDirectory: path.resolve(appDirectory, sharedDir),
    nodeModulesDirectory: path.resolve(appDirectory, './node_modules'),
    serverPlugins: [],
    internalDirectory: path.resolve(
      appDirectory,
      `./node_modules/.${metaName}`,
    ),
    plugins,
    htmlTemplates: {},
    serverRoutes: [],
    entrypoints: [],
    checkedEntries: [],
    apiOnly: false,
    internalDirAlias: `@_${metaName.replace(/-/g, '_')}_internal`,
    internalSrcAlias: `@_${metaName.replace(/-/g, '_')}_src`,
  };
};

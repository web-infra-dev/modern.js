import path from 'path';
import { address } from '@modern-js/utils';
import { createContext } from '@modern-js/plugin';
import type {
  CliPlugin,
  CliUserConfig,
  IAppContext,
  InternalPlugins,
  CliNormalizedConfig,
} from './types';

export const AppContext = createContext<IAppContext>({} as IAppContext);

export const ConfigContext = createContext<CliUserConfig<any>>({});

export const ResolvedConfigContext = createContext<CliNormalizedConfig<any>>(
  {} as CliNormalizedConfig<any>,
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
>() => CliUserConfig<Extends> = () => ConfigContext.use().value;

/**
 * Get normalized content of user config.
 */
export const useResolvedConfigContext: <
  Extends extends Record<string, any>,
>() => CliNormalizedConfig<Extends> = () => ResolvedConfigContext.use().value;

export const initAppContext = ({
  appDirectory,
  plugins,
  configFile,
  options,
  serverConfigFile,
  serverInternalPlugins,
}: {
  appDirectory: string;
  plugins: CliPlugin[];
  configFile: string | false;
  options?: {
    metaName?: string;
    srcDir?: string;
    distDir?: string;
    sharedDir?: string;
  };
  serverConfigFile: string;
  serverInternalPlugins: InternalPlugins;
}): IAppContext => {
  const {
    metaName = 'modern-js',
    srcDir = 'src',
    distDir = '',
    sharedDir = 'shared',
  } = options || {};

  return {
    metaName,
    appDirectory,
    configFile,
    serverConfigFile,
    serverInternalPlugins,
    ip: address.ip(),
    port: 0,
    packageName: require(path.resolve(appDirectory, './package.json')).name,
    srcDirectory: path.resolve(appDirectory, srcDir),
    distDirectory: distDir,
    sharedDirectory: path.resolve(appDirectory, sharedDir),
    nodeModulesDirectory: path.resolve(appDirectory, './node_modules'),
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

import path from 'path';
import { createContext } from '@modern-js/plugin';
import address from 'address';
import type { IAppContext } from '@modern-js/types';
import { UserConfig } from './config';
import { NormalizedConfig } from './config/mergeConfig';
import type { LoadedPlugin } from './loadPlugins';

export type { IAppContext };

export const AppContext = createContext<IAppContext>({} as IAppContext);

export const ConfigContext = createContext<UserConfig>({} as UserConfig);

export const ResolvedConfigContext = createContext<NormalizedConfig>(
  {} as NormalizedConfig,
);

export const setAppContext = (value: IAppContext) => AppContext.set(value);

export const useAppContext = () => AppContext.use().value;

export const useConfigContext = () => ConfigContext.use().value;

export const useResolvedConfigContext = () => ResolvedConfigContext.use().value;

export const initAppContext = (
  appDirectory: string,
  plugins: Array<LoadedPlugin>,
  configFile: string | false,
  options?: {
    metaName?: string;
    srcDir?: string;
    distDir?: string;
    sharedDir?: string;
  },
): IAppContext => {
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
    existSrc: true,
    internalDirAlias: `@_${metaName.replace(/-/g, '_')}_internal`,
    internalSrcAlias: `@_${metaName.replace(/-/g, '_')}_src`,
  };
};

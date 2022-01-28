import path from 'path';
import { createContext } from '@modern-js/plugin';
import address from 'address';
import type { IAppContext } from '@modern-js/types';
import { UserConfig } from './config';
import { NormalizedConfig } from './config/mergeConfig';

export type { IAppContext };

export const AppContext = createContext<IAppContext>({} as IAppContext);

export const ConfigContext = createContext<UserConfig>({} as UserConfig);

export const ResolvedConfigContext = createContext<NormalizedConfig>(
  {} as NormalizedConfig,
);

export const useAppContext = () => AppContext.use().value;

export const useConfigContext = () => ConfigContext.use().value;

export const useResolvedConfigContext = () => ResolvedConfigContext.use().value;

export const initAppContext = (
  appDirectory: string,
  plugins: Array<{
    cli: any;
    server: any;
  }>,
  configFile: string | false,
  options?: {
    srcDir?: string;
    distDir?: string;
    sharedDir?: string;
    internalDir?: string;
  },
): IAppContext => {
  const {
    srcDir = 'src',
    distDir = '',
    sharedDir = 'shared',
    internalDir = '.modern-js',
  } = options || {};

  return {
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
      `./node_modules/${internalDir}`,
    ),
    plugins,
    htmlTemplates: {},
    serverRoutes: [],
    entrypoints: [],
  };
};

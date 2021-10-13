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
): IAppContext => ({
  appDirectory,
  configFile,
  ip: address.ip(),
  port: 0,
  packageName: require(path.resolve(appDirectory, './package.json')).name,
  srcDirectory: path.resolve(appDirectory, './src'),
  distDirectory: '',
  sharedDirectory: path.resolve(appDirectory, './shared'),
  nodeModulesDirectory: path.resolve(appDirectory, './node_modules'),
  internalDirectory: path.resolve(appDirectory, './node_modules/.modern-js'),
  plugins,
  htmlTemplates: {},
  serverRoutes: [],
  entrypoints: [],
});

import type { AppTools, IAppContext, UserConfig } from '@modern-js/app-tools';
import type { BuilderContext } from '@modern-js/builder-shared';
import type {
  BuilderConfig as WebpackBuilderConfig,
  NormalizedConfig as NormalizedWebpackBuilderConfig,
  WebpackConfig,
  webpack,
} from '@modern-js/builder-webpack-provider';
import type {
  BuilderConfig as RspackBuilderConfig,
  NormalizedConfig as NormalizedRspackBuilderConfig,
  RspackConfig,
  Rspack,
} from '@modern-js/builder-rspack-provider';
import { NormalizedConfig } from '@modern-js/core';
import {
  RouteLegacy,
  NestedRouteForCli,
  PageRoute,
} from '@modern-js/types/cli';
import type { ClientDefinition } from './client';

export type { BuilderContext };

export type FrameworkConfig = UserConfig<AppTools>;

export type TransformedFrameworkConfig = NormalizedConfig<AppTools>;

export type BuilderConfig = WebpackBuilderConfig | RspackBuilderConfig;

export type { WebpackConfig, RspackConfig };

export type Aliases = NonNullable<
  NonNullable<WebpackConfig['resolve']>['alias']
>;

export type BundlerConfig = WebpackConfig | RspackConfig;

export type Compiler =
  | webpack.Compiler
  | Rspack.Compiler
  | webpack.MultiCompiler
  | Rspack.MultiCompiler;

export type NormalizedBuilderConfig =
  | NormalizedWebpackBuilderConfig
  | NormalizedRspackBuilderConfig;

export type AppContext = Omit<IAppContext, 'builder' | 'serverInternalPlugins'>;

export type FileSystemRoutes =
  | RouteLegacy[]
  | (NestedRouteForCli | PageRoute)[];

export interface ServerFunctions {
  getFrameworkConfig: () => Promise<FrameworkConfig>;
  getTransformedFrameworkConfig: () => Promise<TransformedFrameworkConfig>;
  getBuilderConfig: () => Promise<BuilderConfig>;
  getTransformedBuilderConfig: () => Promise<NormalizedBuilderConfig>;
  getBundlerConfigs: () => Promise<BundlerConfig[]>;
  getTransformedBundlerConfigs: () => Promise<BundlerConfig[]>;
  getAppContext: () => Promise<AppContext>;
  getFileSystemRoutes: (entryName: string) => Promise<FileSystemRoutes>;
  getBuilderContext: () => Promise<BuilderContext>;
  getDependencies: () => Promise<Record<string, string>>;
  getCompileTimeCost: () => Promise<number>;
  getClientDefinition: () => Promise<ClientDefinition>;
  echo: (content: string) => string;
}

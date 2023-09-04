import type { AppTools, IAppContext, UserConfig } from '@modern-js/app-tools';
import type { BuilderContext } from '@modern-js/builder-shared';
import type {
  BuilderConfig as WebpackBuilderConfig,
  NormalizedConfig as NormalizedWebpackBuilderConfig,
  WebpackConfig,
} from '@modern-js/builder-webpack-provider';
import type {
  BuilderConfig as RspackBuilderConfig,
  NormalizedConfig as NormalizedRspackBuilderConfig,
  RspackConfig,
} from '@modern-js/builder-rspack-provider';
import { NormalizedConfig } from '@modern-js/core';
import {
  RouteLegacy,
  NestedRouteForCli,
  PageRoute,
} from '@modern-js/types/cli';

export type { BuilderContext };

export type FrameworkConfig = UserConfig<AppTools>;

export type TransformedFrameworkConfig = NormalizedConfig<AppTools>;

export type BuilderConfig = WebpackBuilderConfig | RspackBuilderConfig;

export type { WebpackConfig, RspackConfig };

export type Aliases = NonNullable<
  NonNullable<WebpackConfig['resolve']>['alias']
>;

export type BundlerConfig = WebpackConfig | RspackConfig;

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
  echo: (content: string) => string;
}

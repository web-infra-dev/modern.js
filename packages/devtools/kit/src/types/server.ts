import type { AppTools, IAppContext, UserConfig } from '@modern-js/app-tools';
import type { BuilderContext } from '@modern-js/builder-shared';
import type { JsonValue } from 'type-fest';
import { NormalizedConfig } from '@modern-js/core';
import {
  RouteLegacy,
  NestedRouteForCli,
  PageRoute,
} from '@modern-js/types/cli';

export type { BuilderContext };

export type FrameworkConfig = UserConfig<AppTools>;

export type FinalFrameworkConfig = NormalizedConfig<AppTools>;

export type AppContext = Omit<
  IAppContext,
  'builder' | 'plugins' | 'serverInternalPlugins'
>;

export type FileSystemRoutes =
  | RouteLegacy[]
  | (NestedRouteForCli | PageRoute)[];

export interface ServerFunctions {
  getFrameworkConfig: () => Promise<FrameworkConfig>;
  getFinalFrameworkConfig: () => Promise<FinalFrameworkConfig>;
  getBuilderConfig: () => Promise<JsonValue>;
  getFinalBuilderConfig: () => Promise<JsonValue>;
  getBundlerConfigs: () => Promise<JsonValue[]>;
  getFinalBundlerConfigs: () => Promise<JsonValue[]>;
  getAppContext: () => Promise<AppContext>;
  getFileSystemRoutes: (entryName: string) => Promise<FileSystemRoutes>;
  getBuilderContext: () => Promise<BuilderContext>;
  echo: (content: string) => string;
}

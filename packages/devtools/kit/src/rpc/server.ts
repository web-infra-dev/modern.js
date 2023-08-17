import type { AppTools, IAppContext } from '@modern-js/app-tools';
import { NormalizedConfig } from '@modern-js/core';
import {
  RouteLegacy,
  NestedRouteForCli,
  PageRoute,
} from '@modern-js/types/cli';

export type FrameworkConfig = NormalizedConfig<AppTools>;

export type AppContext = Omit<
  IAppContext,
  'builder' | 'plugins' | 'serverInternalPlugins'
>;

export type FileSystemRoutes =
  | RouteLegacy[]
  | (NestedRouteForCli | PageRoute)[];

export interface ServerFunctions {
  getFrameworkConfig: () => Promise<FrameworkConfig>;
  getAppContext: () => Promise<AppContext>;
  getFileSystemRoutes: (entryName: string) => Promise<FileSystemRoutes>;
  echo: (content: string) => string;
}

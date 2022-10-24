import type { Merge } from 'type-fest';
import { InternalPlugins } from '../common';
import { ServerRoute } from '../server';

/**
 * Bundle entrypoint
 */
export interface Entrypoint {
  entryName: string;
  entry: string;
  nestedRoutesEntry?: string;
  isAutoMount?: boolean;
  customBootstrap?: string | false;
  fileSystemRoutes?: {
    globalApp?: string | false;
    routes?: any[];
  };
  configRoutes?: string | false;
}

/**
 * file system routes.
 */
export type RouteLegacy = {
  path: string;
  exact: boolean;
  component: string;
  _component: string;
  routes?: RouteLegacy[];
  parent?: RouteLegacy;
};

export type Route = Partial<{
  caseSensitive: boolean;
  path: string;
  id: string;
  loader: any;
  action: any;
  hasErrorBoundary: boolean;
  shouldRevalidate: any;
  handle: any;
  index: boolean;
  children: Route[] | undefined;
  element: React.ReactNode | null;
  errorElement: React.ReactNode | null;
}> & {
  type: string;
};

export type NestedRoute = Merge<
  Route,
  {
    type: 'nested';
    parentId?: string;
    children?: NestedRoute[];
    childIds?: string[];
    filename?: string;
    _component?: string;
    component?: string;
    loading?: string;
    error?: string;
  }
>;

export type PageRoute = Merge<
  Route,
  {
    type: 'page';
    parent?: PageRoute;
    _component: string;
    component: string;
    children?: PageRoute[];
  }
>;

/**
 * custom html partials.
 */
export interface HtmlPartials {
  top: string[];
  head: string[];
  body: string[];
}

export interface HtmlTemplates {
  [name: string]: string;
}

export interface IAppContext {
  metaName: string; // name for generating conventional constants, such as .modern-js
  appDirectory: string;
  configFile: string | false;
  serverConfigFile: string;
  serverInternalPlugins: InternalPlugins;
  ip?: string;
  port?: number;
  distDirectory: string;
  packageName: string;
  srcDirectory: string;
  sharedDirectory: string;
  nodeModulesDirectory: string;
  internalDirectory: string;
  plugins: any[];
  entrypoints: Entrypoint[];
  checkedEntries: string[];
  serverRoutes: ServerRoute[];
  htmlTemplates: HtmlTemplates;
  apiOnly: boolean;
  internalDirAlias: string;
  internalSrcAlias: string;
}

export type { Merge } from 'type-fest';

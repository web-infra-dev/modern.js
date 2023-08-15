import type { Merge } from 'type-fest';

import type { Config as JestConfigTypes } from '@jest/types';

export type JestConfig = JestConfigTypes.Config;

export interface TestConfig {
  /**
   * Decide which transformer will be used to compile file
   * Default: babel-jest
   */
  transformer?: 'babel-jest' | 'ts-jest';

  /**
   * Original jest config
   * Doc: https://jestjs.io/docs/configuration
   */
  jest?: JestConfig | ((jestConfig: JestConfig) => JestConfig);
}

/**
 * Bundle entrypoint
 */
export interface Entrypoint {
  entryName: string;
  isMainEntry: boolean;
  entry: string;
  internalEntry?: string;
  nestedRoutesEntry?: string;
  pageRoutesEntry?: string;
  isAutoMount?: boolean;
  customBootstrap?: string | false;
  fileSystemRoutes?: {
    globalApp?: string | false;
    routes?: any[];
  };
  absoluteEntryDir?: string;
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

export type NestedRouteForCli = NestedRoute<string>;

export type NestedRoute<T = string | (() => JSX.Element)> = Merge<
  Route,
  {
    type: 'nested';
    parentId?: string;
    children?: NestedRoute<T>[];
    filename?: string;
    _component?: string;
    component?: T;
    lazyImport?: () => Promise<any>;
    loading?: T;
    error?: T;
    isRoot?: boolean;
    config?: string | Record<string, any>;
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

export type SSGRouteOptions =
  | string
  | {
      url: string;
      output?: string;
      params?: Record<string, any>[];
      headers?: Record<string, any>;
    };

export type SSGSingleEntryOptions =
  | boolean
  | {
      preventDefault?: string[];
      headers?: Record<string, any>;
      routes?: SSGRouteOptions[];
    };

export type SSGMultiEntryOptions = Record<string, SSGSingleEntryOptions>;

export type SSGConfig =
  | boolean
  | SSGSingleEntryOptions
  | SSGMultiEntryOptions
  | ((
      entryName: string,
      payload: { baseUrl?: string },
    ) => SSGSingleEntryOptions);

export type { Merge } from 'type-fest';

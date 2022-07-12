import { ServerRoute } from '../server';

/**
 * Bundle entrypoint
 */
export interface Entrypoint {
  entryName: string;
  entry: string;
  isAutoMount?: boolean;
  customBootstrap?: string | false;
  fileSystemRoutes?: {
    globalApp?: string | false;
    routes?: any[];
  };
}

/**
 * file system routes.
 */
export interface Route {
  path: string;
  exact: boolean;
  component: string;
  _component: string;
  routes?: Route[];
  parent?: Route;
}

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
  ip?: string;
  port?: number;
  distDirectory: string;
  packageName: string;
  srcDirectory: string;
  sharedDirectory: string;
  nodeModulesDirectory: string;
  internalDirectory: string;
  plugins: {
    cli?: any;
    server?: any;
    serverPkg?: any;
  }[];
  entrypoints: Entrypoint[];
  checkedEntries: string[];
  serverRoutes: ServerRoute[];
  htmlTemplates: HtmlTemplates;
  apiOnly: boolean;
  internalDirAlias: string;
  internalSrcAlias: string;
}

import { AsyncWaterfall, AsyncWorkflow } from '@modern-js/plugin';
import { Compiler, MultiCompiler, Configuration } from 'webpack';

export type { Compiler, MultiCompiler, Configuration };

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
 *  server route
 */
export interface ServerRoute {
  urlPath: string;
  entryName?: string;
  entryPath: string;
  isSPA: boolean;
  isSSR: boolean;
  isApi?: boolean;
  bundle?: string;
  enableModernMode?: boolean;
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
  appDirectory: string;
  configFile: string | false;
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
  }[];
  entrypoints: Entrypoint[];
  serverRoutes: ServerRoute[];
  htmlTemplates: HtmlTemplates;
}

export interface Hooks {
  beforeDev: AsyncWorkflow<void, unknown>;
  afterDev: AsyncWorkflow<void, unknown>;
  beforeCreateCompiler: AsyncWorkflow<
    {
      webpackConfigs: Configuration[];
    },
    unknown
  >;

  afterCreateCompiler: AsyncWorkflow<
    {
      compiler: Compiler | MultiCompiler | undefined;
    },
    unknown
  >;
  beforePrintInstructions: AsyncWaterfall<{
    instructions: string;
  }>;
  beforeBuild: AsyncWorkflow<
    {
      webpackConfigs: Configuration[];
    },
    unknown
  >;
  afterBuild: AsyncWorkflow<void, unknown>;
  beforeDeploy: AsyncWorkflow<void, unknown>;
  afterDeploy: AsyncWorkflow<void, unknown>;
  modifyEntryExport: AsyncWaterfall<{
    entrypoint: Entrypoint;
    exportStatement: string;
  }>;
  modifyEntryImports: AsyncWaterfall<{
    imports: ImportStatement[];
    entrypoint: Entrypoint;
  }>;
  modifyEntryRuntimePlugins: AsyncWaterfall<{
    entrypoint: Entrypoint;
    plugins: RuntimePlugin[];
  }>;
  modifyEntryRenderFunction: AsyncWaterfall<{
    entrypoint: Entrypoint;
    code: string;
  }>;
  modifyFileSystemRoutes: AsyncWaterfall<{
    entrypoint: Entrypoint;
    routes: Route[];
  }>;
  modifyServerRoutes: AsyncWaterfall<{
    routes: ServerRoute[];
  }>;
  htmlPartials: AsyncWaterfall<{
    entrypoint: Entrypoint;
    partials: HtmlPartials;
  }>;
  addRuntimeExports: AsyncWaterfall<void>;
}

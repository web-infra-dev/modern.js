import { AsyncWaterfall, AsyncWorkflow } from '@modern-js/plugin';
import { Compiler, MultiCompiler, Configuration } from 'webpack';
import { ServerRoute } from '../server';

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
    cliPkg?: any;
    server?: any;
    serverPkg?: any;
  }[];
  entrypoints: Entrypoint[];
  checkedEntries: string[];
  serverRoutes: ServerRoute[];
  htmlTemplates: HtmlTemplates;
  existSrc: boolean;
  internalDirAlias: string;
  internalSrcAlias: string;
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
  afterMonorepoDeploy: AsyncWorkflow<
    { operator: any; deployProjectNames: string[] },
    void
  >;
  beforeDeploy: AsyncWorkflow<Record<string, any>, unknown>;
  afterDeploy: AsyncWorkflow<Record<string, any>, unknown>;
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
  beforeGenerateRoutes: AsyncWaterfall<{
    entrypoint: Entrypoint;
    code: string;
  }>;
  addDefineTypes: AsyncWaterfall<void>;
}

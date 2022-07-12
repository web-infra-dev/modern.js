import { AsyncWaterfall, AsyncWorkflow } from '@modern-js/plugin';
import { Entrypoint, HtmlPartials, Route, ServerRoute } from '@modern-js/types';
import { Compiler, Configuration, MultiCompiler } from 'webpack';

export interface ImportSpecifier {
  local?: string;
  imported?: string;
}

export interface ImportStatement {
  specifiers: ImportSpecifier[];
  value: string;
  initialize?: string;
}

export interface RuntimePlugin {
  name: string;
  options: string;
  args?: string;
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

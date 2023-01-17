import type { webpack } from '@modern-js/builder-webpack-provider';
import type {
  AsyncWaterfall,
  AsyncWorkflow,
  ParallelWorkflow,
} from '@modern-js/plugin';
import type {
  Entrypoint,
  HtmlPartials,
  NestedRoute,
  PageRoute,
  RouteLegacy,
  ServerRoute,
} from '@modern-js/types';
import type { RegisterBuildPlatformResult, DevToolData } from '@modern-js/core';
import type { Stats, MultiStats } from '@modern-js/builder-shared';

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
export type AppToolsHooks = {
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
  modifyAsyncEntry: AsyncWaterfall<{
    entrypoint: Entrypoint;
    code: string;
  }>;
  modifyFileSystemRoutes: AsyncWaterfall<{
    entrypoint: Entrypoint;
    routes: RouteLegacy[] | (NestedRoute | PageRoute)[];
  }>;
  modifyServerRoutes: AsyncWaterfall<{
    routes: ServerRoute[];
  }>;
  htmlPartials: AsyncWaterfall<{
    entrypoint: Entrypoint;
    partials: HtmlPartials;
  }>;
  beforeGenerateRoutes: AsyncWaterfall<{
    entrypoint: Entrypoint;
    code: string;
  }>;
  addDefineTypes: AsyncWaterfall<void>;
  collectServerPlugins: AsyncWaterfall<{
    plugins: Array<Record<string, string>>;
  }>;

  // beforeCreateBuilder
  beforeDev: AsyncWorkflow<void, unknown>;
  afterDev: AsyncWorkflow<void, unknown>;
  beforeCreateCompiler: AsyncWorkflow<
    { bundlerConfigs: webpack.Configuration[] },
    unknown
  >;
  afterCreateCompiler: AsyncWorkflow<
    { compiler?: webpack.Compiler | webpack.MultiCompiler },
    unknown
  >;
  beforePrintInstructions: AsyncWaterfall<{ instructions: string }>;
  beforeBuild: AsyncWorkflow<
    { bundlerConfigs?: webpack.Configuration[] },
    unknown
  >;
  afterBuild: AsyncWorkflow<{ stats?: Stats | MultiStats }, unknown>;
  beforeDeploy: AsyncWorkflow<Record<string, any>, unknown>;
  afterDeploy: AsyncWorkflow<Record<string, any>, unknown>;

  beforeRestart: AsyncWorkflow<void, void>;

  registerDev: ParallelWorkflow<void, DevToolData>;
  beforeDevTask: ParallelWorkflow<DevToolData, void>;

  registerBuildPlatform: ParallelWorkflow<void, RegisterBuildPlatformResult>;
  beforeBuildPlatform: ParallelWorkflow<RegisterBuildPlatformResult[], void>;
};

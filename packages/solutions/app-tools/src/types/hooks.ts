import type {
  AsyncWaterfall,
  AsyncWorkflow,
  ParallelWorkflow,
} from '@modern-js/plugin';
import type {
  Entrypoint,
  HtmlPartials,
  NestedRouteForCli,
  PageRoute,
  RouteLegacy,
  ServerRoute,
} from '@modern-js/types';
import type { RegisterBuildPlatformResult, DevToolData } from '@modern-js/core';
import type { Stats, MultiStats } from '@rsbuild/shared';
import type { Rspack, webpack } from '@modern-js/uni-builder';
import { Bundler } from './utils';

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
  implementation: string;
  config: Record<string, any>;
}

export type AppToolsHooks<B extends Bundler = 'webpack'> = {
  _internalRuntimePlugins: AsyncWaterfall<{
    entrypoint: Entrypoint;
    plugins: RuntimePlugin[];
  }>;
  modifyFileSystemRoutes: AsyncWaterfall<{
    entrypoint: Entrypoint;
    routes: RouteLegacy[] | (NestedRouteForCli | PageRoute)[];
  }>;
  modifyServerRoutes: AsyncWaterfall<{
    routes: ServerRoute[];
  }>;
  modifyEntrypoints: AsyncWaterfall<{
    entrypoints: Entrypoint[];
  }>;
  checkEntryPoint: AsyncWaterfall<{
    path: string;
    entry: false | string;
  }>;
  generateEntryCode: AsyncWaterfall<{ entrypoints: Entrypoint[] }>;
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
  afterDev: AsyncWorkflow<{ isFirstCompile: boolean }, unknown>;
  beforeCreateCompiler: AsyncWorkflow<
    {
      bundlerConfigs?: B extends 'rspack'
        ? Rspack.Configuration[]
        : webpack.Configuration[];
    },
    unknown
  >;
  afterCreateCompiler: AsyncWorkflow<
    {
      compiler?: B extends 'rspack'
        ? Rspack.Compiler
        : webpack.Compiler | webpack.MultiCompiler;
    },
    unknown
  >;
  beforePrintInstructions: AsyncWaterfall<{ instructions: string }>;
  beforeBuild: AsyncWorkflow<
    {
      bundlerConfigs?: B extends 'rspack'
        ? Rspack.Configuration[]
        : webpack.Configuration[];
    },
    unknown
  >;
  afterBuild: AsyncWorkflow<{ stats?: Stats | MultiStats }, unknown>;
  beforeDeploy: AsyncWorkflow<Record<string, any>, unknown>;
  deploy: AsyncWorkflow<Record<string, any>, unknown>;
  afterDeploy: AsyncWorkflow<Record<string, any>, unknown>;

  beforeRestart: AsyncWorkflow<void, void>;

  registerDev: ParallelWorkflow<void, DevToolData>;
  beforeDevTask: ParallelWorkflow<DevToolData, void>;

  registerBuildPlatform: ParallelWorkflow<void, RegisterBuildPlatformResult>;
  beforeBuildPlatform: ParallelWorkflow<RegisterBuildPlatformResult[], void>;
};

import type { AsyncWaterfall, AsyncWorkflow } from '@modern-js/plugin';
import type {
  RuntimePluginConfig,
  ServerPluginConfig,
} from '@modern-js/plugin-v2';
import type {
  Entrypoint,
  HtmlPartials,
  NestedRouteForCli,
  PageRoute,
  RouteLegacy,
  ServerRoute,
} from '@modern-js/types';
import type {
  MultiStats,
  Rspack,
  Stats,
  webpack,
} from '@modern-js/uni-builder';

export interface ImportSpecifier {
  local?: string;
  imported?: string;
}

export type AppToolsHooks = {
  _internalRuntimePlugins: AsyncWaterfall<{
    entrypoint: Entrypoint;
    plugins: RuntimePluginConfig[];
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
  generateEntryCode: AsyncWorkflow<{ entrypoints: Entrypoint[] }, void>;
  htmlPartials: AsyncWaterfall<{
    entrypoint: Entrypoint;
    partials: HtmlPartials;
  }>;
  beforeGenerateRoutes: AsyncWaterfall<{
    entrypoint: Entrypoint;
    code: string;
  }>;

  _internalServerPlugins: AsyncWaterfall<{ plugins: ServerPluginConfig[] }>;

  // beforeCreateBuilder
  beforeDev: AsyncWorkflow<void, unknown>;
  afterDev: AsyncWorkflow<{ isFirstCompile: boolean }, unknown>;
  beforeCreateCompiler: AsyncWorkflow<
    {
      bundlerConfigs?: Rspack.Configuration[];
    },
    unknown
  >;
  afterCreateCompiler: AsyncWorkflow<
    {
      compiler?: Rspack.Compiler;
    },
    unknown
  >;
  beforePrintInstructions: AsyncWaterfall<{ instructions: string }>;
  beforeBuild: AsyncWorkflow<
    {
      bundlerConfigs?: Rspack.Configuration[];
    },
    unknown
  >;
  afterBuild: AsyncWorkflow<{ stats?: Stats | MultiStats }, unknown>;
  beforeDeploy: AsyncWorkflow<Record<string, any>, unknown>;
  deploy: AsyncWorkflow<Record<string, any>, unknown>;
  afterDeploy: AsyncWorkflow<Record<string, any>, unknown>;

  beforeRestart: AsyncWorkflow<void, void>;
};

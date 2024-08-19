import {
  createAsyncWaterfall,
  createAsyncWorkflow,
  createParallelWorkflow,
} from '@modern-js/plugin';
import type { DevToolData, RegisterBuildPlatformResult } from '@modern-js/core';
import type { AppToolsHooks } from './types/hooks';

export const hooks: AppToolsHooks = {
  _internalRuntimePlugins: createAsyncWaterfall(),
  modifyFileSystemRoutes: createAsyncWaterfall(),
  modifyServerRoutes: createAsyncWaterfall(),
  /** add entry point info to entrypoints array */
  modifyEntrypoints: createAsyncWaterfall(),
  /** add entry type */
  checkEntryPoint: createAsyncWaterfall(),
  generateEntryCode: createAsyncWorkflow(),
  htmlPartials: createAsyncWaterfall(),
  beforeGenerateRoutes: createAsyncWaterfall(),
  addDefineTypes: createAsyncWaterfall(),
  collectServerPlugins: createAsyncWaterfall(),
  _internalServerPlugins: createAsyncWaterfall(),
  beforeDev: createAsyncWorkflow(),
  afterDev: createAsyncWorkflow(),
  beforeCreateCompiler: createAsyncWorkflow(),
  afterCreateCompiler: createAsyncWorkflow(),
  beforePrintInstructions: createAsyncWaterfall(),
  beforeBuild: createAsyncWorkflow(),
  afterBuild: createAsyncWorkflow(),
  beforeDeploy: createAsyncWorkflow(),
  deploy: createAsyncWorkflow(),
  afterDeploy: createAsyncWorkflow(),

  beforeRestart: createAsyncWorkflow(),

  registerDev: createParallelWorkflow<void, DevToolData>(),
  beforeDevTask: createParallelWorkflow<DevToolData, void>(),

  registerBuildPlatform: createParallelWorkflow<
    void,
    RegisterBuildPlatformResult
  >(),
  beforeBuildPlatform: createParallelWorkflow<
    RegisterBuildPlatformResult[],
    void
  >(),
};

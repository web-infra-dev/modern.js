import type { DevToolData, RegisterBuildPlatformResult } from '@modern-js/core';
import {
  createAsyncWaterfall,
  createAsyncWorkflow,
  createParallelWorkflow,
} from '@modern-js/plugin';
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

  /**
   * @deprecated
   */
  registerDev: createParallelWorkflow<void, DevToolData>(),
  /**
   * @deprecated
   */
  registerBuildPlatform: createParallelWorkflow<
    void,
    RegisterBuildPlatformResult
  >(),
};

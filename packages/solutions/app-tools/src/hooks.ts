import {
  createAsyncWaterfall,
  createAsyncWorkflow,
  createParallelWorkflow,
} from '@modern-js/plugin';
import { DevToolData, RegisterBuildPlatformResult } from '@modern-js/core';
import { AppToolsHooks } from './types/hooks';

export const hooks: AppToolsHooks = {
  modifyEntryExport: createAsyncWaterfall(),
  modifyEntryImports: createAsyncWaterfall(),
  modifyEntryRuntimePlugins: createAsyncWaterfall(),
  modifyEntryRenderFunction: createAsyncWaterfall(),
  modifyAsyncEntry: createAsyncWaterfall(),
  modifyFileSystemRoutes: createAsyncWaterfall(),
  modifyServerRoutes: createAsyncWaterfall(),
  htmlPartials: createAsyncWaterfall(),
  beforeGenerateRoutes: createAsyncWaterfall(),
  addDefineTypes: createAsyncWaterfall(),
  collectServerPlugins: createAsyncWaterfall(),

  beforeDev: createAsyncWorkflow(),
  afterDev: createAsyncWorkflow(),
  beforeCreateCompiler: createAsyncWorkflow(),
  afterCreateCompiler: createAsyncWorkflow(),
  beforePrintInstructions: createAsyncWaterfall(),
  beforeBuild: createAsyncWorkflow(),
  afterBuild: createAsyncWorkflow(),
  beforeDeploy: createAsyncWorkflow(),
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

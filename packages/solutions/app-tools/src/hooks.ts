import {
  createAsyncWaterfall,
  createAsyncWorkflow,
  createParallelWorkflow,
} from '@modern-js/plugin';
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

  beforeDev: createAsyncWorkflow(),
  afterDev: createAsyncWorkflow(),
  beforeCreateCompiler: createAsyncWorkflow(),
  afterCreateCompiler: createAsyncWorkflow(),
  beforePrintInstructions: createAsyncWaterfall(),
  beforeBuild: createAsyncWorkflow(),
  afterBuild: createAsyncWorkflow(),
  beforeDeploy: createAsyncWorkflow(),
  afterDeploy: createAsyncWorkflow(),

  watchFiles: createParallelWorkflow(),
  fileChange: createAsyncWorkflow(),
  beforeRestart: createAsyncWorkflow(),
};

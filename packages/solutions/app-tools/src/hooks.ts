import { createAsyncWaterfall, createAsyncWorkflow } from '@modern-js/plugin';
import type { webpack } from '@modern-js/builder-webpack-provider/types';

export const beforeDev = createAsyncWorkflow();

export const afterDev = createAsyncWorkflow();

export const beforeCreateCompiler = createAsyncWorkflow();

export const afterCreateCompiler = createAsyncWorkflow<{
  compiler: webpack.Compiler | webpack.MultiCompiler | undefined;
}>();

export const beforePrintInstructions = createAsyncWaterfall<{
  instructions: string;
}>();

export const beforeBuild = createAsyncWorkflow();

export const afterBuild = createAsyncWorkflow();

export const beforeDeploy = createAsyncWorkflow<Record<string, any>>();

export const afterDeploy = createAsyncWorkflow<Record<string, any>>();

export const hooks = {
  beforeDev,
  afterDev,
  beforeCreateCompiler,
  afterCreateCompiler,
  beforePrintInstructions,
  beforeBuild,
  afterBuild,
  beforeDeploy,
  afterDeploy,
};

export type AppHooks = typeof hooks;

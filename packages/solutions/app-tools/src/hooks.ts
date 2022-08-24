import {
  createAsyncWaterfall,
  createAsyncWorkflow,
  createAsyncPipeline,
} from '@modern-js/plugin';
import type {
  Compiler,
  Configuration,
  MultiCompiler,
} from '@modern-js/webpack';

export const beforeDev = createAsyncWorkflow();

export const afterDev = createAsyncWorkflow();

export const beforeCreateCompiler = createAsyncWorkflow<{
  webpackConfigs: Configuration[];
}>();

export const afterCreateCompiler = createAsyncWorkflow<{
  compiler: Compiler | MultiCompiler | undefined;
}>();

export const beforePrintInstructions = createAsyncWaterfall<{
  instructions: string;
}>();

export const beforeBuild = createAsyncWorkflow<{
  webpackConfigs: Configuration[];
}>();

export const afterBuild = createAsyncWorkflow();

export const beforeDeploy = createAsyncWorkflow<Record<string, any>>();

export const afterDeploy = createAsyncWorkflow<Record<string, any>>();

export type Addon =
  | string
  | {
      name: string;
      options?: any;
    };
export const extendInternalAddons = createAsyncPipeline<Addon[], Addon[]>();

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
  extendInternalAddons,
};

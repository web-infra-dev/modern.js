import { createAsyncWaterfall, createAsyncWorkflow } from '@modern-js/plugin';
import { registerHook } from '@modern-js/core';

import type { Compiler, Configuration, MultiCompiler } from '@modern-js/types';

export const beforeDev = createAsyncWorkflow();

export const afterDev = createAsyncWorkflow();

export const beforeCreateCompiler = createAsyncWorkflow<{
  webpackConfigs: Configuration[];
}>();

export const afterCreateCompiler = createAsyncWorkflow<{
  compiler: Compiler | MultiCompiler | undefined;
}>();

export const beforePrintInstructions =
  createAsyncWaterfall<{ instructions: string }>();

export const beforeBuild = createAsyncWorkflow<{
  webpackConfigs: Configuration[];
}>();

export const afterBuild = createAsyncWorkflow();

export const beforeDeploy = createAsyncWorkflow();

export const afterDeploy = createAsyncWorkflow();

export const lifecycle = () => {
  registerHook({
    beforeDev,
    afterDev,
    beforeCreateCompiler,
    afterCreateCompiler,
    beforePrintInstructions,
    beforeBuild,
    afterBuild,
    beforeDeploy,
    afterDeploy,
  });
};

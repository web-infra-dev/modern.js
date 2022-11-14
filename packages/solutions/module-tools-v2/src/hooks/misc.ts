import { createAsyncPipeline, createAsyncWaterfall } from '@modern-js/plugin';

export const miscHooks = {
  addRuntimeExports: createAsyncWaterfall(),
  addTailwindCssConfig: createAsyncPipeline<undefined, any>(),
};

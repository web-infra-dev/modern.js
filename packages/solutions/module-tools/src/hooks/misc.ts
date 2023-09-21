import { createAsyncWaterfall, createAsyncPipeline } from '@modern-js/plugin';

export const miscHooks = {
  addRuntimeExports: createAsyncWaterfall(),
  /**
   * @deprecated
   * use buildConfig.hooks and buildConfig.esbuildOptions instead.
   */
  modifyLibuild: createAsyncPipeline(),
};

import { createAsyncWaterfall, createAsyncPipeline } from '@modern-js/plugin';
import type { ModuleUserConfig } from '../types';

export const miscHooks = {
  addRuntimeExports: createAsyncWaterfall(),
  /**
   * Change user configuration
   */
  resolveModuleUserConfig: createAsyncWaterfall<ModuleUserConfig>(),
  /**
   * @deprecated
   * use buildConfig.hooks and buildConfig.esbuildOptions instead.
   */
  modifyLibuild: createAsyncPipeline(),
};

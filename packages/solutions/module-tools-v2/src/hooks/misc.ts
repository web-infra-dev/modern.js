import { createAsyncPipeline, createAsyncWaterfall } from '@modern-js/plugin';
import type { CLIConfig } from '@modern-js/libuild';

export const miscHooks = {
  addRuntimeExports: createAsyncWaterfall(),
  modifyLibuild: createAsyncPipeline<CLIConfig, CLIConfig>(),
};

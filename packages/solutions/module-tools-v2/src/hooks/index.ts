import { createAsyncWaterfall } from '@modern-js/plugin';
import { buildHooks } from './build';
import { devHooks } from './dev';

export const registerHook = {
  ...buildHooks,
  ...devHooks,
  addRuntimeExports: createAsyncWaterfall(),
};

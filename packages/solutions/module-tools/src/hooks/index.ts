import { createAsyncWaterfall } from '@modern-js/plugin';
import { buildHooks, lifecycle as buildLifeCycle } from './build';
import { devHooks, lifecycle as devLifeCycle } from './dev';

export { buildLifeCycle, devLifeCycle };

export const lifecycle = () => {
  devLifeCycle();
  buildLifeCycle();
};

export const addRuntimeExports = createAsyncWaterfall();

export const hooks = {
  ...buildHooks,
  ...devHooks,
  addRuntimeExports,
};

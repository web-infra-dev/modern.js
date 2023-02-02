import { buildHooks, buildWatchHooks } from './build';
import { devHooks } from './dev';
import { miscHooks } from './misc';

export const registerHook = {
  ...buildHooks,
  ...devHooks,
  ...miscHooks,
  ...buildWatchHooks,
};

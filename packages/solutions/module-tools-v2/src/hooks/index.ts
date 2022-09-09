import { buildHooks } from './build';
import { devHooks } from './dev';

export const registerHook = {
  ...buildHooks,
  ...devHooks,
};

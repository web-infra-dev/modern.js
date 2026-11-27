import type { RuntimePlugin, RuntimePluginExtends } from '@modern-js/plugin';

/** Node builds select the streaming adapter. Browser roots retain their shape. */
export const bridgeStreamPlugin = (): RuntimePlugin<
  Required<RuntimePluginExtends>
> => ({
  name: '@modern-js/module-federation-bridge-stream',
  setup() {},
});

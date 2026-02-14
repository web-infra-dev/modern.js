import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';
import nodeFetch from 'node-fetch';

const injectNodeFetchPlugin: () => ModuleFederationRuntimePlugin = () => ({
  name: 'inject-node-fetch-plugin',
  beforeInit(args) {
    if (!globalThis.fetch) {
      // @ts-expect-error inject node-fetch
      globalThis.fetch = nodeFetch;
    }
    return args;
  },
});
export default injectNodeFetchPlugin;

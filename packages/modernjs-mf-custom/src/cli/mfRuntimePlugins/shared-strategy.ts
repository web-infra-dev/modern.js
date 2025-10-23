import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';

const sharedStrategy: () => ModuleFederationRuntimePlugin = () => ({
  name: 'shared-strategy-plugin',
  beforeInit(args) {
    const { userOptions } = args;
    const shared = userOptions.shared;
    if (shared) {
      Object.keys(shared).forEach(sharedKey => {
        const sharedConfigs = shared[sharedKey];
        const arraySharedConfigs = Array.isArray(sharedConfigs)
          ? sharedConfigs
          : [sharedConfigs];
        arraySharedConfigs.forEach(s => {
          s.strategy = 'loaded-first';
        });
      });
    }
    return args;
  },
});
export default sharedStrategy;

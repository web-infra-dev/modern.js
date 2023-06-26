import { DefaultBuilderPlugin, BundlerConfig } from '@modern-js/builder-shared';

export function builderPluginExternals(): DefaultBuilderPlugin {
  return {
    name: 'builder-plugin-externals',
    setup(api) {
      api.modifyBundlerChain(chain => {
        const { externals } = api.getNormalizedConfig().output;
        if (externals) {
          chain.externals(externals);
        }
      });

      api.onBeforeCreateCompiler(({ bundlerConfigs }) => {
        (bundlerConfigs as BundlerConfig[]).forEach(config => {
          const isWebWorker = Array.isArray(config.target)
            ? config.target.includes('webworker')
            : config.target === 'webworker';

          // externals will not take effect, the Worker environment can not access global variables.
          if (isWebWorker && config.externals) {
            delete config.externals;
          }
        });
      });
    },
  };
}

import { BuilderPlugin } from '../types';

export function PluginExternals(): BuilderPlugin {
  return {
    name: 'builder-plugin-externals',
    setup(api) {
      api.modifyRspackConfig(rspackConfig => {
        const { externals } = api.getNormalizedConfig().output;
        if (externals) {
          rspackConfig.externals = externals;
        }
      });

      api.onBeforeCreateCompiler(({ bundlerConfigs }) => {
        bundlerConfigs.forEach(config => {
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

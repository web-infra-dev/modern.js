import { BuilderPlugin } from '../types';

export function PluginExternals(): BuilderPlugin {
  return {
    name: 'builder-plugin-externals',
    setup(api) {
      api.modifyWebpackChain(chain => {
        const { externals } = api.getNormalizedConfig().output;
        if (externals) {
          chain.externals(externals);
        }
      });

      api.onBeforeCreateCompiler(({ bundlerConfigs }) => {
        bundlerConfigs.forEach(config => {
          const isWebWorker = Array.isArray(config.target)
            ? config.target.includes('webworker')
            : config.target === 'webworker';

          if (isWebWorker && config.externals) {
            delete config.externals;
          }
        });
      });
    },
  };
}

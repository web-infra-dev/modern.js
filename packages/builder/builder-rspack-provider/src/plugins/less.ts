import type { BuilderPlugin } from '../types';
import {
  isUseCssSourceMap,
  LESS_REGEX,
  setConfig,
} from '@modern-js/builder-shared';

export function PluginLess(): BuilderPlugin {
  return {
    name: 'builder-plugin-less',
    setup(api) {
      api.modifyRspackConfig(async (rspackConfig, utils) => {
        const config = api.getNormalizedConfig();
        const { applyOptionsChain } = await import('@modern-js/utils');
        const { getCssLoaderUses } = await import('./css');

        const getLessLoaderOptions = () => {
          // todo: support addExcludes
          const defaultLessLoaderOptions = {
            lessOptions: { javascriptEnabled: true },
            sourceMap: isUseCssSourceMap(config),
            implementation: utils.getCompiledPath('less'),
          };
          const mergedOptions = applyOptionsChain(
            defaultLessLoaderOptions,
            config.tools.less,
            {},
          );

          return mergedOptions;
        };

        const cssLoaderUses = await getCssLoaderUses(
          config,
          api.context,
          utils,
        );

        const lessLoaderOptions = getLessLoaderOptions();

        const { default: lessLoader } = await import(
          utils.getCompiledPath('@rspack/less-loader')
        );

        setConfig(rspackConfig, 'module.rules', [
          ...(rspackConfig.module?.rules || []),
          {
            name: 'less',
            test: LESS_REGEX,
            use: [
              ...cssLoaderUses,
              {
                name: 'less',
                loader: lessLoader,
                options: lessLoaderOptions,
              },
            ],
            type: 'css',
          },
        ]);
      });
    },
  };
}

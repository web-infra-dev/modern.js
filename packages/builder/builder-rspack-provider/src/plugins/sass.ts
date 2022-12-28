import {
  isUseCssSourceMap,
  SASS_REGEX,
  FileFilterUtil,
  setConfig,
} from '@modern-js/builder-shared';
import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin } from '../types';

export function PluginSass(): BuilderPlugin {
  return {
    name: 'builder-plugin-sass',
    setup(api) {
      api.modifyRspackConfig(async (rspackConfig, utils) => {
        const config = api.getNormalizedConfig();
        const { applyOptionsChain } = await import('@modern-js/utils');
        const { getCssLoaderUses } = await import('./css');

        const getSassLoaderOptions = () => {
          const excludes: (RegExp | string)[] = [];

          const addExcludes: FileFilterUtil = items => {
            excludes.push(..._.castArray(items));
          };

          const mergedOptions = applyOptionsChain(
            {
              sourceMap: isUseCssSourceMap(config),
              rspackImporter: true,
            },
            config.tools.sass,
            { addExcludes },
          );

          return {
            options: mergedOptions,
            excludes,
          };
        };

        const cssLoaderUses = await getCssLoaderUses(
          config,
          api.context,
          utils,
        );

        const { excludes, options } = getSassLoaderOptions();

        setConfig(rspackConfig, 'module.rules', [
          ...(rspackConfig.module?.rules || []),
          {
            name: 'sass',
            test: SASS_REGEX,
            exclude: excludes,
            use: [
              ...cssLoaderUses,
              {
                name: 'sass',
                builtinLoader: 'sass-loader',
                options,
              },
            ],
            type: 'css',
          },
        ]);
      });
    },
  };
}

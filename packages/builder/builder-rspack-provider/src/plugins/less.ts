import type { BuilderPlugin } from '../types';
import {
  isUseCssSourceMap,
  LESS_REGEX,
  setConfig,
  FileFilterUtil,
} from '@modern-js/builder-shared';
import _ from '@modern-js/utils/lodash';

export function PluginLess(): BuilderPlugin {
  return {
    name: 'builder-plugin-less',
    setup(api) {
      api.modifyRspackConfig(async (rspackConfig, utils) => {
        const config = api.getNormalizedConfig();
        const { applyOptionsChain } = await import('@modern-js/utils');
        const { getCssLoaderUses } = await import('./css');

        const getLessLoaderOptions = () => {
          const excludes: (RegExp | string)[] = [];

          const addExcludes: FileFilterUtil = items => {
            excludes.push(..._.castArray(items));
          };

          const defaultLessLoaderOptions = {
            lessOptions: {
              javascriptEnabled: true,
            },
            sourceMap: isUseCssSourceMap(config),
            implementation: utils.getCompiledPath('less'),
          };
          const mergedOptions = applyOptionsChain(
            defaultLessLoaderOptions,
            config.tools.less,
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

        const { excludes, options } = getLessLoaderOptions();

        const { default: lessLoader } = await import(
          utils.getCompiledPath('@rspack/less-loader')
        );

        setConfig(rspackConfig, 'module.rules', [
          ...(rspackConfig.module?.rules || []),
          {
            name: 'less',
            test: LESS_REGEX,
            exclude: excludes,
            use: [
              ...cssLoaderUses,
              {
                name: 'less',
                loader: lessLoader,
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

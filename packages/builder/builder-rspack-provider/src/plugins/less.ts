import type { BuilderPlugin } from '../types';
import lessLoader from '../loader/less';

export const LESS_REGEX_STR = '\\.less$';

export function PluginLess(): BuilderPlugin {
  return {
    name: 'builder-plugin-less',
    setup(api) {
      api.modifyRspackConfig(async (rspackConfig, utils) => {
        const { CHAIN_ID } = utils;
        const config = api.getBuilderConfig();
        const { getCssLoaderUses } = await import('./css');
        const getLessLoaderOptions = () => {
          const options = config.tools?.less?.lessOptions || {};
          return options;
        };

        const cssLoaderUses = await getCssLoaderUses(
          config,
          api.context,
          utils,
        );

        const lessLoaderOptions = getLessLoaderOptions();

        rspackConfig.module!.rules!.push({
          name: CHAIN_ID.USE.LESS,
          test: LESS_REGEX_STR,
          uses: [
            ...cssLoaderUses,
            {
              name: CHAIN_ID.USE.LESS,
              loader: lessLoader,
              options: lessLoaderOptions,
            },
          ],
          type: 'css',
        });
      });
    },
  };
}

import { BuilderPlugin } from '../types';

export const SASS_REGEX_STR = '\\.s[ac]ss$';

export function PluginSass(): BuilderPlugin {
  return {
    name: 'builder-plugin-sass',
    setup(api) {
      api.modifyRspackConfig(async (rspackConfig, utils) => {
        const { CHAIN_ID } = utils;
        const config = api.getBuilderConfig();
        const { getCssLoaderUses } = await import('./css');

        const getSassLoaderOptions = () => {
          const sassOptions = config.tools?.sass?.sassOptions || {};
          return {
            sassOptions,
          };
        };

        const cssLoaderUses = await getCssLoaderUses(
          config,
          api.context,
          utils,
        );
        const sassLoaderOptions = getSassLoaderOptions();

        rspackConfig.module!.rules!.push({
          name: CHAIN_ID.USE.SASS,
          test: SASS_REGEX_STR,
          uses: [
            ...cssLoaderUses,
            {
              name: CHAIN_ID.USE.SASS,
              builtinLoader: 'sass-loader',
              options: sassLoaderOptions.sassOptions,
            },
          ],
          type: 'css',
        });
      });
    },
  };
}

import { DefaultBuilderPlugin } from '@modern-js/builder-shared';

export const builderPluginMoment = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-moment',

  setup(api) {
    api.modifyBundlerChain(async (chain, { webpack }) => {
      const config = api.getNormalizedConfig();

      if (config.performance.removeMomentLocale) {
        // Moment.js includes a lots of locale data by default.
        // We can using IgnorePlugin to allow the user to opt into importing specific locales.
        // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
        chain.plugin('remove-moment-locale').use(webpack.IgnorePlugin, [
          {
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/,
          },
        ]);
      }
    });
  },
});

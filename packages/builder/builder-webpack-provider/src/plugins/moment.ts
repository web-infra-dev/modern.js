import type { BuilderPlugin } from '../types';

export const PluginMoment = (): BuilderPlugin => ({
  name: 'builder-plugin-moment',

  setup(api) {
    api.modifyWebpackChain(async chain => {
      const { default: webpack } = await import('webpack');
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

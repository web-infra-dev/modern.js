import type { BuilderPlugin } from '../types';

/**
 * Provides default configuration consistent with `@modern-js/webpack`
 */
export const PluginCompatModern = (): BuilderPlugin => ({
  name: 'web-builder-plugin-compat-modern',

  setup(api) {
    api.modifyBuilderConfig(config => {
      config.source = config.source || {};
      config.output = config.output || {};
      config.performance = config.performance || {};

      // ensure resolve.extensions same as before
      if (config.source.resolveExtensionPrefix === undefined) {
        config.source.resolveExtensionPrefix = '.web';
      }

      // `@modern-js/webpack` used to remove moment locale by default
      if (config.performance.removeMomentLocale === undefined) {
        config.performance.removeMomentLocale = true;
      }

      // `@modern-js/webpack` output all media files to `dist/media` by default
      if (config.output.distPath === undefined) {
        config.output.distPath = {
          svg: 'media',
          font: 'media',
          image: 'media',
        };
      }

      return config;
    });
  },
});

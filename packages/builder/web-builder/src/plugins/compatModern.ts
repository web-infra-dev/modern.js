import { isPrimitiveScope } from './moduleScopes';
import type { BuilderPlugin, ModuleScopes } from '../types';

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

      // `@modern-js/webpack` used to generate asset manifest by default
      if (config.output.enableAssetManifest === undefined) {
        config.output.enableAssetManifest = true;
      }

      // compatible with fallback behavior
      if (config.output.enableAssetFallback === undefined) {
        config.output.enableAssetFallback = true;
      }

      // `@modern-js/webpack` output all media files to `dist/media` by default
      if (config.output.distPath === undefined) {
        config.output.distPath = {
          svg: 'media',
          font: 'media',
          image: 'media',
        };
      }

      // `@modern-js/webpack` used to add `src` and `shared` as default scopes
      const { moduleScopes } = config.source;
      if (moduleScopes) {
        const DEFAULT_SCOPES: ModuleScopes = ['./src', './shared'];

        if (Array.isArray(moduleScopes)) {
          if (isPrimitiveScope(moduleScopes)) {
            config.source.moduleScopes = DEFAULT_SCOPES.concat(moduleScopes);
          } else {
            config.source.moduleScopes = [DEFAULT_SCOPES, ...moduleScopes];
          }
        } else {
          config.source.moduleScopes = [DEFAULT_SCOPES, moduleScopes];
        }
      }

      return config;
    });
  },
});

import type { BuilderPlugin } from '../types';

export const PluginResolve = (): BuilderPlugin => ({
  name: 'web-builder-plugin-resolve',

  setup(api) {
    api.modifyWebpackChain(async chain => {
      const config = api.getBuilderConfig();
      const isTsProject = Boolean(api.context.tsconfigPath);

      const extensions = [
        '.mjs',
        '.js',
        // only resolve .ts(x) files if it's a ts project
        ...(isTsProject ? ['.tsx', '.ts'] : []),
        '.jsx',
        '.json',
      ];

      const { resolveExtensionPrefix } = config.source || {};

      // add an extra prefix to all extensions
      if (resolveExtensionPrefix) {
        const merged = extensions.reduce<string[]>(
          (ret, ext) => [...ret, resolveExtensionPrefix + ext, ext],
          [],
        );
        chain.resolve.extensions.merge(merged);
      } else {
        chain.resolve.extensions.merge(extensions);
      }
    });
  },
});

import type { BuilderPlugin } from '../types';

export const PluginResolve = (): BuilderPlugin => ({
  name: 'web-builder-plugin-resolve',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      const isTsProject = Boolean(api.context.tsconfigPath);

      let extensions = [
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
        extensions = extensions.reduce<string[]>(
          (ret, ext) => [...ret, resolveExtensionPrefix + ext, ext],
          [],
        );
      }

      chain.resolve.extensions.merge(extensions);

      if (isTsProject) {
        const { TsConfigPathsPlugin } = await import(
          '../webpackPlugins/TsConfigPathsPlugin'
        );

        chain.resolve
          .plugin(CHAIN_ID.RESOLVE_PLUGIN.TS_CONFIG_PATHS)
          .use(TsConfigPathsPlugin, [
            {
              cwd: api.context.rootPath,
              extensions,
            },
          ]);
      }
    });
  },
});

import type { BuilderConfig, BuilderPlugin, WebpackChain } from '../types';

function applyExtensions({
  chain,
  config,
  isTsProject,
}: {
  chain: WebpackChain;
  config: BuilderConfig;
  isTsProject: boolean;
}) {
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

  return extensions;
}

export const PluginResolve = (): BuilderPlugin => ({
  name: 'web-builder-plugin-resolve',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const { applyOptionsChain } = await import('@modern-js/utils');
      const config = api.getBuilderConfig();
      const isTsProject = Boolean(api.context.tsconfigPath);
      const extensions = applyExtensions({ chain, config, isTsProject });

      const { alias } = config.source || {};
      if (alias) {
        const mergedAlias = applyOptionsChain({}, alias);
        // @ts-expect-error webpack chain alias type is outdated
        chain.resolve.alias.merge(mergedAlias);
      }

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

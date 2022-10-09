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

async function applyAlias({
  chain,
  config,
  rootPath,
}: {
  chain: WebpackChain;
  config: BuilderConfig;
  rootPath: string;
}) {
  const { alias } = config.source || {};

  if (!alias) {
    return;
  }

  const { ensureArray, applyOptionsChain, ensureAbsolutePath } = await import(
    '@modern-js/utils'
  );

  const mergedAlias = applyOptionsChain({}, alias);

  /**
   * Format alias value:
   * - Relative paths need to be turned into absolute paths.
   * - Absolute paths or a package name are not processed.
   */
  Object.keys(mergedAlias).forEach(name => {
    const values = ensureArray(mergedAlias[name]);
    const formattedValues = values.map(value => {
      if (typeof value === 'string' && value.startsWith('.')) {
        return ensureAbsolutePath(rootPath, value);
      }
      return value;
    });

    chain.resolve.alias.set(
      name,
      // @ts-expect-error webpack chain alias type is outdated
      formattedValues.length === 1 ? formattedValues[0] : formattedValues,
    );
  });
}

export const PluginResolve = (): BuilderPlugin => ({
  name: 'builder-plugin-resolve',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      const isTsProject = Boolean(api.context.tsconfigPath);
      const extensions = applyExtensions({ chain, config, isTsProject });

      await applyAlias({
        chain,
        config,
        rootPath: api.context.rootPath,
      });

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

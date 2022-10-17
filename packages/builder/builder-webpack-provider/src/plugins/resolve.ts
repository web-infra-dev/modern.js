import type { ChainIdentifier } from '@modern-js/utils';
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
    // only resolve .ts(x) files if it's a ts project
    // most projects are using TypeScript, resolve .ts(x) files first to reduce resolve time.
    ...(isTsProject ? ['.ts', '.tsx'] : []),
    '.js',
    '.jsx',
    '.mjs',
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

// compatible with legacy packages with type="module"
// https://github.com/webpack/webpack/issues/11467
function applyFullySpecified({
  chain,
  config,
  CHAIN_ID,
}: {
  chain: WebpackChain;
  config: BuilderConfig;
  CHAIN_ID: ChainIdentifier;
}) {
  chain.module
    .rule(CHAIN_ID.RULE.MJS)
    .test(/\.m?js/)
    .resolve.set('fullySpecified', false);

  if (config.source?.compileJsDataURI) {
    chain.module
      .rule(CHAIN_ID.RULE.JS_DATA_URI)
      .resolve.set('fullySpecified', false);
  }
}

function applyMainFields({
  chain,
  config,
}: {
  chain: WebpackChain;
  config: BuilderConfig;
}) {
  const resolveMainFields = config.source?.resolveMainFields;
  if (!resolveMainFields) {
    return;
  }
  chain.resolve.mainFields.merge(resolveMainFields);
}

export const PluginResolve = (): BuilderPlugin => ({
  name: 'builder-plugin-resolve',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      const isTsProject = Boolean(api.context.tsconfigPath);
      const extensions = applyExtensions({ chain, config, isTsProject });

      applyFullySpecified({ chain, config, CHAIN_ID });

      await applyAlias({
        chain,
        config,
        rootPath: api.context.rootPath,
      });

      applyMainFields({
        chain,
        config,
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

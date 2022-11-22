import type { ChainIdentifier } from '@modern-js/utils';
import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin, NormalizedConfig, WebpackChain } from '../types';

function applyExtensions({
  chain,
  config,
  isTsProject,
}: {
  chain: WebpackChain;
  config: NormalizedConfig;
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
  config: NormalizedConfig;
  rootPath: string;
}) {
  const { alias } = config.source;

  if (!alias) {
    return;
  }

  const { applyOptionsChain, ensureAbsolutePath } = await import(
    '@modern-js/utils'
  );

  const mergedAlias = applyOptionsChain({}, alias);

  /**
   * Format alias value:
   * - Relative paths need to be turned into absolute paths.
   * - Absolute paths or a package name are not processed.
   */
  Object.keys(mergedAlias).forEach(name => {
    const values = _.castArray(mergedAlias[name]);
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
  config: NormalizedConfig;
  CHAIN_ID: ChainIdentifier;
}) {
  chain.module
    .rule(CHAIN_ID.RULE.MJS)
    .test(/\.m?js/)
    .resolve.set('fullySpecified', false);

  if (config.source.compileJsDataURI) {
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
  config: NormalizedConfig;
}) {
  const { resolveMainFields } = config.source;
  if (!resolveMainFields) {
    return;
  }
  chain.resolve.mainFields.merge(resolveMainFields);
}

export const PluginResolve = (): BuilderPlugin => ({
  name: 'builder-plugin-resolve',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
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

      if (!isTsProject) {
        return;
      }

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
    });
  },
});

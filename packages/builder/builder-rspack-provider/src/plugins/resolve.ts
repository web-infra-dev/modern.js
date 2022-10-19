import type { ChainIdentifier } from '@modern-js/utils';
import type { BuilderConfig, BuilderPlugin, RspackConfig } from '../types';

function applyExtensions({
  rspackConfig,
  config,
  isTsProject,
}: {
  rspackConfig: RspackConfig;
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

  const defaultExt = rspackConfig.resolve!.extensions;

  rspackConfig.resolve!.extensions = [...(defaultExt || []), ...extensions];

  return extensions;
}

async function applyAlias({
  rspackConfig,
  config,
  rootPath,
}: {
  rspackConfig: RspackConfig;
  config: BuilderConfig;
  rootPath: string;
}) {
  const { alias } = config.source || {};

  if (!alias) {
    return;
  }

  const { ensureArray, ensureAbsolutePath } = await import('@modern-js/utils');

  const mergedAlias = alias;
  const finalAlias = rspackConfig.resolve!.alias || {};

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

    finalAlias[name] = formattedValues[0];
  });

  rspackConfig.resolve!.alias = finalAlias;
}

function applyMainFields({
  rspackConfig,
  config,
}: {
  rspackConfig: RspackConfig;
  config: BuilderConfig;
}) {
  const resolveMainFields = config.source?.resolveMainFields;
  let finalMainFields = rspackConfig.resolve!.mainFields || [];
  if (!resolveMainFields) {
    return;
  }

  finalMainFields = [...finalMainFields, ...resolveMainFields];

  rspackConfig.resolve!.mainFields = finalMainFields;
}

export const PluginResolve = (): BuilderPlugin => ({
  name: 'builder-plugin-resolve',

  setup(api) {
    api.modifyRspackConfig(async (rspackConfig, { CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      const isTsProject = Boolean(api.context.tsconfigPath);
      const extensions = applyExtensions({ rspackConfig, config, isTsProject });

      await applyAlias({
        rspackConfig,
        config,
        rootPath: api.context.rootPath,
      });

      applyMainFields({
        rspackConfig,
        config,
      });

    });
  },
});

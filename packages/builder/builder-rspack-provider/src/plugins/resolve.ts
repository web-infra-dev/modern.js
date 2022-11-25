import type { BuilderPlugin, NormalizedConfig, RspackConfig } from '../types';
import { setConfig, getExtensions } from '@modern-js/builder-shared';

function applyExtensions({
  rspackConfig,
  config,
  isTsProject,
}: {
  rspackConfig: RspackConfig;
  config: NormalizedConfig;
  isTsProject: boolean;
}) {
  const extensions = getExtensions({
    isTsProject,
    resolveExtensionPrefix: config.source.resolveExtensionPrefix,
  });

  setConfig(rspackConfig, 'resolve.extensions', [
    ...(rspackConfig.resolve?.extensions || []),
    ...extensions,
  ]);
}

async function applyAlias({
  rspackConfig,
  config,
  rootPath,
}: {
  rspackConfig: RspackConfig;
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

  const mergedAlias = applyOptionsChain<Record<string, string>, never>(
    {},
    alias,
  );

  /**
   * Format alias value:
   * - Relative paths need to be turned into absolute paths.
   * - Absolute paths or a package name are not processed.
   */
  const formatAlias = Object.keys(mergedAlias).reduce<Record<string, string>>(
    (prev, name) => {
      const formattedValue = (value: string) => {
        if (typeof value === 'string' && value.startsWith('.')) {
          return ensureAbsolutePath(rootPath, value);
        }
        return value;
      };
      const value = formattedValue(mergedAlias[name]);

      prev[name] = value;
      return prev;
    },
    {},
  );

  setConfig(rspackConfig, 'resolve.alias', {
    ...(rspackConfig.resolve?.alias || {}),
    ...formatAlias,
  });
}

function applyMainFields({
  rspackConfig,
  config,
}: {
  rspackConfig: RspackConfig;
  config: NormalizedConfig;
}) {
  const { resolveMainFields } = config.source;
  if (!resolveMainFields) {
    return;
  }

  setConfig(rspackConfig, 'resolve.mainFields', [
    ...(rspackConfig.resolve?.mainFields || []),
    ...resolveMainFields.flat(),
  ]);
}

export const PluginResolve = (): BuilderPlugin => ({
  name: 'builder-plugin-resolve',

  setup(api) {
    api.modifyRspackConfig(async rspackConfig => {
      const config = api.getNormalizedConfig();
      const isTsProject = Boolean(api.context.tsconfigPath);
      applyExtensions({ rspackConfig, config, isTsProject });

      await applyAlias({
        rspackConfig,
        config,
        rootPath: api.context.rootPath,
      });

      applyMainFields({
        rspackConfig,
        config,
      });

      if (isTsProject) {
        setConfig(
          rspackConfig,
          'resolve.tsConfigPath',
          api.context.tsconfigPath,
        );
      }
    });
  },
});

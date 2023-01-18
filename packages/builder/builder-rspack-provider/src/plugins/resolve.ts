import type { BuilderPlugin, NormalizedConfig, RspackConfig } from '../types';
import {
  setConfig,
  getExtensions,
  BuilderTarget,
} from '@modern-js/builder-shared';

function applyExtensions({
  target,
  rspackConfig,
  config,
  isTsProject,
}: {
  target: BuilderTarget;
  rspackConfig: RspackConfig;
  config: NormalizedConfig;
  isTsProject: boolean;
}) {
  const extensions = getExtensions({
    target,
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
  target,
}: {
  rspackConfig: RspackConfig;
  config: NormalizedConfig;
  target: BuilderTarget;
}) {
  const { resolveMainFields } = config.source;
  if (!resolveMainFields) {
    return;
  }

  const mainFields = Array.isArray(resolveMainFields)
    ? resolveMainFields
    : resolveMainFields[target];

  if (mainFields) {
    setConfig(rspackConfig, 'resolve.mainFields', [
      ...(rspackConfig.resolve?.mainFields || []),
      ...mainFields.flat(),
    ]);
  }
}

export const builderPluginResolve = (): BuilderPlugin => ({
  name: 'builder-plugin-resolve',

  setup(api) {
    api.modifyRspackConfig(async (rspackConfig, { target }) => {
      const config = api.getNormalizedConfig();
      const isTsProject = Boolean(api.context.tsconfigPath);
      applyExtensions({ target, rspackConfig, config, isTsProject });

      await applyAlias({
        rspackConfig,
        config,
        rootPath: api.context.rootPath,
      });

      applyMainFields({
        rspackConfig,
        config,
        target,
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

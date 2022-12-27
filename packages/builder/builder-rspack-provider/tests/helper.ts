import {
  pick,
  createPluginStore,
  applyDefaultBuilderOptions,
  type CreateBuilderOptions,
} from '@modern-js/builder-shared';
import { BuilderPlugin, BuilderConfig, RspackConfig } from '../src/types';
import { builderRspackProvider } from '../src/provider';

export const getBuilderPlugins = async () => {
  const { plugins } = await import('../../builder/src/plugins');

  return plugins;
};

/** Match plugin by constructor name. */
export const matchPlugin = (config: RspackConfig, pluginName: string) => {
  const result = config.plugins?.filter(
    item => item.constructor.name === pluginName,
  );

  if (Array.isArray(result)) {
    return result[0] || null;
  } else {
    return result || null;
  }
};

/**
 * different with builder.createBuilder. support add custom plugins instead of applyDefaultPlugins.
 */
export async function createBuilder({
  builderConfig = {},
  plugins,
  ...options
}: CreateBuilderOptions & {
  builderConfig?: BuilderConfig;
  plugins?: BuilderPlugin[];
}) {
  const builderOptions = applyDefaultBuilderOptions(options);

  const provider = builderRspackProvider({
    builderConfig,
  });

  const pluginStore = createPluginStore();
  const {
    build,
    publicContext,
    inspectConfig,
    createCompiler,
    startDevServer,
    applyDefaultPlugins,
  } = await provider({
    pluginStore,
    builderOptions,
    plugins: await getBuilderPlugins(),
  });

  if (plugins) {
    pluginStore.addPlugins(plugins);
  } else {
    await applyDefaultPlugins(pluginStore);
  }

  return {
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
    build,
    createCompiler,
    inspectConfig,
    startDevServer,
    context: publicContext,
  };
}

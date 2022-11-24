import {
  pick,
  createPluginStore,
  applyDefaultBuilderOptions,
  type CreateBuilderOptions,
} from '@modern-js/builder-shared';
import { BuilderPlugin, BuilderConfig } from '../src/types';
import { builderRspackProvider } from '../src/provider';

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

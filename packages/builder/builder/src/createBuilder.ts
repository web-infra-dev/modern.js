import {
  pick,
  debug,
  createPluginStore,
  applyDefaultBuilderOptions,
  type BuilderInstance,
  type BuilderProvider,
  type CreateBuilderOptions,
} from '@modern-js/builder-shared';
import { pluginMaterials } from './plugins';

export async function createBuilder(
  provider: BuilderProvider,
  options: CreateBuilderOptions,
): Promise<BuilderInstance> {
  const builderOptions = applyDefaultBuilderOptions(options);
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
    materials: {
      plugins: pluginMaterials,
    },
  });

  debug('add default plugins');
  await applyDefaultPlugins();
  debug('add default plugins done');

  return {
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
    build,
    createCompiler,
    inspectConfig,
    startDevServer,
    context: publicContext,
  };
}

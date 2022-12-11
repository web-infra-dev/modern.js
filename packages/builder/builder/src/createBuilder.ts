import {
  pick,
  debug,
  createPluginStore,
  applyDefaultBuilderOptions,
  type BuilderInstance,
  type BuilderProvider,
  type CreateBuilderOptions,
} from '@modern-js/builder-shared';
import { plugins } from './plugins';

export async function createBuilder<
  P extends BuilderProvider = BuilderProvider,
>(provider: P, options: CreateBuilderOptions): Promise<BuilderInstance<P>> {
  const builderOptions = applyDefaultBuilderOptions(options);
  const pluginStore = createPluginStore();
  const {
    build,
    pluginAPI,
    publicContext,
    initConfigs,
    inspectConfig,
    createCompiler,
    startDevServer,
    applyDefaultPlugins,
  } = await provider({
    pluginStore,
    builderOptions,
    plugins,
  });

  debug('add default plugins');
  await applyDefaultPlugins(pluginStore);
  debug('add default plugins done');

  return {
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
    ...pick(pluginAPI, [
      'onBeforeBuild',
      'onBeforeCreateCompiler',
      'onBeforeStartDevServer',
      'onAfterBuild',
      'onAfterCreateCompiler',
      'onAfterStartDevServer',
      'onDevCompileDone',
      'onExit',
    ]),
    build,
    createCompiler,
    initConfigs,
    inspectConfig,
    startDevServer,
    context: publicContext,
  };
}

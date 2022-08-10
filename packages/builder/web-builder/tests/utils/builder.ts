import _ from 'lodash';
import { mergeBuilderOptions } from '../../src/core/createBuilder';
import { createPublicContext } from '../../src/core/createContext';
import { createPluginStore } from '../../src/core/createPluginStore';
import { initConfigs } from '../../src/core/initConfigs';
import { pick } from '../../src/shared';
import type { BuilderOptions, BuilderPlugin, Context } from '../../src/types';
import { createStubContext } from './context';

export interface StubBuilderOptions extends BuilderOptions {
  context?: Context;
  plugins?: BuilderPlugin[];
}

export function createStubBuilder(options?: StubBuilderOptions) {
  const builderOptions = mergeBuilderOptions(
    options,
  ) as Required<StubBuilderOptions>;
  const context = createStubContext(builderOptions);
  options?.context && _.merge(context, options.context);
  const publicContext = createPublicContext(context);
  const pluginStore = createPluginStore();
  options?.plugins && pluginStore.addPlugins(options.plugins);

  const build = async () => {
    const { webpackConfigs } = await initConfigs({
      context,
      pluginStore,
      builderOptions,
    });
    await context.hooks.onBeforeBuildHook.call({ webpackConfigs });
    await context.hooks.onAfterBuildHook.call();
    return { webpackConfigs };
  };

  return {
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
    build,
    hooks: context.hooks,
    context: publicContext,
  };
}

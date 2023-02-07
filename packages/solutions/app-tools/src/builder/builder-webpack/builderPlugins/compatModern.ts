import { join } from 'path';
import { BuilderPlugin } from '@modern-js/builder-shared';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';

import { BuilderOptions, createCopyPattern } from '../../shared';
import { RouterPlugin } from '../webpackPlugins';

type Parameter<T extends (arg: any) => void> = Parameters<T>[0];
type FnParameter<
  T extends {
    [p: string]: (arg: any) => void;
  },
> = {
  [P in keyof T]: Parameter<T[P]>;
};

export type PluginCompatModernOptions = FnParameter<
  Partial<
    Pick<
      BuilderPluginAPI,
      | 'onAfterBuild'
      | 'onAfterCreateCompiler'
      | 'onAfterStartDevServer'
      | 'onBeforeBuild'
      | 'onBeforeCreateCompiler'
      | 'onBeforeStartDevServer'
      | 'onDevCompileDone'
      | 'onExit'
    >
  >
>;

/**
 * Provides default configuration consistent with modern.js v1
 */
export const PluginCompatModern = (
  options: BuilderOptions<'webpack'>,
): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-compat-modern',

  setup(api) {
    const { normalizedConfig: modernConfig, appContext } = options;

    api.modifyWebpackChain((chain, { CHAIN_ID }) => {
      // compat modern-js v1
      chain.resolve.modules
        .add('node_modules')
        .add(join(api.context.rootPath, 'node_modules'));

      // apply copy plugin
      // TODO: need enhance the copy plugin
      if (chain.plugins.has(CHAIN_ID.PLUGIN.COPY)) {
        const defaultCopyPattern = createCopyPattern(
          appContext,
          modernConfig,
          'public',
          chain,
        );
        chain.plugin(CHAIN_ID.PLUGIN.COPY).tap(args => [
          {
            patterns: [...(args[0]?.patterns || []), defaultCopyPattern],
          },
        ]);
      }

      const { entrypoints } = appContext;
      const existNestedRoutes = entrypoints.some(
        entrypoint => entrypoint.nestedRoutesEntry,
      );

      const routerConfig: any = modernConfig?.runtime?.router;
      const routerManifest = Boolean(routerConfig?.manifest);
      // for ssr mode
      if (existNestedRoutes || routerManifest) {
        chain.plugin('route-plugin').use(RouterPlugin);
      }
    });
  },
});

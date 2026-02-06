import { merge } from '@modern-js/runtime-utils/merge';
import { routerPlugin as reactRouterPlugin } from './plugin';
import { tanstackRouterPlugin } from './tanstack/plugin';
import {
  modifyRoutes as modifyRoutesHook,
  onBeforeCreateRoutes as onBeforeCreateRoutesHook,
} from './hooks';
import type { RouterConfig, SingleRouteConfig } from './types';
import type { RouterExtendsHooks } from './hooks';
import type { RuntimePlugin } from '../../core';

export const routerPlugin = (
  userConfig: Partial<RouterConfig> = {},
): RuntimePlugin<{
  extendHooks: RouterExtendsHooks;
}> => {
  return {
    name: '@modern-js/plugin-router',
    registryHooks: {
      modifyRoutes: modifyRoutesHook,
      onBeforeCreateRoutes: onBeforeCreateRoutesHook,
    },
    setup: api => {
      const mergedConfig = merge(
        api.getRuntimeConfig().router || {},
        userConfig,
      ) as RouterConfig;

      const framework = mergedConfig.framework || 'react-router';
      const pluginFactory =
        framework === 'tanstack' ? tanstackRouterPlugin : reactRouterPlugin;

      pluginFactory(userConfig as any).setup?.(api as any);
    },
  };
};

export default routerPlugin;
export type { SingleRouteConfig, RouterConfig };
export type { RouterExtendsHooks } from './hooks';
export { renderRoutes } from './utils';
export { modifyRoutes } from './plugin';

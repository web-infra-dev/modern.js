import { merge } from '@modern-js/runtime-utils/merge';
import type { RuntimePlugin } from '../../core';
import {
  modifyRoutes as modifyRoutesHook,
  onBeforeCreateRoutes as onBeforeCreateRoutesHook,
} from './hooks';
import type { RouterExtendsHooks } from './hooks';
import { routerPlugin as reactRouterPlugin } from './plugin';
import type { RouterConfig, SingleRouteConfig } from './types';

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

      reactRouterPlugin(mergedConfig).setup?.(api as any);
    },
  };
};

export default routerPlugin;
export type { SingleRouteConfig, RouterConfig };
export type { RouterExtendsHooks } from './hooks';
export {
  createRouteObjectsFromConfig,
  renderRoutes,
  urlJoin,
} from './utils';
export { modifyRoutes } from './plugin';
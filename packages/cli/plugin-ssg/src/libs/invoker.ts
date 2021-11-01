import normalize from 'normalize-path';
import { ModernRoute } from '@modern-js/server';
import {
  CreatePageListener,
  HookContext,
  UserInterfaceRoute,
  AgreedRouteMap,
} from '../types';
import { isDynamicUrl } from './util';
import { createPageFactory } from './createPage';

function createContext(
  route: UserInterfaceRoute,
  listener: CreatePageListener,
) {
  return {
    createPage: createPageFactory(route, listener),
    route,
  };
}

// eslint-disable-next-line max-params
export async function invoker(
  pageRoutes: ModernRoute[],
  agreedRouteMap: AgreedRouteMap,
  hook: (context: HookContext) => any,
  autoAddAgreed: (context: HookContext & { component: string }) => boolean,
  listener: CreatePageListener,
) {
  for (const pageRoute of pageRoutes) {
    const { urlPath, entryName } = pageRoute;

    const agreedRoutes = agreedRouteMap[entryName];
    if (agreedRoutes) {
      for (const agreedRoute of agreedRoutes) {
        const fullpath = normalize(`${urlPath}${agreedRoute.path}`) || '/';
        const route = { ...pageRoute, path: fullpath, agreed: true };
        const context = createContext(route, listener);
        // The hook function can return false to prevent the automatic addition of agreed routes
        const isStaticPage = await hook(context);

        if (!isDynamicUrl(fullpath) && isStaticPage !== false) {
          const autoAdd = autoAddAgreed({
            ...context,
            component: agreedRoute._component,
          });
          autoAdd && context.createPage();
        }
      }
    } else {
      const route = { ...pageRoute, path: urlPath };
      const context = createContext(route, listener);
      await hook(context);
    }
  }
}

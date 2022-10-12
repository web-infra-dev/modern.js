import { APIServerStartInput } from '@modern-js/server-core';
import { ModernRoute, ModernRouteInterface } from '../libs/route';
import type { ModernServerContext } from '../libs/context';
import { ModernServerOptions, ModernServerInterface } from '../type';
import { ModernServer } from './modern-server';

class ModernSSRServer extends ModernServer {
  protected prepareAPIHandler(_: APIServerStartInput['config']) {
    return null as any;
  }

  protected async handleAPI(context: ModernServerContext) {
    return this.render404(context);
  }
}

class ModernAPIServer extends ModernServer {
  protected prepareWebHandler(_: APIServerStartInput['config']) {
    return null as any;
  }

  protected filterRoutes(routes: ModernRouteInterface[]) {
    return routes.filter(route => route.isApi);
  }
}

class ModernWebServer extends ModernServer {
  protected async warmupSSRBundle() {
    return null;
  }

  protected async handleAPI(context: ModernServerContext) {
    return this.render404(context);
  }

  protected async handleWeb(context: ModernServerContext, route: ModernRoute) {
    route.isSSR = false;
    return super.handleWeb(context, route);
  }
}

export const createProdServer = (
  options: ModernServerOptions,
): ModernServerInterface => {
  if (options.apiOnly) {
    return new ModernAPIServer(options);
  } else if (options.ssrOnly) {
    return new ModernSSRServer(options);
  } else if (options.webOnly) {
    return new ModernWebServer(options);
  } else {
    return new ModernServer(options);
  }
};

import { APIServerStartInput } from '@modern-js/server-core';
import { ModernRoute, ModernRouteInterface } from '../libs/route';
import { ApiServerMode, RUN_MODE } from '../constants';
import { ModernServerContext } from '../libs/context';
import { ModernServerOptions, ModernServerInterface, HookNames } from '../type';
import { ModernServer } from './modern-server';

class ModernSSRServer extends ModernServer {
  protected prepareAPIHandler(
    _m: ApiServerMode,
    _: APIServerStartInput['config'],
  ) {
    return null as any;
  }

  protected filterRoutes(routes: ModernRouteInterface[]) {
    return routes.filter(route => route.isSSR);
  }

  protected async setupBeforeProdMiddleware() {
    if (this.runMode === RUN_MODE.FULL) {
      await super.setupBeforeProdMiddleware();
    }
  }

  protected async emitRouteHook(_: HookNames, _input: any) {
    if (this.runMode === RUN_MODE.FULL) {
      await super.emitRouteHook(_, _input);
    }
  }
}

class ModernAPIServer extends ModernServer {
  protected prepareWebHandler(_: APIServerStartInput['config']) {
    return null as any;
  }

  protected filterRoutes(routes: ModernRouteInterface[]) {
    return routes.filter(route => route.isApi);
  }

  protected async setupBeforeProdMiddleware() {
    if (this.runMode === RUN_MODE.FULL) {
      await super.setupBeforeProdMiddleware();
    }
  }

  protected async emitRouteHook(_: HookNames, _input: any) {
    // empty
  }
}

class ModernWebServer extends ModernServer {
  protected async warmupSSRBundle() {
    return null;
  }

  protected async handleAPI(context: ModernServerContext) {
    const { proxyTarget } = this;

    if (proxyTarget?.api) {
      return this.proxy();
    } else {
      return this.render404(context);
    }
  }

  protected async handleWeb(context: ModernServerContext, route: ModernRoute) {
    const { proxyTarget } = this;

    if (route.isSSR && proxyTarget?.ssr) {
      return this.proxy();
    } else {
      // if no proxyTarget but access web server, degradation to csr
      route.isSSR = false;
      return super.handleWeb(context, route);
    }
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

import { APIServerStartInput } from '@modern-js/server-plugin';
import { ModernServer } from './modern-server';
import { mergeExtension } from '../utils';
import { ModernRoute, ModernRouteInterface, RouteMatcher } from '../libs/route';
import { ApiServerMode } from '../constants';
import { ModernServerContext } from '../libs/context';

export class ModernSSRServer extends ModernServer {
  // Todo should not invoke any route hook in modernSSRServer

  protected async warmupSSRBundle() {
    // empty
  }

  protected verifyMatch(context: ModernServerContext, matched: RouteMatcher) {
    if (matched.generate().isApi) {
      this.render404(context);
    }
  }

  protected prepareAPIHandler(
    _m: ApiServerMode,
    _: APIServerStartInput['config'],
  ) {
    return null as any;
  }

  protected async prepareWebHandler(
    extension: ReturnType<typeof mergeExtension>,
  ) {
    return super.prepareWebHandler(extension);
  }

  // protected filterRoutes(routes: ModernRouteInterface[]) {
  //   return routes.filter(route => route.entryName);
  // }

  protected async preServerInit() {
    // empty
  }
}

export class ModernAPIServer extends ModernServer {
  protected async emitRouteHook(_: string, _input: any) {
    // empty
  }

  protected async warmupSSRBundle() {
    // empty
  }

  protected prepareWebHandler(_: ReturnType<typeof mergeExtension>) {
    return null as any;
  }

  protected async prepareAPIHandler(
    mode: ApiServerMode,
    extension: APIServerStartInput['config'],
  ) {
    return super.prepareAPIHandler(mode, extension);
  }

  protected filterRoutes(routes: ModernRouteInterface[]) {
    return routes.filter(route => route.isApi);
  }

  protected async preServerInit() {
    // empty
  }
}

export class ModernWebServer extends ModernServer {
  protected async warmupSSRBundle() {
    // empty
  }

  protected async handleAPI(context: ModernServerContext) {
    const { proxyTarget } = this;
    if (!proxyTarget?.api) {
      this.proxy();
    } else {
      this.render404(context);
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

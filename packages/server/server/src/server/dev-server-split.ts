import type { APIServerStartInput } from '@modern-js/server-core';
import { ServerRoute as ModernRouteInterface } from '@modern-js/types';
import { ApiServerMode } from '@modern-js/prod-server';
import { ModernDevServer } from './dev-server';

export class ModernSSRDevServer extends ModernDevServer {
  protected prepareAPIHandler(
    _m: ApiServerMode,
    _: APIServerStartInput['config'],
  ) {
    return null as any;
  }

  protected async prepareWebHandler(extension: { middleware: any[] }) {
    return super.prepareWebHandler(extension);
  }

  protected filterRoutes(routes: ModernRouteInterface[]) {
    return routes.filter(route => route.entryName);
  }
}

export class ModernAPIDevServer extends ModernDevServer {
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
    // noop
  }
}

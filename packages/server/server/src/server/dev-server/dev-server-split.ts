import type { APIServerStartInput } from '@modern-js/server-plugin';
import { ModernDevServer } from './dev-server';
import { mergeExtension } from '../../utils';
import { ModernRouteInterface } from '../../libs/route';
import { ApiServerMode } from '../../constants';

export class ModernSSRDevServer extends ModernDevServer {
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

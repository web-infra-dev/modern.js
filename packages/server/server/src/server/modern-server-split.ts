import { APIServerStartInput } from '@modern-js/server-plugin';
import { ModernServer } from './modern-server';
import { mergeExtension } from '@/utils';
import { ModernRouteInterface } from '@/libs/route';
import { ApiServerMode } from '@/constants';

export class WebModernServer extends ModernServer {
  protected prepareAPIHandler(
    _m: ApiServerMode,
    _: ReturnType<typeof mergeExtension>,
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

export class APIModernServer extends ModernServer {
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
    // noop
  }
}

import { ModernDevServer } from './dev-server';
import { ModernServer } from './modern-server';
import { mergeExtension } from '@/utils';
import { ModernRouteInterface } from '@/libs/route';
import { ApiServerMode } from '@/constants';

export class APIModernServer extends ModernServer {
  protected prepareWebHandler(_: ReturnType<typeof mergeExtension>) {
    return null as any;
  }

  protected async prepareAPIHandler(
    mode: ApiServerMode,
    extension: ReturnType<typeof mergeExtension>,
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

export class APIModernDevServer extends ModernDevServer {
  protected prepareWebHandler(_: ReturnType<typeof mergeExtension>) {
    return null as any;
  }

  protected async prepareAPIHandler(
    mode: ApiServerMode,
    extension: ReturnType<typeof mergeExtension>,
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

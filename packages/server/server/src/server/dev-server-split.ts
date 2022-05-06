import type { APIServerStartInput } from '@modern-js/server-core';
import { ServerRoute as ModernRouteInterface } from '@modern-js/types';
import { ApiServerMode, HookNames, RUN_MODE } from '@modern-js/prod-server';
import { ModernDevServer } from './dev-server';

export class ModernSSRDevServer extends ModernDevServer {
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

export class ModernAPIDevServer extends ModernDevServer {
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

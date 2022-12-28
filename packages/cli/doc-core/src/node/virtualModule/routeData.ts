import { join } from 'path';
import { UserConfig } from 'shared/types';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { PACKAGE_ROOT } from '../constants';
import { RouteService } from '../route/RouteService';

// eslint-disable-next-line import/no-mutable-exports
export let routeService: RouteService;

export async function createRouteVirtualModulePlugin(
  scanDir: string,
  config: UserConfig,
  isSSR: boolean,
) {
  routeService = new RouteService(scanDir, config);
  await routeService.init();
  // The component of route is lazy loaded
  const routeModulePath = join(
    PACKAGE_ROOT,
    'node_modules',
    'virtual-routes.js',
  );
  const plugin = new VirtualModulesPlugin({
    [routeModulePath]: routeService.generateRoutesCode(isSSR),
  });
  return plugin;
}

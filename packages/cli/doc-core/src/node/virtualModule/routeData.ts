import { join } from 'path';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { PACKAGE_ROOT } from '../constants';
import { RouteService } from '../route/RouteService';

export async function createRouteVirtualModulePlugin(scanDir: string) {
  const routeService = new RouteService(scanDir);

  await routeService.init();
  const entryPath = join(PACKAGE_ROOT, 'node_modules', 'virtual-routes.js');
  const plugin = new VirtualModulesPlugin({
    [entryPath]: routeService.generateRoutesCode(),
  });
  return plugin;
}

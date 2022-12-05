import { join } from 'path';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { RouteService } from './RouteService';

export async function createRouteVirtualModulePlugin(
  scanDir: string,
  packageRoot: string,
) {
  const routeService = new RouteService(scanDir);

  await routeService.init();
  const entryPath = join(packageRoot, 'node_modules', 'virtual-routes');
  const plugin = new VirtualModulesPlugin({
    [entryPath]: routeService.generateRoutesCode(),
  });
  return plugin;
}

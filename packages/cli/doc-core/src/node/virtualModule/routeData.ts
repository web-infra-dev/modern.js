import { join } from 'path';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { PACKAGE_ROOT } from '../constants';
import { RouteService } from '../route/RouteService';

export async function createRouteVirtualModulePlugin(scanDir: string) {
  const routeService = new RouteService(scanDir);

  await routeService.init();
<<<<<<< HEAD:packages/cli/doc-core/src/node/route/createRouteVirtualModulePlugin.ts
<<<<<<< HEAD
  const entryPath = join(packageRoot, 'node_modules', 'virtual-routes');
=======
  const entryPath = join(packageRoot, 'node_modules', 'virtual-routes.js');
>>>>>>> 48910dbf71 (feat: init doc tools and doc core)
=======
  const entryPath = join(PACKAGE_ROOT, 'node_modules', 'virtual-routes');
>>>>>>> f8c30423ea (feat: parse doc config & schema):packages/cli/doc-core/src/node/virtualModule/routeData.ts
  const plugin = new VirtualModulesPlugin({
    [entryPath]: routeService.generateRoutesCode(),
  });
  return plugin;
}

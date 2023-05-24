import { join } from 'path';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { FactoryContext, RuntimeModuleID } from '.';
import { addLeadingSlash } from '@/shared/utils';

export const normalizeRoutePath = (routePath: string) => {
  const result = routePath.replace(/\.(.*)?$/, '').replace(/index$/, '');
  return addLeadingSlash(result);
};

export async function routeVMPlugin(context: FactoryContext) {
  const { runtimeTempDir, routeService } = context;
  // client: The components of route is lazy loaded
  const routeModulePathForClient = join(
    runtimeTempDir,
    `${RuntimeModuleID.RouteForClient}.js`,
  );
  const routeModulePathForSSR = join(
    runtimeTempDir,
    `${RuntimeModuleID.RouteForSSR}.js`,
  );
  const plugin = new RuntimeModulesPlugin({
    [routeModulePathForClient]: routeService.generateRoutesCode(false),
    [routeModulePathForSSR]: routeService.generateRoutesCode(true),
  });
  return plugin;
}

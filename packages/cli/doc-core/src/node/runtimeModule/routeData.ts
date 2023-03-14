import { join } from 'path';
import { UserConfig } from 'shared/types';
import { RouteService } from '../route/RouteService';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { RuntimeModuleID } from '.';
import { addLeadingSlash } from '@/shared/utils';

// eslint-disable-next-line import/no-mutable-exports
export let routeService: RouteService;

export const normalizeRoutePath = (routePath: string) => {
  const result = routePath.replace(/\.(.*)?$/, '').replace(/index$/, '');
  return addLeadingSlash(result);
};

export async function routeVMPlugin(scanDir: string, config: UserConfig) {
  routeService = new RouteService(scanDir, config);
  await routeService.init();
  // client The component of route is lazy loaded
  const routeModulePathForClient = join(
    process.cwd(),
    'node_modules',
    `${RuntimeModuleID.RouteForClient}.js`,
  );
  const routeModulePathForSSR = join(
    process.cwd(),
    'node_modules',
    RuntimeModuleID.RouteForSSR,
  );
  const plugin = new RuntimeModulesPlugin({
    [routeModulePathForClient]: routeService.generateRoutesCode(false),
    [routeModulePathForSSR]: routeService.generateRoutesCode(true),
  });
  return plugin;
}

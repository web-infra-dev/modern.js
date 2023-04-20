import { join } from 'path';
import { UserConfig } from 'shared/types';
import { RouteService } from '../route/RouteService';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { RuntimeModuleID } from '.';
import { addLeadingSlash } from '@/shared/utils';

// eslint-disable-next-line import/no-mutable-exports
export let routeService: RouteService;
let initPromise: Promise<void> | null = null;

export const normalizeRoutePath = (routePath: string) => {
  const result = routePath.replace(/\.(.*)?$/, '').replace(/index$/, '');
  return addLeadingSlash(result);
};

export async function routeVMPlugin(
  scanDir: string,
  config: UserConfig,
  _isSSR: boolean,
  runtimeTempDir: string,
) {
  if (!routeService) {
    routeService = new RouteService(scanDir, config, runtimeTempDir);
    initPromise = routeService.init();
  }

  if (initPromise !== null) {
    await initPromise;
  }

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

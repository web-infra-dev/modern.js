import { PluginDriver } from '../PluginDriver';
import { RouteService } from './RouteService';
import { UserConfig } from '@/shared/types';

interface InitOptions {
  scanDir: string;
  config: UserConfig;
  runtimeTempDir: string;
  pluginDriver: PluginDriver;
}

// eslint-disable-next-line import/no-mutable-exports
export let routeService = null;

// The factory to create route serveice instance
export async function initRouteService(options: InitOptions) {
  const { scanDir, config, runtimeTempDir, pluginDriver } = options;
  routeService = new RouteService(
    scanDir,
    config,
    runtimeTempDir,
    pluginDriver,
  );
  await routeService.init();
  return routeService;
}

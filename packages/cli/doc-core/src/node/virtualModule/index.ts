import type { UserConfig } from 'shared/types/index';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { createRouteVirtualModulePlugin } from './routeData';
import { createSiteDataVirtualModulePlugin } from './siteData';

type VirtualModuleFactory = (
  userRoot: string,
  config: UserConfig,
) => VirtualModulesPlugin | Promise<VirtualModulesPlugin>;

export const virtualModuleFactoryList: VirtualModuleFactory[] = [
  createRouteVirtualModulePlugin,
  createSiteDataVirtualModulePlugin,
];

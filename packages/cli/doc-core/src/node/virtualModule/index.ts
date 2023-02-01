import type { UserConfig } from 'shared/types/index';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { routeVMPlugin } from './routeData';
import { siteDataVMPlugin } from './siteData';
import { globalUIComponentsVMPlugin } from './globalUIComponents';

type VirtualModuleFactory = (
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
) => VirtualModulesPlugin | Promise<VirtualModulesPlugin>;

export const virtualModuleFactoryList: VirtualModuleFactory[] = [
  routeVMPlugin,
  siteDataVMPlugin,
  globalUIComponentsVMPlugin,
];

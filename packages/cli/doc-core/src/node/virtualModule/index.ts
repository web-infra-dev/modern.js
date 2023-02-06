import type { UserConfig } from 'shared/types/index';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import { BuilderPlugin } from '@modern-js/builder-webpack-provider';
import { routeVMPlugin } from './routeData';
import { siteDataVMPlugin } from './siteData';
import { globalUIComponentsVMPlugin } from './globalUIComponents';
import { globalStylesVMPlugin } from './globalStyles';

type VirtualModuleFactory = (
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
  alias: Record<string, string | string[]>,
) => VirtualModulesPlugin | Promise<VirtualModulesPlugin>;

export const virtualModuleFactoryList: VirtualModuleFactory[] = [
  routeVMPlugin,
  siteDataVMPlugin,
  globalUIComponentsVMPlugin,
  globalStylesVMPlugin,
];

export function builderDocVMPlugin(
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
): BuilderPlugin {
  return {
    name: 'vmBuilderPlugin',
    setup(api) {
      api.modifyWebpackConfig(async webpackConfig => {
        // The order should be sync
        const virtualModulePlugins: VirtualModulesPlugin[] = [];
        for (const factory of virtualModuleFactoryList) {
          virtualModulePlugins.push(
            await factory(
              userRoot,
              config,
              isSSR,
              webpackConfig.resolve?.alias as Record<string, string | string[]>,
            ),
          );
        }
        webpackConfig.plugins!.push(...virtualModulePlugins);
      });
    },
  };
}

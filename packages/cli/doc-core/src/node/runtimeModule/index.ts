import type { UserConfig } from 'shared/types/index';
import { BuilderPlugin } from '@modern-js/builder-webpack-provider';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { routeVMPlugin } from './routeData';
import { siteDataVMPlugin } from './siteData';
import { globalUIComponentsVMPlugin } from './globalUIComponents';
import { globalStylesVMPlugin } from './globalStyles';

type VirtualModuleFactory = (
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
  alias: Record<string, string | string[]>,
) => RuntimeModulesPlugin | Promise<RuntimeModulesPlugin>;

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
      api.modifyBundlerChain(async bundlerChain => {
        // The order should be sync
        const alias = bundlerChain.resolve.alias.entries();
        let index = 0;
        for (const factory of virtualModuleFactoryList) {
          bundlerChain
            .plugin(`virtual-module-${index++}`)
            .use(
              await factory(
                userRoot,
                config,
                isSSR,
                alias as Record<string, string[]>,
              ),
            );
        }
      });
    },
  };
}

export enum RuntimeModuleID {
  GlobalStyles = 'virtual-global-styles',
  GlobalComponents = 'virtual-global-components',
  RouteForClient = 'virtual-routes',
  RouteForSSR = 'virtual-routes-ssr',
  SiteData = 'virtual-site-data',
  SearchIndexHash = 'virtual-search-index-hash',
}

export const runtimeModuleIDs = [
  RuntimeModuleID.GlobalStyles,
  RuntimeModuleID.GlobalComponents,
  RuntimeModuleID.RouteForClient,
  RuntimeModuleID.RouteForSSR,
  RuntimeModuleID.SiteData,
  RuntimeModuleID.SearchIndexHash,
];

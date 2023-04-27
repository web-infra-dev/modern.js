import type { UserConfig } from 'shared/types/index';
import { BuilderPlugin } from '@modern-js/builder';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { routeVMPlugin } from './routeData';
import { siteDataVMPlugin } from './siteData';
import { i18nVMPlugin } from './i18n';
import { globalUIComponentsVMPlugin } from './globalUIComponents';
import { globalStylesVMPlugin } from './globalStyles';

type RuntimeModuleFactory = (
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
  runtimeTempDir: string,
  alias: Record<string, string | string[]>,
) => RuntimeModulesPlugin | Promise<RuntimeModulesPlugin>;

export const runtimeModuleFactory: RuntimeModuleFactory[] = [
  routeVMPlugin,
  siteDataVMPlugin,
  globalUIComponentsVMPlugin,
  globalStylesVMPlugin,
  i18nVMPlugin,
];

export function builderDocVMPlugin(
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
  runtimeTempDir: string,
): BuilderPlugin {
  return {
    name: 'vmBuilderPlugin',
    setup(api) {
      api.modifyBundlerChain(async bundlerChain => {
        // The order should be sync
        const alias = bundlerChain.resolve.alias.entries();
        let index = 0;
        for (const factory of runtimeModuleFactory) {
          bundlerChain
            .plugin(`runtime-module-${index++}`)
            .use(
              await factory(
                userRoot,
                config,
                isSSR,
                runtimeTempDir,
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
  I18nText = 'virtual-i18n-text',
}

export const runtimeModuleIDs = [
  RuntimeModuleID.GlobalStyles,
  RuntimeModuleID.GlobalComponents,
  RuntimeModuleID.RouteForClient,
  RuntimeModuleID.RouteForSSR,
  RuntimeModuleID.SiteData,
  RuntimeModuleID.SearchIndexHash,
  RuntimeModuleID.I18nText,
];

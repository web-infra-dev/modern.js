import type { UserConfig } from 'shared/types/index';
import { BuilderPlugin } from '@modern-js/builder';
import { RouteService } from '../route/RouteService';
import { PluginDriver } from '../PluginDriver';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { routeVMPlugin } from './routeData';
import { siteDataVMPlugin } from './siteData';
import { i18nVMPlugin } from './i18n';
import { globalUIComponentsVMPlugin } from './globalUIComponents';
import { globalStylesVMPlugin } from './globalStyles';

export interface FactoryContext {
  userRoot: string;
  config: UserConfig;
  isSSR: boolean;
  runtimeTempDir: string;
  alias: Record<string, string | string[]>;
  routeService: RouteService;
  pluginDriver: PluginDriver;
}

type RuntimeModuleFactory = (
  context: FactoryContext,
) => RuntimeModulesPlugin | Promise<RuntimeModulesPlugin>;

export const runtimeModuleFactory: RuntimeModuleFactory[] = [
  routeVMPlugin,
  siteDataVMPlugin,
  globalUIComponentsVMPlugin,
  globalStylesVMPlugin,
  i18nVMPlugin,
];

export function builderDocVMPlugin(
  factoryContext: Omit<FactoryContext, 'alias'>,
): BuilderPlugin {
  return {
    name: 'vmBuilderPlugin',
    setup(api) {
      api.modifyBundlerChain(async bundlerChain => {
        // The order should be sync
        const alias = bundlerChain.resolve.alias.entries();
        let index = 0;
        for (const factory of runtimeModuleFactory) {
          bundlerChain.plugin(`runtime-module-${index++}`).use(
            await factory({
              ...factoryContext,
              alias,
            }),
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

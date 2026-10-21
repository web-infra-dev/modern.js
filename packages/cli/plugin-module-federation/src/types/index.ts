import type { moduleFederationPlugin } from '@module-federation/sdk';
import type { StatsAssetResource } from '@module-federation/rsbuild-plugin/utils';

export interface PluginOptions {
  config?: moduleFederationPlugin.ModuleFederationPluginOptions;
  configPath?: string;
  /**
   * Automatically set the federation optimization target from the Modern.js
   * SSR and bundler target configuration.
   * @default true
   */
  autoOptimization?: boolean;
  ssr?:
    | {
        distOutputDir?: string;
      }
    | boolean;
  fetchServerQuery?: Record<string, unknown>;
  secondarySharedTreeShaking?: boolean;
}

export type AssetFileNames = {
  statsFileName: string;
  manifestFileName: string;
};
export interface InternalModernPluginOptions {
  csrConfig?: moduleFederationPlugin.ModuleFederationPluginOptions;
  ssrConfig?: moduleFederationPlugin.ModuleFederationPluginOptions;
  distOutputDir: string;
  originPluginOptions: PluginOptions;
  browserPlugin?: BundlerPlugin;
  nodePlugin?: BundlerPlugin;
  assetFileNames: {
    node?: AssetFileNames;
    browser?: AssetFileNames;
  };
  assetResources: {
    browser?: StatsAssetResource;
    node?: StatsAssetResource;
  };
  userConfig?: PluginOptions;
  fetchServerQuery?: Record<string, unknown>;
  secondarySharedTreeShaking?: boolean;
}

export type BundlerPlugin = any;

export type ModuleFederationConfig = boolean | PluginOptions;

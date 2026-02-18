import type { StatsAssetResource } from '@module-federation/rsbuild-plugin/utils';
import type { moduleFederationPlugin } from '@module-federation/sdk';

export interface PluginOptions {
  config?: moduleFederationPlugin.ModuleFederationPluginOptions;
  configPath?: string;
  ssr?:
    | {
        distOutputDir?: string;
      }
    | boolean;
  remoteIpStrategy?: 'ipv4' | 'inherit';
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
  remoteIpStrategy?: 'ipv4' | 'inherit';
  userConfig?: PluginOptions;
  fetchServerQuery?: Record<string, unknown>;
  secondarySharedTreeShaking?: boolean;
}

export type BundlerPlugin = any;

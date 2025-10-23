import type { ModuleFederationPlugin as WebpackModuleFederationPlugin } from '@module-federation/enhanced';
import type { ModuleFederationPlugin as RspackModuleFederationPlugin } from '@module-federation/enhanced/rspack';
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
  remotes?: moduleFederationPlugin.ModuleFederationPluginOptions['remotes'];
}

export interface InternalModernPluginOptions {
  csrConfig?: moduleFederationPlugin.ModuleFederationPluginOptions;
  ssrConfig?: moduleFederationPlugin.ModuleFederationPluginOptions;
  distOutputDir: string;
  originPluginOptions: PluginOptions;
  manifestRemotes: Record<string, string>;
  browserPlugin?: BundlerPlugin;
  nodePlugin?: BundlerPlugin;
  remoteIpStrategy?: 'ipv4' | 'inherit';
  userConfig?: PluginOptions;
  fetchServerQuery?: Record<string, unknown>;
}

export type BundlerPlugin = any;

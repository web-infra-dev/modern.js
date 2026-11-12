import type { moduleFederationPlugin } from '@module-federation/sdk';
import type { StatsAssetResource } from '@module-federation/rsbuild-plugin/utils';
import type { BridgeServices } from '@module-federation/bridge-react/service-node';
import type { ServiceProviderOptions } from '../serviceProvider';
import type { SSRRequestCoordinatorOptions } from '@modern-js/server-core/node';

export interface PluginOptions {
  /** Automatically publish and serve isService Bridge exposes. */
  serviceProvider?: ServiceProviderOptions;
  /** Public Host origin when a trusted gateway terminates TLS or rewrites Host. */
  serviceOrigin?: string;
  /** Optional Host request policies. Service addresses come from the Snapshot. */
  services?: BridgeServices;
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
        /** Enable the experimental server entry invalidation integration. */
        cacheUpdates?: boolean;
        /** Admission and drain policy used by explicit updates and development refresh. */
        application?: Partial<
          Pick<
            SSRRequestCoordinatorOptions,
            | 'requestPolicy'
            | 'maxPendingRequests'
            | 'requestTimeoutMs'
            | 'drainTimeoutMs'
            | 'maxResumeConcurrency'
            | 'maxPendingUpdates'
          >
        >;
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
  devBuildVersion?: ReturnType<
    typeof import('../cli/devManifest').createDevBuildVersion
  >;
  devManifestReady?: boolean;
  waitForServiceRuntimePlugins?: (compilation?: object) => Promise<void>;
  userConfig?: PluginOptions;
  fetchServerQuery?: Record<string, unknown>;
  secondarySharedTreeShaking?: boolean;
}

export type BundlerPlugin = any;

export type ModuleFederationConfig = boolean | PluginOptions;

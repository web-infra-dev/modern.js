import type { moduleFederationPlugin } from '@module-federation/sdk';
import type { StatsAssetResource } from '@module-federation/rsbuild-plugin/utils';
import type { BridgeServices } from '@module-federation/bridge-react/service-node';
import type { ServiceProviderOptions } from '../serviceProvider';
import type { SSRApplicationOptions } from '@modern-js/server-core/node';

export interface ApplicationsOptions {
  /** Path to the runtime data hooks module (e.g. './src/applications.ts'). */
  hooks?: string;
  /** Automatically install discovered routes into the current consumer Router. @default true */
  autoGenerateRoute?: boolean;
  /** Maximum discovery recursion depth. @default 8 */
  maxDepth?: number;
  /** Timeout in milliseconds for a discovery run. @default 15000 */
  timeoutMs?: number;
}

export interface PluginOptions {
  /** Optional container name when enabling built-in MF without module-federation.config.ts. */
  name?: string;
  /** Enable native micro-frontend dynamic application discovery. */
  applications?: boolean | ApplicationsOptions;
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
            SSRApplicationOptions,
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
  devManifestPublication?: ReturnType<
    typeof import('../cli/devManifest').createDevManifestPublication
  >;
  devManifestReady?: boolean;
  recoverDevSSR?: () => Promise<void>;
  waitForServiceRuntimePlugins?: (compilation?: object) => Promise<void>;
  userConfig?: PluginOptions;
  fetchServerQuery?: Record<string, unknown>;
  secondarySharedTreeShaking?: boolean;
}

export type BundlerPlugin = any;

export type ModuleFederationConfig = boolean | PluginOptions;

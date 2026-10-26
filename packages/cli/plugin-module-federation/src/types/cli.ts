import type { BuilderConfig } from '@modern-js/builder';
import type { CLIPluginAPI, CLIPluginExtends, Plugin } from '@modern-js/plugin';
import type { RsbuildConfig, RsbuildPlugins } from '@rsbuild/core';
import type { ServerUserConfig } from '@modern-js/server-core';
import type { SetupMiddlewares } from '@modern-js/server';
import type { ModuleFederationConfig } from './index';

// Only the configuration consumed or supplied by this adapter belongs here.
// Keeping the adapter structural avoids a package/build dependency on app-tools.
export interface FederationAppConfig {
  moduleFederation?: ModuleFederationConfig;
  server?: Pick<ServerUserConfig, 'ssr' | 'port'>;
  source?: { enableAsyncEntry?: boolean };
  dev?: Pick<
    NonNullable<RsbuildConfig['dev']>,
    'assetPrefix' | 'lazyCompilation'
  > & { setupMiddlewares?: SetupMiddlewares };
  tools?: BuilderConfig['tools'];
  output?: Pick<NonNullable<BuilderConfig['output']>, 'distPath'>;
  deploy?: {
    microFrontend?:
      | boolean
      | {
          enableHtmlEntry?: boolean;
          externalBasicLibrary?: boolean;
          moduleApp?: string;
        };
  };
  resolve?: RsbuildConfig['resolve'];
  builderPlugins?: RsbuildPlugins;
}
type BaseAPI = CLIPluginAPI<Required<CLIPluginExtends<FederationAppConfig>>>;
export type FederationAPI = Pick<
  BaseAPI,
  | 'getConfig'
  | 'config'
  | 'modifyBundlerChain'
  | '_internalRuntimePlugins'
  | '_internalServerPlugins'
  | 'onAfterBuild'
  | 'onDevCompileDone'
  | 'addWatchFiles'
  | 'isPluginExists'
> & {
  getAppContext(): {
    appDirectory: string;
    distDirectory: string;
    port?: number;
  };
};
export type FederationCliPlugin = Plugin<FederationAPI>;

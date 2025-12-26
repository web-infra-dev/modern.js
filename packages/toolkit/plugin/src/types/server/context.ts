import type { ServerRoute } from '@modern-js/types';
import type { ServerPluginAPI } from './api';
import type { Hooks } from './hooks';
import type { ServerPlugin, ServerPluginExtends } from './plugin';

export interface Middleware {
  name: string;
}

export type ServerContext<Extends extends ServerPluginExtends> = {
  middlewares: Middleware[];
  routes: ServerRoute[];
  appDirectory: string;
  apiDirectory?: string;
  lambdaDirectory?: string;
  internalDirectory?: string;
  sharedDirectory?: string;
  distDirectory?: string;
  metaName: string;
  plugins: ServerPlugin<Extends>[];
  appDependencies?: Record<string, Promise<any>>;
};

export type InternalServerContext<Extends extends ServerPluginExtends> =
  ServerContext<Extends> & {
    /** All hooks. */
    hooks: Hooks<Extends['config']> & Extends['extendHooks'];
    /** All plugin registry hooks */
    extendsHooks: Extends['extendHooks'];
    config: Extends['config'];
    pluginAPI?: ServerPluginAPI<Extends>;
    _internalContext?: InternalServerContext<Extends>;
  };

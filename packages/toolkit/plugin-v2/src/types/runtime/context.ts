import type { Hooks } from '../../runtime/hooks';
import type { RuntimePluginAPI } from './api';
import type { RuntimePlugin, RuntimePluginExtends } from './plugin';

export interface RuntimeContext<Extends extends RuntimePluginExtends> {
  plugins: RuntimePlugin<Extends>[];
}

export type InternalContext<Extends extends RuntimePluginExtends> =
  RuntimeContext<Extends> & {
    /** All hooks. */
    hooks: Hooks<
      Extends['config'],
      RuntimeContext<Extends> & Extends['extendContext']
    > &
      Extends['extendHooks'];
    /** All plugin registry hooks */
    extendsHooks: Extends['extendHooks'];
    config: Extends['config'];
    pluginAPI?: RuntimePluginAPI<Extends>;
  };

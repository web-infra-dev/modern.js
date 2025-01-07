import type { Hooks } from '../../runtime/hooks';
import type { RuntimePluginAPI } from './api';
import type { RuntimePluginExtends } from './plugin';

export type RuntimeContext = {};

export type InternalRuntimeContext<Extends extends RuntimePluginExtends> =
  RuntimeContext & {
    /** All hooks. */
    hooks: Hooks<Extends['config'], RuntimeContext & Extends['extendContext']> &
      Extends['extendHooks'];
    /** All plugin registry hooks */
    extendsHooks: Extends['extendHooks'];
    config: Extends['config'];
    pluginAPI?: RuntimePluginAPI<Extends>;
  };

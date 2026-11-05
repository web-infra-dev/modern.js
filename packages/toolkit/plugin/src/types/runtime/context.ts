import type { RuntimePluginAPI } from './api';
import type { Hooks } from './hooks';
import type { RuntimePluginExtends } from './plugin';

export type RuntimeContext = {};

export type InternalRuntimeContext<Extends extends RuntimePluginExtends> =
  RuntimeContext & {
    /** One mutable context owned by this runtime instance. */
    runtimeContext: RuntimeContext & Extends['extendContext'];
    /** Resolves after every setup and configuration hook has completed. */
    ready: Promise<void>;
    readonly disposed: boolean;
    /** Release registered instance resources once, in reverse registration order. */
    dispose: () => void;
    onDispose: (callback: () => void) => void;
    /** All hooks. */
    hooks: Hooks<Extends['config'], RuntimeContext & Extends['extendContext']> &
      Extends['extendHooks'];
    /** All plugin registry hooks */
    extendsHooks: Extends['extendHooks'];
    config: Extends['config'];
    pluginAPI?: RuntimePluginAPI<Extends>;
    _internalContext?: InternalRuntimeContext<Extends>;
  };

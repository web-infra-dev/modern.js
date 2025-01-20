import type { PluginHookTap } from '../hooks';
import type { DeepPartial } from '../utils';
import type { RuntimeContext } from './context';
import type { Hooks } from './hooks';
import type {
  ModifyRuntimeConfigFn,
  OnBeforeRenderFn,
  PickContextFn,
  WrapRootFn,
} from './hooks';
import type { RuntimePluginExtends } from './plugin';

export type RuntimePluginAPI<Extends extends RuntimePluginExtends> = Readonly<{
  updateRuntimeContext: (updateContext: DeepPartial<RuntimeContext>) => void;
  getHooks: () => Readonly<
    Hooks<Extends['config'], RuntimeContext & Extends['extendContext']> &
      Extends['extendHooks']
  >;
  getRuntimeConfig: () => Readonly<Extends['config']>;
  onBeforeRender: PluginHookTap<OnBeforeRenderFn<Extends['extendContext']>>;
  wrapRoot: PluginHookTap<WrapRootFn>;
  pickContext: PluginHookTap<PickContextFn<RuntimeContext>>;
  modifyRuntimeConfig: PluginHookTap<ModifyRuntimeConfigFn<Extends['config']>>;
}>;

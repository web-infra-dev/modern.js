import type { PluginHook, PluginHookTap } from '../hooks';
import type { DeepPartial } from '../utils';
import type { ServerContext } from './context';
import type { Hooks, ModifyConfigFn, OnPrepareFn, OnResetFn } from './hooks';
import type { ServerPluginExtends } from './plugin';

export type ServerPluginAPI<Extends extends ServerPluginExtends> = Readonly<
  {
    getServerContext: () => Readonly<
      ServerContext<Extends> & Extends['extendContext']
    >;
    updateServerContext: (
      updateContext: DeepPartial<
        ServerContext<Extends> & Extends['extendContext']
      >,
    ) => void;
    getHooks: () => Readonly<Hooks<Extends['config']> & Extends['extendHooks']>;
    getServerConfig: () => Readonly<Extends['config']>;
    modifyConfig: PluginHookTap<ModifyConfigFn<Extends['config']>>;
    onPrepare: PluginHookTap<OnPrepareFn>;
    onReset: PluginHookTap<OnResetFn>;
  } & ServerPluginExtendsAPI<Extends>
>;

export type ServerPluginExtendsAPI<Extends extends ServerPluginExtends> = {
  [K in keyof Extends['extendHooks']]: PluginHookTap<
    Extends['extendHooks'][K] extends PluginHook<infer Args>
      ? Args extends (...args: any[]) => any
        ? Args
        : (...args: any[]) => any
      : (...args: any[]) => any
  >;
} & Extends['extendApi'];

export type AllKeysForServerPluginExtendsAPI<
  Extends extends ServerPluginExtends,
> = keyof ServerPluginExtendsAPI<Extends>;

export type AllValueForServerPluginExtendsAPI<
  Extends extends ServerPluginExtends,
> = ServerPluginExtendsAPI<Extends>[AllKeysForServerPluginExtendsAPI<Extends>];

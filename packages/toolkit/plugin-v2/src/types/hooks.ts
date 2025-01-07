import type { UnwrapPromise } from './utils';

export type SyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback) => void;
  call: (...args: Parameters<Callback>) => ReturnType<Callback>;
};

export type AsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback) => void;
  call: (...args: Parameters<Callback>) => Promise<ReturnType<Callback>>;
};

export type CollectAsyncHook<Callback extends (...params: any[]) => any> = {
  tap: (cb: Callback) => void;
  call: (
    ...params: Parameters<Callback>
  ) => Promise<UnwrapPromise<ReturnType<Callback>>[]>;
};

export type PluginHook<Callback extends (...args: any[]) => any> =
  | SyncHook<Callback>
  | AsyncHook<Callback>
  | CollectAsyncHook<Callback>;

export type PluginHookTap<T extends (...args: any[]) => any> = (
  options: T,
) => void;

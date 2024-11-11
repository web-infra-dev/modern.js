export type AsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback) => void;
  call: (...args: Parameters<Callback>) => Promise<Parameters<Callback>>;
};

export type CollectAsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback) => void;
  call: (...args: Parameters<Callback>) => Promise<ReturnType<Callback>[]>;
};

export type PluginHook<Callback extends (...args: any[]) => any> =
  | AsyncHook<Callback>
  | CollectAsyncHook<Callback>;

export type PluginHookTap<T extends (...args: any[]) => any> = (
  options: T,
) => void;

export type AnyFn = (...args: any) => any;

export type Hooks = {
  [key: string]: AnyFn;
};

export type AsyncHooks =
  | {
      enable: () => void;
      disable: () => void;
      set: (value: Hooks) => void;
      get: () => Hooks | undefined;
      clear: () => void;
      entries: () => IterableIterator<[number, Hooks]>;
    }
  | undefined;

// eslint-disable-next-line import/no-mutable-exports
export let asyncHooks: AsyncHooks;

export const impl = (implimentations: AsyncHooks) => {
  asyncHooks = implimentations;
};

export const reset = () => {
  asyncHooks = undefined;
};

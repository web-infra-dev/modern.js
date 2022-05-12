import { createHooks } from './hook';

const ContextSymbol = Symbol('Context');

export type Context<T = any> = {
  id: symbol;
  [ContextSymbol]: T;
  // create a new context equipped a new value
  create: (value: T) => Context<T>;
  // get context ref { value } for accessing context in current container of pipeline
  use: () => {
    value: T;
  };
  // get context value
  get: () => T;
  // set context value
  set: (value: T) => void;
};

export const createContext = <T>(value: T) => {
  const id = Symbol('ContextID');

  const create = (value: T): Context<T> => {
    const use = () => {
      const container = useContainer();
      return Object.seal({
        get value() {
          return container.read(Context);
        },
        set value(v) {
          container.write(Context, v);
        },
      });
    };
    const get = () => {
      const container = useContainer();
      return container.read(Context);
    };
    const set = (v: T) => {
      const container = useContainer();
      container.write(Context, v);
    };
    const Context: Context<T> = {
      id,
      [ContextSymbol]: value,
      create,
      use,
      get,
      set,
    };
    return Context;
  };

  return create(value);
};

export type ContextStorage = {
  [key: string]: Context;
};

export type Container = {
  read: <V>(Context: Context<V>) => V;
  write: <V>(Context: Context<V>, value: V) => void;
};

const createContextMap = (storage: ContextStorage) => {
  const contextMap = new Map<symbol, Context>();
  const contexts = Object.values(storage);

  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < contexts.length; i++) {
    contextMap.set(contexts[i].id, contexts[i]);
  }

  return contextMap;
};

export const createContainer = (
  ContextStorage: ContextStorage = {},
): Container => {
  const contextMap = createContextMap(ContextStorage);

  const read: Container['read'] = context => {
    const target = contextMap.get(context.id);
    if (target) {
      return target[ContextSymbol];
    }
    return context[ContextSymbol];
  };

  const write: Container['write'] = (context, value) => {
    contextMap.set(context.id, context.create(value));
  };

  return Object.freeze({
    read,
    write,
  });
};

export type Hooks = {
  useContainer: () => Container;
};

const { run, hooks } = createHooks<Hooks>({
  useContainer: () => {
    throw new Error(
      `Can't call useContainer out of scope, it should be placed on top of the function`,
    );
  },
});

export const runHooks = run;

export const { useContainer } = hooks;

export const fromContainer = (container: Container): Hooks => ({
  useContainer: () => {
    return container;
  },
});

export const runWithContainer = <F extends (...args: any) => any>(
  f: F,
  container: Container,
) => runHooks(f, fromContainer(container));

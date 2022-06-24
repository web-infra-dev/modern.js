/**
 * modified from https://github.com/farrow-js/farrow/tree/master/packages/farrow-pipeline
 * license at https://github.com/farrow-js/farrow/blob/master/LICENSE
 */
export type Context<T = any> = {
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
  let currentValue: T;

  const create = (value: T): Context<T> => {
    currentValue = value;

    const use = () => ({
      get value() {
        return currentValue;
      },
      set value(v) {
        currentValue = v;
      },
    });
    const get = () => currentValue;
    const set = (v: T) => {
      currentValue = v;
    };
    const Context: Context<T> = {
      create,
      use,
      get,
      set,
    };
    return Context;
  };

  return create(value);
};

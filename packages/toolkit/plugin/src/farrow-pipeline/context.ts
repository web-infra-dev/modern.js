/**
 * modified from https://github.com/farrow-js/farrow/tree/master/packages/farrow-pipeline
 * license at https://github.com/farrow-js/farrow/blob/master/LICENSE
 */

export type Context<T = any> = {
  // get context ref { value } for accessing context in current container of pipeline
  use: () => {
    value: T;
  };
  // get context value
  get: () => T;
  // set context value
  set: (value: T) => void;
};

export const createContext = <T>(value: T): Context<T> => {
  let currentValue = value;

  return {
    use: () => ({
      get value() {
        return currentValue;
      },
      set value(v) {
        currentValue = v;
      },
    }),
    get: () => currentValue,
    set: (v: T) => {
      currentValue = v;
    },
  };
};

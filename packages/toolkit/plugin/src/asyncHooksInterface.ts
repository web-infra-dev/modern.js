/**
 * Copyright Lucifier129 and other contributors.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/farrow-js/farrow/blob/master/LICENSE
 *
 */

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

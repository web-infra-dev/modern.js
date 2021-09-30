/**
 * Copyright Lucifier129 and other contributors.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/farrow-js/farrow/blob/master/LICENSE
 *
 */

import NodeAsyncHooks from 'async_hooks';
import * as asyncHooksInterface from './asyncHooksInterface';

const createAsyncHooks = <T>() => {
  const store = new Map<number, T>();

  // eslint-disable-next-line node/no-unsupported-features/node-builtins
  const hooks = NodeAsyncHooks.createHook({
    init: (asyncId, _, triggerAsyncId) => {
      if (store.has(triggerAsyncId)) {
        const value = store.get(triggerAsyncId)!;
        store.set(asyncId, value);
      }
    },
    destroy: asyncId => {
      if (store.has(asyncId)) {
        store.delete(asyncId);
      }
    },
  });

  const set = (value: T) => {
    store.set(NodeAsyncHooks.executionAsyncId(), value);
  };

  const get = () => store.get(NodeAsyncHooks.executionAsyncId());

  const enable = () => {
    hooks.enable();
  };

  const disable = () => {
    hooks.disable();
    store.clear();
  };

  return {
    enable,
    disable,
    set,
    get,
  };
};

export const enable = () => {
  const hooks = createAsyncHooks<asyncHooksInterface.Hooks>();
  disable();
  asyncHooksInterface.impl(hooks);
  hooks.enable();
};

export const disable = () => {
  asyncHooksInterface.asyncHooks?.disable();
  asyncHooksInterface.reset();
};

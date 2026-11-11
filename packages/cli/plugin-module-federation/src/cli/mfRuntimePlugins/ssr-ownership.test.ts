import { expect, it, rs } from '@rstest/core';
import plugin, { ownershipKey } from './ssr-ownership';

it('observes dynamic loads and rejects them before execution during selective updates', async () => {
  const load = rs.fn(async () => 'loaded');
  const instance = {
    loadRemote: load,
    registerRemotes: rs.fn(),
  } as any;
  plugin().apply!(instance);
  const state = instance[ownershipKey];
  await instance.loadRemote('remote/Value', { from: 'build' });
  expect(state.dynamic).toBe(false);
  state.selective = true;
  await expect(instance.loadRemote('remote/Value')).rejects.toThrow(
    'Dynamic MF consumption',
  );
  expect(load).toHaveBeenCalledTimes(1);
  expect(state.dynamic).toBe(true);
});

it('authorizes registration by async context rather than a process-wide flag', async () => {
  const register = rs.fn();
  const instance = { loadRemote: rs.fn(), registerRemotes: register } as any;
  plugin().apply!(instance);
  const state = instance[ownershipKey];
  const token = {};
  state.owner = token;
  state.selective = true;
  expect(() => instance.registerRemotes([])).toThrow(
    'outside the active SSR update owner',
  );
  expect(register).not.toHaveBeenCalled();
  await state.context.run(token, async () => {
    await Promise.resolve();
    instance.registerRemotes([]);
  });
  expect(register).toHaveBeenCalledTimes(1);
});

it('rejects an external asynchronous update while another owner is active', async () => {
  const update = rs.fn(async () => {});
  const instance = {
    loadRemote: rs.fn(),
    registerRemotes: rs.fn(),
    updateRemotes: update,
  } as any;
  plugin().apply!(instance);
  const state = instance[ownershipKey];
  const token = {};
  state.owner = token;
  await expect(instance.updateRemotes([])).rejects.toThrow(
    'outside the active SSR update owner',
  );
  expect(update).not.toHaveBeenCalled();
  await state.context.run(token, async () => {
    await Promise.resolve();
    await instance.updateRemotes([]);
  });
  expect(update).toHaveBeenCalledTimes(1);
});

it('releases owned remote entries but preserves an externally consumed container', async () => {
  const previous = (globalThis as any).__FEDERATION__;
  const previousLoading = (globalThis as any).__GLOBAL_LOADING_REMOTE_ENTRY__;
  try {
    const clear = rs.fn();
    const container = { __webpack_clear_cache__: clear };
    const other = {
      name: 'other',
      moduleCache: new Map([['remote', { remoteEntryExports: container }]]),
    };
    (globalThis as any).__FEDERATION__ = {
      __INSTANCES__: [other],
      __SHARE__: {},
    };
    const pending = Promise.resolve(container);
    (globalThis as any).__GLOBAL_LOADING_REMOTE_ENTRY__ = {
      'remote:entry': pending,
    };
    const owner = plugin();
    await owner.afterLoadEntry!({
      remoteInfo: { name: 'remote', entry: 'entry' },
      remoteEntryExports: container,
    } as any);
    await owner.dispose!({ origin: { name: 'host' } } as any);
    expect(clear).not.toHaveBeenCalled();
    const next = plugin();
    await next.afterLoadEntry!({
      remoteInfo: { name: 'remote', entry: 'entry' },
      remoteEntryExports: container,
    } as any);
    (globalThis as any).__FEDERATION__.__INSTANCES__ = [];
    await next.dispose!({ origin: { name: 'host' } } as any);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(
      (globalThis as any).__GLOBAL_LOADING_REMOTE_ENTRY__['remote:entry'],
    ).toBeUndefined();
  } finally {
    (globalThis as any).__FEDERATION__ = previous;
    (globalThis as any).__GLOBAL_LOADING_REMOTE_ENTRY__ = previousLoading;
  }
});

it('forgets all removed remote URLs without clearing another remote or the replacement', async () => {
  const owner = plugin();
  const oldClear = rs.fn();
  const olderClear = rs.fn();
  const otherClear = rs.fn();
  const newClear = rs.fn();
  for (const [name, entry, clear] of [
    ['remote', 'v1', oldClear],
    ['remote', 'v0', olderClear],
    ['other', 'v1', otherClear],
  ] as const) {
    await owner.afterLoadEntry!({
      remoteInfo: { name, entry },
      remoteEntryExports: { __webpack_clear_cache__: clear },
    } as any);
  }
  await owner.removeRemote!({
    remote: { name: 'remote', alias: 'alias' },
  } as any);
  expect(oldClear).not.toHaveBeenCalled();
  await owner.afterLoadEntry!({
    remoteInfo: { name: 'remote', entry: 'v1' },
    remoteEntryExports: { __webpack_clear_cache__: newClear },
  } as any);
  await owner.dispose!({ origin: { name: 'host' } } as any);
  expect(oldClear).not.toHaveBeenCalled();
  expect(olderClear).not.toHaveBeenCalled();
  expect(otherClear).toHaveBeenCalledTimes(1);
  expect(newClear).toHaveBeenCalledTimes(1);
});

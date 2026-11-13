import nodeRuntimePlugin from '@module-federation/node/runtimePlugin';
import { destroyNodeInstance } from '@module-federation/node/lifecycle';
import { expect, it, rs } from '@rstest/core';
import { createInstance, helpers } from '@module-federation/enhanced/runtime';
import {
  bindSSRRuntime,
  createSSRUpdateOwner,
  releaseSSRUpdateOwner,
} from '../../server/ssrUpdateOwner';
import {
  clearSSRUpdateCandidates,
  setSSRUpdateCandidates,
} from '../../server/ssrUpdateCandidates';
import plugin, { ownershipKey } from './ssr-ownership';

it.each(['candidate', 'snapshot'])(
  'adopts loaded singletons only from the selected provider build through %s',
  async mode => {
    const firstValue = {};
    const selectedValue = {};
    const localValue = {};
    const first = createInstance({
      name: 'singleton-provider',
      id: 'singleton-provider:one',
      plugins: [nodeRuntimePlugin()],
      shared: { library: { version: '1.0.0', lib: () => firstValue } },
    });
    const selected = createInstance({
      name: 'singleton-provider',
      id: 'singleton-provider:two',
      plugins: [nodeRuntimePlugin()],
      shared: {
        library: { version: '1.0.0', lib: () => selectedValue },
        plain: { version: '1.0.0', lib: () => selectedValue },
        differentVersion: { version: '2.0.0', lib: () => selectedValue },
      },
    });
    const owner = createSSRUpdateOwner('singleton-consumer');
    const snapshot = {
      buildVersion: 'two',
      version: 'https://provider.test/two/manifest.json',
      remoteEntry: 'entry.js',
      remotesInfo: {},
    };
    const resetSnapshot = helpers.global.addGlobalSnapshot(
      mode === 'snapshot'
        ? { [`singleton-provider:${snapshot.version}`]: snapshot }
        : {},
    );
    if (mode === 'candidate')
      setSSRUpdateCandidates(owner.id, [
        {
          name: 'singleton-provider',
          entry: snapshot.version,
          moduleInfo: snapshot,
        },
      ]);
    const host = createInstance({
      name: owner.name,
      remotes: [
        {
          name: 'singleton-provider',
          alias: 'registered-provider',
          entry:
            mode === 'candidate'
              ? 'https://provider.test/one/manifest.json'
              : snapshot.version,
        },
      ],
      shared: {
        library: {
          version: '1.0.0',
          lib: () => localValue,
          shareConfig: { singleton: true },
        },
        plain: { version: '1.0.0', lib: () => localValue },
        differentVersion: {
          version: '1.0.0',
          lib: () => localValue,
          shareConfig: { singleton: true },
        },
      },
      plugins: [
        nodeRuntimePlugin(),
        {
          name: 'bind-test-owner',
          beforeInit(args) {
            bindSSRRuntime(owner, args.origin);
            return args;
          },
        },
        plugin(),
      ],
    });
    try {
      expect(host.loadShareSync('library')()).toBe(selectedValue);
      expect(host.shareScopeMap.default.library['1.0.0']).toBe(
        selected.shareScopeMap.default.library['1.0.0'],
      );
      expect(host.loadShareSync('plain')()).toBe(localValue);
      expect(host.loadShareSync('differentVersion')()).toBe(localValue);
      expect(first.loadShareSync('library')()).toBe(firstValue);
    } finally {
      await destroyNodeInstance(host);
      await destroyNodeInstance(first);
      await destroyNodeInstance(selected);
      clearSSRUpdateCandidates(owner.id);
      releaseSSRUpdateOwner(owner);
      resetSnapshot();
    }
  },
);

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

it('releases only its build entry promise when the URL and provider name are shared', async () => {
  const previous = (globalThis as any).__FEDERATION__;
  const previousLoading = (globalThis as any).__GLOBAL_LOADING_REMOTE_ENTRY__;
  const globalName = 'ownershipVersionedEntry';
  try {
    (globalThis as any).__FEDERATION__ = { __INSTANCES__: [], __SHARE__: {} };
    const oldEntry = { __webpack_clear_cache__: rs.fn() };
    const newEntry = { __webpack_clear_cache__: rs.fn() };
    const oldLoading = Promise.resolve(oldEntry);
    const newLoading = Promise.resolve(newEntry);
    (globalThis as any).__GLOBAL_LOADING_REMOTE_ENTRY__ = {
      'remote:entry:v1': oldLoading,
      'remote:entry:v2': newLoading,
    };
    (globalThis as any)[globalName] = newEntry;
    const owner = plugin();
    await owner.afterLoadEntry!({
      remoteInfo: {
        name: 'remote',
        entry: 'entry',
        buildVersion: 'v1',
        entryGlobalName: globalName,
      },
      remoteEntryExports: oldEntry,
    } as any);
    await owner.dispose!({ origin: { name: 'host' } } as any);
    expect(oldEntry.__webpack_clear_cache__).toHaveBeenCalledTimes(1);
    expect(newEntry.__webpack_clear_cache__).not.toHaveBeenCalled();
    expect(
      (globalThis as any).__GLOBAL_LOADING_REMOTE_ENTRY__['remote:entry:v1'],
    ).toBeUndefined();
    expect(
      (globalThis as any).__GLOBAL_LOADING_REMOTE_ENTRY__['remote:entry:v2'],
    ).toBe(newLoading);
    expect((globalThis as any)[globalName]).toBe(newEntry);
  } finally {
    (globalThis as any).__FEDERATION__ = previous;
    (globalThis as any).__GLOBAL_LOADING_REMOTE_ENTRY__ = previousLoading;
    delete (globalThis as any)[globalName];
  }
});

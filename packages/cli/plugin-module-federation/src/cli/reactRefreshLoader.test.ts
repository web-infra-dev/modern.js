import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { expect, it, rs } from '@rstest/core';
import reactRefreshLoader from './reactRefreshLoader';

const builderRequire = createRequire(require.resolve('@modern-js/builder'));
const reactRequire = createRequire(
  builderRequire.resolve('@rsbuild/plugin-react'),
);
const refreshRequire = createRequire(
  reactRequire.resolve('@rspack/plugin-react-refresh'),
);
const runtimePath = refreshRequire.resolve('react-refresh/runtime');
const source = readFileSync(
  path.join(
    path.dirname(runtimePath),
    'cjs/react-refresh-runtime.development.js',
  ),
  'utf8',
);

function runtime(patch = true): any {
  // Real independent Refresh instances, as produced by two compiler runtimes.
  const module = { exports: {} };
  vm.runInNewContext(patch ? reactRefreshLoader(source) : source, {
    module,
    exports: module.exports,
    process: { env: { NODE_ENV: 'development' } },
  });
  return module.exports;
}

it.each([false, true])(
  'updates a late remote on the existing renderer only with its registry available (patched: %s)',
  patch => {
    const host = runtime(patch);
    const globalObject: any = {};
    host.injectIntoGlobalHook(globalObject);
    const renderer = { scheduleRefresh: rs.fn(), setRefreshHandler: rs.fn() };
    const id = globalObject.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject(renderer);
    const remote = runtime(patch);
    remote.injectIntoGlobalHook(globalObject);
    const root = { current: { alternate: null } };
    globalObject.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot(id, root);
    function Before() {}
    function After() {}
    remote.register(Before, 'remote/Counter');
    remote.register(After, 'remote/Counter');
    remote.performReactRefresh();
    if (!patch) {
      expect(renderer.scheduleRefresh).not.toHaveBeenCalled();
      return;
    }
    expect(renderer.setRefreshHandler).toHaveBeenCalled();
    expect(renderer.scheduleRefresh).toHaveBeenCalledTimes(1);
    const [updatedRoot, update] = renderer.scheduleRefresh.mock.calls[0];
    expect(updatedRoot).toBe(root);
    expect(update.updatedFamilies.size).toBe(1);
    expect(
      update.updatedFamilies.has(remote.getFamilyByID('remote/Counter')),
    ).toBe(true);
    expect(update.staleFamilies.size).toBe(0);
  },
);

it('retains an existing DevTools hook and leaves non-Refresh exports alone', () => {
  const inject = rs.fn(() => 42);
  const hook = {
    renderers: new Map(),
    inject,
    onCommitFiberRoot() {},
    onCommitFiberUnmount() {},
  };
  const globalObject = { __REACT_DEVTOOLS_GLOBAL_HOOK__: hook };
  runtime().injectIntoGlobalHook(globalObject);
  const renderer = {};
  expect(hook.inject(renderer)).toBe(42);
  expect(inject).toHaveBeenCalledWith(renderer);
  expect(hook.renderers.get(42)).toBe(renderer);
  const module = { exports: {} };
  vm.runInNewContext(reactRefreshLoader(''), { module });
  expect(module.exports).toEqual({});
});

import { describe, expect, it, rstest } from '@rstest/core';
import type { Rspack } from '@rsbuild/core';
import type { StatsAssetResource } from '@module-federation/rsbuild-plugin/utils';
import { createDevBuildVersion } from './devManifest';

const resource = (version: string) =>
  ({
    manifest: {
      data: { metaData: { buildInfo: { buildVersion: version } } },
    },
    stats: {
      data: { metaData: { buildInfo: { buildVersion: version } } },
    },
  }) as StatsAssetResource;

function compiler() {
  const invalid: (() => void)[] = [];
  const compilation: ((value: object) => void)[] = [];
  return {
    hooks: {
      invalid: {
        tap: (_: unknown, callback: () => void) => invalid.push(callback),
      },
      thisCompilation: {
        tap: (_: unknown, callback: (value: object) => void) =>
          compilation.push(callback),
      },
    },
    watching: {
      invalidate: rstest.fn(() => invalid.forEach(callback => callback())),
    },
    build() {
      const stats = { compilation: {} };
      compilation.forEach(callback => callback(stats.compilation));
      return stats;
    },
  };
}

describe('development compilation identity', () => {
  it('rebuilds the other environment for a one-sided source edit without an invalidation loop', () => {
    const browser = compiler();
    const node = compiler();
    const identity = createDevBuildVersion();
    const onInvalid = rstest.fn();
    identity.attach(
      { compilers: [browser, node] } as unknown as Rspack.MultiCompiler,
      onInvalid,
    );
    const first = identity.current;
    const stats = { stats: [browser.build(), node.build()] };
    expect(identity.publish([resource(first), resource(first)], stats)).toBe(
      true,
    );
    expect(identity.isReadyFor(stats)).toBe(true);
    node.watching.invalidate();
    expect(identity.current).not.toBe(first);
    expect(identity.isReadyFor(stats)).toBe(false);
    expect(browser.watching.invalidate).toHaveBeenCalledTimes(1);
    expect(node.watching.invalidate).toHaveBeenCalledTimes(1);
    expect(onInvalid).toHaveBeenCalledTimes(1);
    const second = identity.current;
    browser.watching.invalidate();
    expect(identity.current).not.toBe(second);
    expect(onInvalid).toHaveBeenCalledTimes(2);
  });

  it('rejects mixed outputs and late stats even after a newer compilation is published', () => {
    const browser = compiler();
    const node = compiler();
    const identity = createDevBuildVersion();
    identity.attach(
      { compilers: [browser, node] } as unknown as Rspack.MultiCompiler,
      () => {},
    );
    const old = resource(identity.current);
    const oldStats = { stats: [browser.build(), node.build()] };
    browser.watching.invalidate();
    const current = resource(identity.current);
    const currentStats = { stats: [browser.build(), node.build()] };
    expect(identity.publish([current, old], currentStats)).toBe(false);
    expect(identity.publish([current, current], oldStats)).toBe(false);
    expect(identity.ready).toBe(false);
    expect(identity.publish([current, current], currentStats)).toBe(true);
    expect(identity.isReadyFor(oldStats)).toBe(false);
    expect(identity.isReadyFor(currentStats)).toBe(true);
    // Publication validates the compiler's ID. It never stamps a new asset hash.
    expect(current.manifest!.data.metaData.buildInfo.buildVersion).toBe(
      identity.current,
    );
    expect(old.manifest!.data.metaData.buildInfo.buildVersion).not.toBe(
      identity.current,
    );
    browser.watching.invalidate();
    expect(identity.ready).toBe(false);
    expect(identity.isReadyFor(currentStats)).toBe(false);
  });

  it('supports independent CSR-only consumers without an emitted manifest', () => {
    const first = createDevBuildVersion();
    const second = createDevBuildVersion();
    const source = compiler();
    first.attach(source as unknown as Rspack.Compiler, () => {});
    const stable = second.current;
    source.watching.invalidate();
    expect(second.current).toBe(stable);
    expect(first.current).not.toBe(stable);
    const stats = source.build();
    expect(first.publish([], stats)).toBe(true);
    expect(first.isReadyFor(stats)).toBe(true);
    expect(first.isReadyFor({})).toBe(false);
  });
});

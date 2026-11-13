import { describe, expect, it, rstest } from '@rstest/core';
import type { Rspack } from '@rsbuild/core';
import { createDevManifestPublication } from './devManifest';

rstest.mock('@module-federation/enhanced/rspack', () => ({
  setCompilationBuildVersion(
    compilation: { buildVersion?: string },
    value: string,
  ) {
    compilation.buildVersion = value;
  },
}));

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
      const stats = { compilation: { buildVersion: '' } };
      compilation.forEach(callback => callback(stats.compilation));
      return stats;
    },
  };
}

describe('development manifest publication', () => {
  it('withholds failed Node resources and publishes recovery without another compilation', () => {
    const source = compiler();
    const publication = createDevManifestPublication();
    publication.attach(source as unknown as Rspack.Compiler, () => {});
    publication.setSSRReady(false);
    const listener = rstest.fn();
    publication.subscribe(listener);
    const stats = source.build();
    publication.publish(stats);
    publication.notifyReady(stats, { buildVersion: 'a' });
    expect(listener).toHaveBeenLastCalledWith(undefined);
    publication.setSSRReady(true);
    expect(listener).toHaveBeenLastCalledWith({ buildVersion: 'a' });
    publication.setSSRReady(false);
    expect(listener).toHaveBeenLastCalledWith(undefined);
    source.watching.invalidate();
    publication.setSSRReady(true);
    expect(listener).toHaveBeenLastCalledWith(undefined);
  });

  it('notifies only after resource readiness, replays to late owners, and invalidates immediately', () => {
    const source = compiler();
    const publication = createDevManifestPublication();
    publication.attach(source as unknown as Rspack.Compiler, () => {});
    const listener = rstest.fn();
    const unsubscribe = publication.subscribe(listener);
    const stats = source.build();
    publication.publish(stats);
    expect(listener.mock.calls).toEqual([[undefined]]);
    publication.notifyReady(stats, { buildVersion: 'a' });
    const late = rstest.fn();
    publication.subscribe(late);
    expect(late).toHaveBeenLastCalledWith({ buildVersion: 'a' });
    source.watching.invalidate();
    expect(late).toHaveBeenLastCalledWith(undefined);
    expect(publication.notifyReady(stats, { buildVersion: 'a' })).toBe(false);
    unsubscribe();
    const next = source.build();
    publication.publish(next);
    publication.notifyReady(next, { buildVersion: 'b' });
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('coordinates both targets when only one target changes', () => {
    const browser = compiler();
    const node = compiler();
    const publication = createDevManifestPublication();
    const onInvalid = rstest.fn();
    publication.attach(
      { compilers: [browser, node] } as unknown as Rspack.MultiCompiler,
      onInvalid,
    );
    const browserStats = browser.build();
    const first = { stats: [browserStats, node.build()] };
    expect(publication.publish(first)).toBe(true);
    node.watching.invalidate();
    expect(publication.isReadyFor(first)).toBe(false);
    expect(publication.publish(first)).toBe(false);
    expect(browser.watching.invalidate).toHaveBeenCalledTimes(1);
    expect(onInvalid).toHaveBeenCalledTimes(1);
    const nodeStats = node.build();
    expect(publication.publish({ stats: [browserStats, nodeStats] })).toBe(
      false,
    );
    const second = { stats: [browser.build(), nodeStats] };
    expect(second.stats[0].compilation.buildVersion).toBe(
      nodeStats.compilation.buildVersion,
    );
    expect(nodeStats.compilation.buildVersion).not.toBe(
      browserStats.compilation.buildVersion,
    );
    expect(publication.publish(second)).toBe(true);
    expect(publication.isReadyFor(second)).toBe(true);
    expect(publication.isReadyFor(first)).toBe(false);
  });

  it('rejects a save during compilation and a late asynchronous publication', () => {
    const browser = compiler();
    const node = compiler();
    const publication = createDevManifestPublication();
    publication.attach(
      { compilers: [browser, node] } as unknown as Rspack.MultiCompiler,
      () => {},
    );
    const serverStats = node.build();
    const stale = { stats: [browser.build(), serverStats] };
    browser.watching.invalidate();
    expect(publication.publish(stale)).toBe(false);
    const latest = { stats: [browser.build(), node.build()] };
    expect(publication.publish(latest)).toBe(true);
    expect(publication.publish(stale)).toBe(false);
    expect(publication.isReadyFor(latest)).toBe(true);
    browser.watching.invalidate();
    expect(publication.ready).toBe(false);
  });

  it('keeps independent applications isolated and supports a single compiler', () => {
    const first = createDevManifestPublication();
    const second = createDevManifestPublication();
    const source = compiler();
    const peer = compiler();
    first.attach(source as unknown as Rspack.Compiler, () => {});
    second.attach(peer as unknown as Rspack.Compiler, () => {});
    const stats = source.build();
    const peerStats = peer.build();
    expect(first.publish(stats)).toBe(true);
    expect(second.publish(peerStats)).toBe(true);
    source.watching.invalidate();
    expect(first.ready).toBe(false);
    expect(second.isReadyFor(peerStats)).toBe(true);
    expect(first.publish(peerStats)).toBe(false);
    expect(first.isReadyFor({})).toBe(false);
  });
});

import { afterEach, expect, it } from '@rstest/core';
import type { ModuleFederation } from '@module-federation/enhanced/runtime';
import {
  collectSSRRuntimeGraph,
  collectSSRRemoteRegistrations,
  isSSRRuntimeReferenced,
  recordSSRRemoteSnapshot,
  getSSRRemoteSnapshot,
} from './ssrRuntimeGraph';

const previous = globalThis.__FEDERATION__;
afterEach(() => {
  globalThis.__FEDERATION__ = previous;
});
function runtime(name: string, version = 'v1') {
  return {
    name,
    options: { id: `${name}:${version}`, remotes: [] },
    moduleCache: new Map(),
    retainedProviders: new Set(),
  } as unknown as ModuleFederation & {
    retainedProviders: Set<ModuleFederation>;
  };
}
function register(consumer: ModuleFederation, name: string, entry: string) {
  consumer.options.remotes.push({ name, entry });
}
function load(consumer: ModuleFederation, provider: ModuleFederation) {
  consumer.moduleCache.set(provider.name, {
    remoteInfo: {
      name: provider.name,
      buildVersion: provider.options.id!.split(':')[1],
    },
  } as any);
}
function registry(...instances: ModuleFederation[]) {
  globalThis.__FEDERATION__ = { ...previous, __INSTANCES__: instances };
}
it('keeps a custom selected snapshot with the loaded Module and releases it on removal', () => {
  const consumer = runtime('A');
  const provider = runtime('B');
  registry(consumer, provider);
  load(consumer, provider);
  const selected = { buildVersion: 'v2', remoteEntry: 'entry.v2.js' } as any;
  recordSSRRemoteSnapshot(consumer, 'B', selected);
  expect(getSSRRemoteSnapshot(consumer, 'B')).toBe(selected);
  consumer.moduleCache.delete('B');
  expect(getSSRRemoteSnapshot(consumer, 'B')).toBeUndefined();
});
it('finds dynamically registered D and nested C only in the consuming application', () => {
  const a = runtime('A'),
    b = runtime('B'),
    c = runtime('C'),
    d = runtime('D');
  const standaloneB = runtime('B', 'v2');
  registry(a, b, c, d, standaloneB);
  register(a, 'B', 'http://localhost:4302/b/mf-manifest.json');
  load(a, b);
  register(b, 'C', 'http://localhost:4302/c/mf-manifest.json');
  load(b, c);
  expect([...collectSSRRuntimeGraph([a])]).toEqual([a, b, c]);
  register(a, 'D', 'http://localhost:4302/d/mf-manifest.json');
  expect(
    collectSSRRemoteRegistrations([a]).map(({ consumer, remote }) => [
      consumer.name,
      remote.name,
      remote.entry,
    ]),
  ).toEqual([
    ['A', 'B', 'http://localhost:4302/b/mf-manifest.json'],
    ['A', 'D', 'http://localhost:4302/d/mf-manifest.json'],
    ['B', 'C', 'http://localhost:4302/c/mf-manifest.json'],
  ]);
  load(a, d);
  expect(collectSSRRuntimeGraph([a]).has(d)).toBe(true);
  a.options.remotes = a.options.remotes.filter(remote => remote.name !== 'D');
  a.moduleCache.delete('D');
  expect(
    collectSSRRemoteRegistrations([a]).some(
      ({ remote }) => remote.name === 'D',
    ),
  ).toBe(false);
  expect(collectSSRRuntimeGraph([a]).has(standaloneB)).toBe(false);
});
it('preserves same-name registrations in different runtimes and terminates cycles', () => {
  const a = runtime('A'),
    b = runtime('B');
  registry(a, b);
  load(a, b);
  load(b, a);
  register(a, 'remote', 'http://localhost:4302/one/mf-manifest.json');
  register(b, 'remote', 'http://localhost:4302/two/mf-manifest.json');
  expect(
    collectSSRRemoteRegistrations([a]).map(({ remote }) => remote.entry),
  ).toEqual([
    'http://localhost:4302/one/mf-manifest.json',
    'http://localhost:4302/two/mf-manifest.json',
  ]);
});
it('includes detached retained descendants for disposal but not active dependency checks', () => {
  const a = runtime('A'),
    b = runtime('B'),
    c = runtime('C');
  registry(a);
  a.retainedProviders.add(b);
  b.retainedProviders.add(c);
  expect([...collectSSRRuntimeGraph([a])]).toEqual([a]);
  expect([...collectSSRRuntimeGraph([a], { includeRetained: true })]).toEqual([
    a,
    b,
    c,
  ]);
});

it('keeps a provider used by another Service scope and releases it after that scope detaches', () => {
  const first = runtime('service-scope-one'),
    second = runtime('service-scope-two'),
    provider = runtime('producer');
  registry(first, second, provider);
  load(first, provider);
  load(second, provider);
  const graph = collectSSRRuntimeGraph([first]);
  expect(isSSRRuntimeReferenced(provider, graph)).toBe(true);
  second.moduleCache.clear();
  expect(isSSRRuntimeReferenced(provider, graph)).toBe(false);
});

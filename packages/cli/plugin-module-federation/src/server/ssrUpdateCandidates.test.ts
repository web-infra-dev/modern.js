import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from '@rstest/core';
import { ModuleFederation } from '@module-federation/enhanced/runtime';
import {
  generateSnapshotFromManifest,
  type Manifest,
} from '@module-federation/sdk';
import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';
import ssrOwnership from '../cli/mfRuntimePlugins/ssr-ownership';
import { createBridgeServiceIngressMiddleware } from './service';
import {
  clearSSRUpdateCandidates,
  createSSRUpdateSnapshotPlugin,
  getSSRUpdateRegistration,
  setSSRUpdateCandidates,
} from './ssrUpdateCandidates';

const applications: string[] = [];
const disposals: Array<() => Promise<void>> = [];
afterEach(async () => {
  await Promise.all(disposals.splice(0).map(dispose => dispose()));
  for (const application of applications.splice(0))
    clearSSRUpdateCandidates(application);
});

function fixture() {
  const id = randomUUID().replaceAll('-', '');
  const application = `candidate_host_${id}`;
  const name = `candidate_remote_${id}`;
  const entry = 'https://producer.invalid/mf-manifest.json';
  applications.push(application);
  const manifest = (version: string): Manifest => ({
    id: name,
    name,
    metaData: {
      name,
      globalName: name,
      type: 'app',
      publicPath: `https://producer.invalid/${version}/`,
      ssrPublicPath: `https://producer.invalid/${version}/server/`,
      serviceBaseUrl: `https://producer.invalid/${version}/`,
      buildInfo: { buildVersion: version, buildName: name },
      remoteEntry: { name: 'browser.js', path: '', type: 'global' },
      ssrRemoteEntry: { name: 'node.js', path: '', type: 'commonjs-module' },
    },
    exposes: [
      {
        id: `${name}:App`,
        name: 'App',
        path: './App',
        render: 'bridge',
        servicePath: 'render',
        assets: { js: { sync: [], async: [] }, css: { sync: [], async: [] } },
      },
    ],
    shared: [],
    remotes: [],
  });
  // Represents a later network/global/platform selection of release C.
  const fallback: ModuleFederationRuntimePlugin = {
    name: `later-release-${id}`,
    loadSnapshot(args) {
      return {
        ...args,
        remoteSnapshot: generateSnapshotFromManifest(manifest('C'), {
          version: entry,
        }),
      };
    },
    loadRemoteSnapshot(args) {
      return {
        ...args,
        remoteSnapshot: generateSnapshotFromManifest(manifest('C'), {
          version: entry,
        }),
      };
    },
  };
  const host = (owner = application, registeredEntry = entry) => {
    const runtime = new ModuleFederation({
      name: owner,
      remotes: [{ name, alias: 'selected', entry: registeredEntry }],
      plugins: [fallback, ssrOwnership(), createSSRUpdateSnapshotPlugin(owner)],
      shareStrategy: 'loaded-first',
    });
    disposals.push(() => runtime.destroy());
    return runtime;
  };
  const selected = async (runtime: ModuleFederation) =>
    (
      await runtime.remoteHandler.getRemoteModuleAndOptions({
        id: 'selected/App',
      })
    ).remoteMatchInfo;
  return { application, name, entry, manifest, fallback, host, selected };
}

describe('application-owned SSR update candidates', () => {
  it('keeps captured B for the real Host runtime after later discovery selects C, including a rebuilt runtime', async () => {
    const f = fixture();
    const candidate = f.manifest('B');
    setSSRUpdateCandidates(f.application, [
      {
        name: f.name,
        entry: f.entry,
        moduleInfo: candidate as unknown as Record<string, unknown>,
      },
    ]);
    candidate.metaData.buildInfo.buildVersion = 'caller-mutation';
    const first = f.host();
    const selected = await f.selected(first);
    expect(selected.remoteSnapshot?.buildVersion).toBe('B');
    expect(selected.remoteInfo.entry).toBe(
      'https://producer.invalid/B/server/node.js',
    );
    selected.remoteSnapshot!.buildVersion = 'runtime-mutation';
    await first.destroy();
    const rebuilt = await f.selected(f.host());
    expect(rebuilt.remoteSnapshot?.buildVersion).toBe('B');
    expect(rebuilt.remoteInfo.entry).toBe(
      'https://producer.invalid/B/server/node.js',
    );
  });

  it('isolates applications, canonical remote names and registered entry URLs', async () => {
    const f = fixture();
    const other = `${f.application}_other`;
    applications.push(other);
    setSSRUpdateCandidates(f.application, [
      {
        name: f.name,
        entry: f.entry,
        moduleInfo: generateSnapshotFromManifest(f.manifest('B'), {
          version: f.entry,
        }) as unknown as Record<string, unknown>,
      },
    ]);
    setSSRUpdateCandidates(other, [
      {
        name: f.name,
        entry: f.entry,
        moduleInfo: f.manifest('A') as unknown as Record<string, unknown>,
      },
    ]);
    expect((await f.selected(f.host())).remoteSnapshot?.buildVersion).toBe('B');
    expect((await f.selected(f.host(other))).remoteSnapshot?.buildVersion).toBe(
      'A',
    );
    expect(
      (await f.selected(f.host(`${f.application}_unrelated`))).remoteSnapshot
        ?.buildVersion,
    ).toBe('C');
    const redirected = f.host();
    redirected.registerRemotes(
      [{ name: f.name, alias: 'selected', entry: `${f.entry}?different` }],
      { force: true },
    );
    expect((await f.selected(redirected)).remoteSnapshot?.buildVersion).toBe(
      'C',
    );
  });

  it('moves an independently scoped Service ingress from configured URL A to selected URL B and clears its snapshot for a legacy target', async () => {
    const f = fixture();
    const selectedEntry =
      'https://producer.invalid/releases/B/mf-manifest.json';
    const observedEntries: string[] = [];
    setSSRUpdateCandidates(f.application, [
      {
        name: f.name,
        entry: selectedEntry,
        moduleInfo: f.manifest('B') as unknown as Record<string, unknown>,
      },
    ]);
    const ingress = createBridgeServiceIngressMiddleware(
      {},
      {
        name: f.application,
        ownerId: f.application,
        remotes: [{ name: f.name, alias: 'selected', entry: f.entry }],
        plugins: [
          {
            ...f.fallback,
            loadSnapshot(args) {
              observedEntries.push(
                'entry' in args.moduleInfo ? args.moduleInfo.entry : '',
              );
              return f.fallback.loadSnapshot!(args);
            },
          },
        ],
      },
    );
    disposals.push(() => ingress.dispose());
    const invoke = () =>
      ingress(
        {
          get: () => undefined,
          req: {
            raw: new Request(
              'https://host.invalid/_modern/mf/service/selected%2FApp',
              {
                method: 'POST',
                headers: { origin: 'https://host.invalid' },
                body: JSON.stringify({
                  protocol: 'module-federation/bridge-ssr/producer/v1',
                  buildVersion: 'A',
                  request: {
                    instanceId: 'app',
                    identifierPrefix: 'app-',
                    moduleName: 'selected/App',
                    url: 'https://host.invalid/page',
                    props: {},
                  },
                }),
              },
            ),
          },
        },
        async () => {
          throw Error('Unexpected ingress fallthrough');
        },
      );
    const response = await invoke();
    expect(response?.status).toBe(409);
    expect(await response!.text()).toContain('buildVersion mismatch');
    expect(observedEntries).toEqual([selectedEntry]);
    await ingress.dispose();
    setSSRUpdateCandidates(f.application, [{ name: f.name, entry: f.entry }]);
    const latest = await invoke();
    expect(latest?.status).toBe(409);
    expect(await latest!.text()).toContain('buildVersion mismatch');
    expect(observedEntries).toEqual([selectedEntry, f.entry]);
  });

  it('restores all selected registrations after sequential remote updates, including direct entries without moduleInfo', () => {
    const f = fixture();
    const second = `${f.name}_second`;
    setSSRUpdateCandidates(f.application, [
      {
        name: f.name,
        entry: 'https://producer.invalid/B/entry.js',
        type: 'commonjs-module',
        entryGlobalName: 'selected-provider',
      },
    ]);
    setSSRUpdateCandidates(f.application, [
      {
        name: second,
        entry: 'https://second.invalid/C/entry.js',
        type: 'commonjs-module',
      },
    ]);
    const runtime = new ModuleFederation({
      name: f.application,
      remotes: [
        { name: f.name, alias: 'first', entry: f.entry },
        {
          name: second,
          alias: 'second',
          entry: 'https://second.invalid/A/entry.js',
        },
      ],
      plugins: [ssrOwnership(), createSSRUpdateSnapshotPlugin(f.application)],
      shareStrategy: 'loaded-first',
    });
    disposals.push(() => runtime.destroy());
    expect(runtime.options.remotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: f.name,
          alias: 'first',
          entry: 'https://producer.invalid/B/entry.js',
          type: 'commonjs-module',
          entryGlobalName: 'selected-provider',
        }),
        expect.objectContaining({
          name: second,
          alias: 'second',
          entry: 'https://second.invalid/C/entry.js',
          type: 'commonjs-module',
        }),
      ]),
    );
    const registration = getSSRUpdateRegistration(f.application, f.name)!;
    expect(registration).not.toHaveProperty('moduleInfo');
    registration.entry = 'https://unrelated.invalid/entry.js';
    expect(getSSRUpdateRegistration(f.application, f.name)?.entry).toBe(
      'https://producer.invalid/B/entry.js',
    );
  });

  it('rejects unresolved manifest pointers without partially publishing other candidates', async () => {
    const f = fixture();
    setSSRUpdateCandidates(f.application, [
      {
        name: f.name,
        entry: f.entry,
        moduleInfo: f.manifest('B') as unknown as Record<string, unknown>,
      },
    ]);
    expect(() =>
      setSSRUpdateCandidates(f.application, [
        {
          name: f.name,
          entry: f.entry,
          moduleInfo: f.manifest('C') as unknown as Record<string, unknown>,
        },
        {
          name: 'unresolved',
          entry: f.entry,
          moduleInfo: { remoteEntry: f.entry },
        },
      ]),
    ).toThrow('resolved provider Snapshot');
    expect((await f.selected(f.host())).remoteSnapshot?.buildVersion).toBe('B');
  });
});

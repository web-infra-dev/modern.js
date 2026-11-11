import { afterEach, describe, expect, it } from '@rstest/core';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { StatsAssetResource } from '@module-federation/rsbuild-plugin/utils';
import { hashDevAssets, stampDevManifest } from './devManifest';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map(directory => rm(directory, { recursive: true, force: true })),
  );
});
const assets = (files: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(files).map(([name, data]) => [name, { source: () => data }]),
  );
const resource = () =>
  ({
    manifest: {
      filename: 'mf-manifest.json',
      data: {
        name: 'weather',
        metaData: {
          buildInfo: { buildVersion: 'original' },
          serviceBaseUrl: 'https://weather.example/',
        },
        exposes: [],
      },
    },
    stats: {
      filename: 'mf-stats.json',
      data: { metaData: { buildInfo: { buildVersion: 'original' } } },
    },
  }) as unknown as StatsAssetResource;

describe('development publication identity', () => {
  it('tracks browser CSS and server code independently, ignoring hot-update bookkeeping', () => {
    const original = hashDevAssets(
      assets({ 'app.js': 'ui', 'app.css': 'red' }),
    );
    expect(
      hashDevAssets(
        assets({
          'app.css': 'red',
          'app.js': 'ui',
          '123.hot-update.js': 'different',
          'app.js.map': 'map',
        }),
      ),
    ).toBe(original);
    expect(
      hashDevAssets(assets({ 'app.js': 'ui', 'app.css': 'blue' })),
    ).not.toBe(original);
    expect(hashDevAssets(assets({ 'server.js': 'loader-v1' }))).not.toBe(
      hashDevAssets(assets({ 'server.js': 'loader-v2' })),
    );
  });

  it('publishes one stable identity for both manifests, including private plugin and metadata changes', async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), 'modern-mf-publication-'),
    );
    directories.push(directory);
    const options = {
      browser: resource(),
      node: resource(),
      hashes: { browser: 'browser', node: 'server-v1' },
      distDirectory: directory,
    };
    const first = await stampDevManifest(options);
    expect(await stampDevManifest(options)).toBe(first);
    expect(options.browser.manifest!.data.metaData.buildInfo.buildVersion).toBe(
      first,
    );
    expect(options.node.manifest!.data.metaData.buildInfo.buildVersion).toBe(
      first,
    );
    options.hashes.node = 'server-v2';
    const server = await stampDevManifest(options);
    expect(server).not.toBe(first);
    options.browser.manifest!.data.metaData.serviceBaseUrl =
      'https://next.example/';
    const metadata = await stampDevManifest(options);
    expect(metadata).not.toBe(server);
    const pluginDirectory = path.join(directory, 'server/mf-service-runtime');
    await mkdir(pluginDirectory, { recursive: true });
    await writeFile(
      path.join(pluginDirectory, 'index.cjs'),
      'module.exports = "plugin-v2"',
    );
    expect(await stampDevManifest(options)).not.toBe(metadata);
  });
});

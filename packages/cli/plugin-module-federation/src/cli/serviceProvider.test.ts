import { describe, expect, it } from '@rstest/core';
import type {
  Manifest,
  Stats,
  moduleFederationPlugin,
} from '@module-federation/sdk';
import { configureServiceProvider } from './serviceProvider';
import {
  addServiceProviderMetadata,
  serviceProviderBasePaths,
  serviceProviderRoutes,
} from '../serviceProvider';

const stats = () =>
  ({
    name: 'weather',
    metaData: { publicPath: 'https://cdn.example/assets/' },
    exposes: [
      { name: 'App', path: './App', render: 'bridge', isService: true },
      { name: 'Button', path: './Button', render: 'component' },
    ],
  }) as Stats;

describe('Service producer configuration', () => {
  it('publishes one origin and canonical base prefix, while serving every prefix', () => {
    const result = addServiceProviderMetadata(
      stats(),
      { origin: 'https://weather.example' },
      ['/new', '/old/'],
    );
    expect(result.metaData.publicPath).toBe('https://cdn.example/assets/');
    expect(result.metaData.serviceBaseUrl).toBe('https://weather.example/new/');
    expect(result.exposes[0].servicePath).toBe('_modern/mf/service/App');
    expect(result.exposes[1].servicePath).toBeUndefined();
    expect(
      serviceProviderRoutes(
        result as unknown as Manifest,
        serviceProviderBasePaths(['/new', '/old/']),
      ),
    ).toEqual([
      { path: '/new/_modern/mf/service/App', module: 'weather/App' },
      { path: '/old/_modern/mf/service/App', module: 'weather/App' },
    ]);
  });

  it('uses the same custom path for metadata and real routes', () => {
    const result = addServiceProviderMetadata(
      stats(),
      {
        origin: 'https://weather.example',
        paths: { './App': 'render/weather' },
        cache: { maxAgeMs: 500 },
      },
      '/apps',
    );
    expect(result.exposes[0].servicePath).toBe('render/weather');
    expect(
      serviceProviderRoutes(result as unknown as Manifest, ['/apps/']),
    ).toEqual([{ path: '/apps/render/weather', module: 'weather/App' }]);
    expect(JSON.stringify(result)).not.toContain('maxAgeMs');
  });

  it('requires an origin only for actual Service exposes and supports the resolved dev origin', () => {
    const ordinary = stats();
    ordinary.exposes = [ordinary.exposes[1]];
    expect(addServiceProviderMetadata(ordinary, undefined)).toBe(ordinary);
    expect(() => addServiceProviderMetadata(stats(), undefined)).toThrow(
      'serviceProvider.origin',
    );
    expect(
      addServiceProviderMetadata(
        stats(),
        undefined,
        undefined,
        'https://localhost:8123',
      ).metaData.serviceBaseUrl,
    ).toBe('https://localhost:8123/');
  });

  it('composes additionalData after defaults and routes its final metadata', async () => {
    const config: moduleFederationPlugin.ModuleFederationPluginOptions = {
      name: 'weather',
      manifest: {
        fileName: 'weather.json',
        async additionalData({ stats }) {
          expect(stats.exposes[0].servicePath).toBe('_modern/mf/service/App');
          return {
            ...stats,
            exposes: stats.exposes.map(expose =>
              expose.isService
                ? { ...expose, servicePath: 'custom/render' }
                : expose,
            ),
          };
        },
      },
    };
    configureServiceProvider(
      config,
      { origin: 'https://weather.example' },
      '/',
      () => undefined,
    );
    const manifestOptions =
      config.manifest as moduleFederationPlugin.PluginManifestOptions;
    const result = (await manifestOptions.additionalData!({
      stats: stats(),
    } as any)) as Stats;
    expect(manifestOptions.fileName).toBe('weather.json');
    expect(serviceProviderRoutes(result as unknown as Manifest, ['/'])).toEqual(
      [{ path: '/custom/render', module: 'weather/App' }],
    );
  });

  it('rejects invalid origins, paths, unknown exposes and ambiguous routes', () => {
    for (const origin of [
      'https://weather.example/path',
      'file:///tmp/weather',
      'https://user:secret@weather.example',
    ])
      expect(() => addServiceProviderMetadata(stats(), { origin })).toThrow();
    for (const route of [
      '',
      '/render',
      '../render',
      'render?x=1',
      'render/#x',
      '%2e%2e/app',
    ])
      expect(() =>
        addServiceProviderMetadata(stats(), {
          origin: 'https://weather.example',
          paths: { './App': route },
        }),
      ).toThrow();
    expect(() =>
      addServiceProviderMetadata(stats(), {
        origin: 'https://weather.example',
        paths: { './Missing': 'render' },
      }),
    ).toThrow('does not name an isService expose');
    const duplicate = stats();
    duplicate.exposes.push({
      ...duplicate.exposes[0],
      path: './Other',
      name: 'Other',
    });
    expect(() =>
      addServiceProviderMetadata(duplicate, {
        origin: 'https://weather.example',
        paths: { './App': 'render', './Other': 'render' },
      }),
    ).toThrow('Duplicate');
  });

  it('does not publish Service metadata when the producer has no Node build', async () => {
    const config: moduleFederationPlugin.ModuleFederationPluginOptions = {
      name: 'weather',
    };
    configureServiceProvider(
      config,
      { origin: 'https://weather.example' },
      '/',
      () => undefined,
      () => false,
    );
    const options =
      config.manifest as moduleFederationPlugin.PluginManifestOptions;
    await expect(
      options.additionalData!({ stats: stats() } as any),
    ).rejects.toThrow('Node provider build');
  });

  it('diagnoses invalid final Service metadata rather than silently omitting routes', () => {
    for (const servicePath of ['', undefined, '/absolute']) {
      const manifest = {
        ...stats(),
        exposes: [{ path: './App', servicePath }],
        metaData: { serviceBaseUrl: 'https://weather.example/' },
      } as unknown as Manifest;
      expect(() => serviceProviderRoutes(manifest, ['/'])).toThrow(
        'servicePath',
      );
    }
    const manifest = {
      ...stats(),
      exposes: [{ path: './App', servicePath: 'render' }],
    } as unknown as Manifest;
    expect(() => serviceProviderRoutes(manifest, ['/'])).toThrow(
      'serviceBaseUrl',
    );
  });
});

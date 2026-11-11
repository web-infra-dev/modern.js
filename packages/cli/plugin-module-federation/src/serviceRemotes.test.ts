import { describe, expect, it } from '@rstest/core';
import { serviceRemotes } from './serviceRemotes';

describe('Service ingress trusted remotes', () => {
  it('preserves aliases and scoped producer names separately from the manifest URL', () => {
    expect(
      serviceRemotes({
        weather:
          '@org/weather@https://cdn.example.test/@build/mf-manifest.json',
      }),
    ).toEqual([
      {
        name: '@org/weather',
        alias: 'weather',
        entry: 'https://cdn.example.test/@build/mf-manifest.json',
      },
    ]);
  });

  it('accepts direct URLs and object configuration in a remote array', () => {
    expect(
      serviceRemotes([
        { weather: 'https://cdn.example.test/weather/mf-manifest.json' },
        {
          dashboard: {
            external:
              'dashboard_remote@https://cdn.example.test/dashboard/mf-manifest.json',
          },
        },
      ]),
    ).toEqual([
      {
        name: 'weather',
        alias: 'weather',
        entry: 'https://cdn.example.test/weather/mf-manifest.json',
      },
      {
        name: 'dashboard_remote',
        alias: 'dashboard',
        entry: 'https://cdn.example.test/dashboard/mf-manifest.json',
      },
    ]);
  });

  it('keeps version-selected remotes available for a supplied Snapshot', () => {
    expect(serviceRemotes({ weather: 'weather_remote@1.2.3' })).toEqual([
      { name: 'weather_remote', alias: 'weather', version: '1.2.3' },
    ]);
  });

  it('does not execute expression externals and selects the first supported fallback', () => {
    expect(
      serviceRemotes({
        dynamic: 'promise new Promise(resolve => resolve(container))',
        weather: {
          external: [
            'promise Promise.resolve(container)',
            'weather_remote@https://cdn.example.test/mf-manifest.json',
            'other@https://other.example.test/mf-manifest.json',
          ],
        },
      }),
    ).toEqual([
      {
        name: 'weather_remote',
        alias: 'weather',
        entry: 'https://cdn.example.test/mf-manifest.json',
      },
    ]);
  });

  it('does not register a remote when none are configured', () => {
    expect(serviceRemotes()).toEqual([]);
  });
});

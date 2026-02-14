import forceRemotePublicPath from '../host/runtime/forceRemotePublicPath';

describe('host forceRemotePublicPath runtime plugin', () => {
  const originalFederation = (
    globalThis as typeof globalThis & { __FEDERATION__?: unknown }
  ).__FEDERATION__;

  afterEach(() => {
    if (typeof originalFederation === 'undefined') {
      delete (globalThis as typeof globalThis & { __FEDERATION__?: unknown })
        .__FEDERATION__;
      return;
    }

    (
      globalThis as typeof globalThis & {
        __FEDERATION__?: unknown;
      }
    ).__FEDERATION__ = originalFederation;
  });

  it('keeps plugin name stable', () => {
    const plugin = forceRemotePublicPath();
    expect(plugin.name).toBe('rsc-mf-force-remote-public-path');
    expect(typeof plugin.loadRemoteSnapshot).toBe('function');
  });

  it('does not mutate when remote alias and name are missing', () => {
    const plugin = forceRemotePublicPath();
    const args = {
      remoteInfo: {
        entry: 'http://127.0.0.1:3008/static/mf-manifest.json',
      },
      remoteSnapshot: {
        publicPath: 'http://example.com/',
      },
    };

    const result = plugin.loadRemoteSnapshot?.(args as any);
    expect(result).toBe(args);
    expect(args.remoteSnapshot.publicPath).toBe('http://example.com/');
  });

  it('supports remote names when alias is unavailable', () => {
    const plugin = forceRemotePublicPath();
    const args = {
      remoteInfo: {
        name: 'anotherRemote',
        entry: 'https://another-remote.example.com/static/mf-manifest.json',
      },
      remoteSnapshot: {
        publicPath: 'http://example.com/',
        metaData: {
          publicPath: 'http://example.com/',
          ssrPublicPath: 'http://example.com/bundles/',
        },
      },
    };

    const result = plugin.loadRemoteSnapshot?.(args as any);

    expect(result).toBe(args);
    expect(args.remoteSnapshot.publicPath).toBe(
      'https://another-remote.example.com/',
    );
    expect(args.remoteSnapshot.metaData.publicPath).toBe(
      'https://another-remote.example.com/',
    );
    expect(args.remoteSnapshot.metaData.ssrPublicPath).toBe(
      'https://another-remote.example.com/bundles/',
    );
  });

  it('does not mutate when entry is missing or non-string', () => {
    const plugin = forceRemotePublicPath();
    const argsWithoutEntry = {
      remoteInfo: {
        alias: 'rscRemote',
      },
      remoteSnapshot: {
        publicPath: 'http://example.com/',
      },
    };
    const argsWithNonStringEntry = {
      remoteInfo: {
        alias: 'rscRemote',
        entry: 1234,
      },
      remoteSnapshot: {
        publicPath: 'http://example.com/',
      },
    };

    plugin.loadRemoteSnapshot?.(argsWithoutEntry as any);
    plugin.loadRemoteSnapshot?.(argsWithNonStringEntry as any);

    expect(argsWithoutEntry.remoteSnapshot.publicPath).toBe(
      'http://example.com/',
    );
    expect(argsWithNonStringEntry.remoteSnapshot.publicPath).toBe(
      'http://example.com/',
    );
  });

  it('resolves remote public paths from __FEDERATION__ remotes when entry is missing', () => {
    (
      globalThis as typeof globalThis & {
        __FEDERATION__?: unknown;
      }
    ).__FEDERATION__ = {
      __INSTANCES__: [
        {
          options: {
            remotes: {
              rscRemote:
                'rscRemote@https://federation-runtime.example.com/static/mf-manifest.json',
            },
          },
        },
      ],
    } as any;
    const plugin = forceRemotePublicPath();
    const args = {
      remoteInfo: {
        alias: 'rscRemote',
      },
      remoteSnapshot: {
        publicPath: 'http://stale.example.com/',
        metaData: {
          publicPath: 'http://stale.example.com/',
          ssrPublicPath: 'http://stale.example.com/bundles/',
        },
      },
    };

    plugin.loadRemoteSnapshot?.(args as any);

    expect(args.remoteSnapshot.publicPath).toBe(
      'https://federation-runtime.example.com/',
    );
    expect(args.remoteSnapshot.metaData.publicPath).toBe(
      'https://federation-runtime.example.com/',
    );
    expect(args.remoteSnapshot.metaData.ssrPublicPath).toBe(
      'https://federation-runtime.example.com/bundles/',
    );
  });

  it('resolves remote public paths from __FEDERATION__ remotes array entries', () => {
    (
      globalThis as typeof globalThis & {
        __FEDERATION__?: unknown;
      }
    ).__FEDERATION__ = {
      __INSTANCES__: [
        {
          options: {
            remotes: [
              {
                alias: 'rscRemote',
                entry:
                  'https://federation-array.example.com/static/mf-manifest.json',
              },
            ],
          },
        },
      ],
    } as any;
    const plugin = forceRemotePublicPath();
    const args = {
      remoteInfo: {
        alias: 'rscRemote',
      },
      remoteSnapshot: {
        publicPath: 'http://stale.example.com/',
        metaData: {
          publicPath: 'http://stale.example.com/',
          ssrPublicPath: 'http://stale.example.com/bundles/',
        },
      },
    };

    plugin.loadRemoteSnapshot?.(args as any);

    expect(args.remoteSnapshot.publicPath).toBe(
      'https://federation-array.example.com/',
    );
    expect(args.remoteSnapshot.metaData.publicPath).toBe(
      'https://federation-array.example.com/',
    );
    expect(args.remoteSnapshot.metaData.ssrPublicPath).toBe(
      'https://federation-array.example.com/bundles/',
    );
  });

  it('resolves remote public paths from __FEDERATION__ module metadata fallback', () => {
    (
      globalThis as typeof globalThis & {
        __FEDERATION__?: unknown;
      }
    ).__FEDERATION__ = {
      moduleInfo: {
        rscRemote: {
          metaData: {
            publicPath:
              'https://federation-metadata.example.com/assets?cache=1#hash',
            ssrPublicPath:
              'https://federation-metadata.example.com/assets/bundles?cache=1#hash',
          },
        },
      },
    } as any;
    const plugin = forceRemotePublicPath();
    const args = {
      remoteInfo: {
        alias: 'rscRemote',
      },
      remoteSnapshot: {
        publicPath: 'http://stale.example.com/',
        metaData: {
          publicPath: 'http://stale.example.com/',
          ssrPublicPath: 'http://stale.example.com/bundles/',
        },
      },
    };

    plugin.loadRemoteSnapshot?.(args as any);

    expect(args.remoteSnapshot.publicPath).toBe(
      'https://federation-metadata.example.com/assets/',
    );
    expect(args.remoteSnapshot.metaData.publicPath).toBe(
      'https://federation-metadata.example.com/assets/',
    );
    expect(args.remoteSnapshot.metaData.ssrPublicPath).toBe(
      'https://federation-metadata.example.com/assets/bundles/',
    );
  });

  it('derives publicPath from __FEDERATION__ ssrPublicPath-only metadata', () => {
    (
      globalThis as typeof globalThis & {
        __FEDERATION__?: unknown;
      }
    ).__FEDERATION__ = {
      moduleInfo: {
        customModuleInfoKey: {
          alias: 'rscRemote',
          metaData: {
            ssrPublicPath:
              'https://federation-ssr-only.example.com/assets/bundles/?cache=1#hash',
          },
        },
      },
    } as any;
    const plugin = forceRemotePublicPath();
    const args = {
      remoteInfo: {
        alias: 'rscRemote',
      },
      remoteSnapshot: {
        publicPath: 'http://stale.example.com/',
        metaData: {
          publicPath: 'http://stale.example.com/',
          ssrPublicPath: 'http://stale.example.com/bundles/',
        },
      },
    };

    plugin.loadRemoteSnapshot?.(args as any);

    expect(args.remoteSnapshot.publicPath).toBe(
      'https://federation-ssr-only.example.com/assets/',
    );
    expect(args.remoteSnapshot.metaData.publicPath).toBe(
      'https://federation-ssr-only.example.com/assets/',
    );
    expect(args.remoteSnapshot.metaData.ssrPublicPath).toBe(
      'https://federation-ssr-only.example.com/assets/bundles/',
    );
  });

  it('does not mutate when entry is not a valid URL', () => {
    const plugin = forceRemotePublicPath();
    const args = {
      remoteInfo: {
        alias: 'rscRemote',
        entry: 'http://',
      },
      remoteSnapshot: {
        publicPath: 'http://example.com/static/',
        metaData: {
          publicPath: 'http://example.com/static/',
          ssrPublicPath: 'http://example.com/static/bundles/',
        },
      },
    };

    plugin.loadRemoteSnapshot?.(args as any);

    expect(args.remoteSnapshot.publicPath).toBe('http://example.com/static/');
    expect(args.remoteSnapshot.metaData.publicPath).toBe(
      'http://example.com/static/',
    );
    expect(args.remoteSnapshot.metaData.ssrPublicPath).toBe(
      'http://example.com/static/bundles/',
    );
  });

  it('forces origin-based public paths for rscRemote snapshots', () => {
    const plugin = forceRemotePublicPath();
    const args = {
      remoteInfo: {
        alias: 'rscRemote',
        entry: 'http://127.0.0.1:3008/static/mf-manifest.json',
      },
      remoteSnapshot: {
        publicPath: 'http://example.com/static/',
        metaData: {
          publicPath: 'http://example.com/static/',
          ssrPublicPath: 'http://example.com/static/bundles/',
        },
      },
    };

    const result = plugin.loadRemoteSnapshot?.(args as any);

    expect(result).toBe(args);
    expect(args.remoteSnapshot.publicPath).toBe('http://127.0.0.1:3008/');
    expect(args.remoteSnapshot.metaData.publicPath).toBe(
      'http://127.0.0.1:3008/',
    );
    expect(args.remoteSnapshot.metaData.ssrPublicPath).toBe(
      'http://127.0.0.1:3008/bundles/',
    );
  });

  it('normalizes entry URL query, hash, and default port in rewritten paths', () => {
    const plugin = forceRemotePublicPath();
    const args = {
      remoteInfo: {
        alias: 'rscRemote',
        entry:
          'https://remote.example.com:443/static/mf-manifest.json?cache=1#v',
      },
      remoteSnapshot: {
        publicPath: 'https://stale.example.com/static/',
        metaData: {
          publicPath: 'https://stale.example.com/static/',
          ssrPublicPath: 'https://stale.example.com/static/bundles/',
        },
      },
    };

    plugin.loadRemoteSnapshot?.(args as any);

    expect(args.remoteSnapshot.publicPath).toBe('https://remote.example.com/');
    expect(args.remoteSnapshot.metaData.publicPath).toBe(
      'https://remote.example.com/',
    );
    expect(args.remoteSnapshot.metaData.ssrPublicPath).toBe(
      'https://remote.example.com/bundles/',
    );
  });

  it('only updates snapshot fields that exist', () => {
    const plugin = forceRemotePublicPath();
    const args = {
      remoteInfo: {
        alias: 'rscRemote',
        entry: 'https://remote.example.com/static/mf-manifest.json',
      },
      remoteSnapshot: {
        metaData: {},
      },
    };

    plugin.loadRemoteSnapshot?.(args as any);

    expect('publicPath' in args.remoteSnapshot).toBe(false);
    expect(args.remoteSnapshot.metaData).toEqual({});
  });
});

import forceRemotePublicPath from '../host/runtime/forceRemotePublicPath';

describe('host forceRemotePublicPath runtime plugin', () => {
  it('keeps plugin name stable', () => {
    const plugin = forceRemotePublicPath();
    expect(plugin.name).toBe('rsc-mf-force-remote-public-path');
    expect(typeof plugin.loadRemoteSnapshot).toBe('function');
  });

  it('does not mutate non-target remotes', () => {
    const plugin = forceRemotePublicPath();
    const args = {
      remoteInfo: {
        alias: 'anotherRemote',
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

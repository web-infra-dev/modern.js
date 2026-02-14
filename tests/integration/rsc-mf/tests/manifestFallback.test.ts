import {
  type RemoteManifestShape,
  createManifestFallbackAssetUrl,
  getRequestedAssetDirectory,
  isExposeAssetRequestPath,
  resolveManifestFallbackAssetPath,
} from '../shared/manifestFallback';

describe('manifest fallback shared helpers', () => {
  it('identifies expose asset request paths', () => {
    expect(
      isExposeAssetRequestPath(
        '/static/js/async/__federation_expose_RemoteClientCounter.js',
      ),
    ).toBe(true);
    expect(
      isExposeAssetRequestPath(
        '/static/css/async/__federation_expose_RemoteClientCounter.css',
      ),
    ).toBe(true);
    expect(isExposeAssetRequestPath('/static/js/async/743.32436c1247.js')).toBe(
      false,
    );
  });

  it('derives requested async asset directory from pathname', () => {
    expect(
      getRequestedAssetDirectory(
        '/static/js/async/__federation_expose_RemoteClientCounter.js',
      ),
    ).toBe('static/js/async/');
    expect(
      getRequestedAssetDirectory(
        '/static/css/async/__federation_expose_RemoteClientCounter.css',
      ),
    ).toBe('static/css/async/');
  });

  it('resolves fallback assets from shared and exposes manifest entries', () => {
    const manifest: RemoteManifestShape = {
      shared: [
        {
          assets: {
            js: {
              sync: [
                'static/js/async/__federation_expose_actions.44d8f1d7ae.js',
              ],
              async: [],
            },
            css: {
              sync: [],
              async: [],
            },
          },
        },
      ],
      exposes: [
        {
          assets: {
            js: {
              sync: [
                'static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
              ],
              async: [],
            },
            css: {
              sync: [],
              async: [],
            },
          },
        },
      ],
    };

    expect(
      resolveManifestFallbackAssetPath(
        '/static/js/async/__federation_expose_RemoteClientCounter.js',
        manifest,
      ),
    ).toBe(
      'static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
    );
    expect(
      resolveManifestFallbackAssetPath(
        '/static/js/async/__federation_expose_actions.js',
        manifest,
      ),
    ).toBe('static/js/async/__federation_expose_actions.44d8f1d7ae.js');
  });

  it('supports absolute manifest assets and rejects non-matching paths', () => {
    const manifest: RemoteManifestShape = {
      shared: [
        {
          assets: {
            js: {
              sync: [
                'http://127.0.0.1:3999/static/js/async/__federation_expose_nestedActions.a8ce95b11a.js',
              ],
              async: [],
            },
            css: {
              sync: [],
              async: [],
            },
          },
        },
      ],
    };

    expect(
      resolveManifestFallbackAssetPath(
        '/static/js/async/__federation_expose_nestedActions.js',
        manifest,
      ),
    ).toBe(
      'http://127.0.0.1:3999/static/js/async/__federation_expose_nestedActions.a8ce95b11a.js',
    );
    expect(
      resolveManifestFallbackAssetPath(
        '/static/js/async/not-an-expose.js',
        manifest,
      ),
    ).toBeUndefined();
  });

  it('resolves stale hashed expose requests to current hashed assets', () => {
    const manifest: RemoteManifestShape = {
      exposes: [
        {
          assets: {
            js: {
              sync: [
                'static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
              ],
              async: [],
            },
            css: {
              sync: [],
              async: [],
            },
          },
        },
      ],
    };

    expect(
      resolveManifestFallbackAssetPath(
        '/static/js/async/__federation_expose_RemoteClientCounter.deadbeef12.js',
        manifest,
      ),
    ).toBe(
      'static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
    );
  });

  it('builds safe fallback URL and merges request query params', () => {
    expect(
      createManifestFallbackAssetUrl({
        remoteOrigin: 'http://127.0.0.1:3999',
        fallbackAssetPath:
          'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js?manifest=1',
        requestSearch: '?cache=1',
        requestedAssetDirectory: 'static/js/async/',
      }),
    ).toBe(
      'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js?manifest=1&cache=1',
    );
  });

  it('rejects unsafe fallback URLs', () => {
    expect(
      createManifestFallbackAssetUrl({
        remoteOrigin: 'not-a-valid-origin',
        fallbackAssetPath:
          'static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
        requestSearch: '',
        requestedAssetDirectory: 'static/js/async/',
      }),
    ).toBeUndefined();
    expect(
      createManifestFallbackAssetUrl({
        remoteOrigin: 'http://127.0.0.1:3999',
        fallbackAssetPath:
          'https://cdn.example.com/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
        requestSearch: '',
        requestedAssetDirectory: 'static/js/async/',
      }),
    ).toBeUndefined();
    expect(
      createManifestFallbackAssetUrl({
        remoteOrigin: 'http://127.0.0.1:3999',
        fallbackAssetPath:
          'static/js/async/../__federation_expose_RemoteClientCounter.7745fe5f0a.js',
        requestSearch: '',
        requestedAssetDirectory: 'static/js/async/',
      }),
    ).toBeUndefined();
    expect(
      createManifestFallbackAssetUrl({
        remoteOrigin: 'http://127.0.0.1:3999',
        fallbackAssetPath:
          'static/js/async/%2e%2e/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
        requestSearch: '',
        requestedAssetDirectory: 'static/js/async/',
      }),
    ).toBeUndefined();
    expect(
      createManifestFallbackAssetUrl({
        remoteOrigin: 'http://127.0.0.1:3999',
        fallbackAssetPath:
          'static/js/async/__federation_expose_RemoteClientCounter.js',
        requestSearch: '',
        requestedAssetDirectory: 'static/js/async/',
        requestUrl:
          'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteClientCounter.js',
      }),
    ).toBeUndefined();
  });
});

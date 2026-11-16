import { createDevAssetMatcher } from '../src/dev-tools/assetOwnership';

function compiler(publicPath: string) {
  let current!: (compilation: any) => void;
  let done!: (stats: any) => void;
  const value = {
    options: { output: { publicPath } },
    hooks: {
      thisCompilation: {
        tap: (_name: string, callback: typeof current) => {
          current = callback;
        },
      },
      done: {
        tap: (_name: string, callback: typeof done) => {
          done = callback;
        },
      },
    },
  };
  return {
    value: value as any,
    compile(names: string[], failed = false) {
      let expired = false;
      let processAssets!: () => void;
      const compilation = {
        hooks: {
          processAssets: {
            tap: (_options: unknown, callback: () => void) => {
              processAssets = callback;
            },
          },
        },
        getAssets: () => {
          if (expired) throw new Error('Native compilation has expired');
          return names.map(name => ({ name }));
        },
        getAsset: () => {
          throw new Error(
            'Native compilation must not be read by HTTP requests',
          );
        },
      };
      current(compilation);
      processAssets();
      done({ compilation, hasErrors: () => failed });
      expired = true;
    },
  };
}
it('recognizes actual emitted assets under their compiler publicPath while retaining HTML and business routes in admission', () => {
  const matcher = createDevAssetMatcher(() => '/fallback/');
  const client = compiler('https://cdn.test/assets/');
  const server = compiler('/');
  matcher.track({ compilers: [client.value, server.value] } as any);
  client.compile(['static/main.js', 'static/main.css', 'index.html']);
  server.compile(['mf-manifest.json', 'remoteEntry.js']);
  const isAsset = (path: string, method = 'GET') =>
    matcher.isAsset(new Request(`http://localhost${path}`, { method }));
  expect(isAsset('/assets/static/main.js')).toBe(true);
  expect(isAsset('/mf-manifest.json')).toBe(true);
  expect(isAsset('/static/main.js')).toBe(false);
  expect(isAsset('/assets/index.html')).toBe(false);
  expect(isAsset('/private.json')).toBe(false);
  expect(isAsset('/api/save.css')).toBe(false);
  expect(isAsset('/mf-manifest.json', 'POST')).toBe(false);
  client.compile(['new.js'], true);
  expect(isAsset('/assets/static/main.js')).toBe(true);
  expect(isAsset('/assets/new.js')).toBe(true);
});

it('replaces successful asset snapshots without retaining expired compilation objects', () => {
  const matcher = createDevAssetMatcher(() => '/');
  const child = compiler('auto');
  matcher.track(child.value);
  const asset = (name: string) =>
    matcher.isAsset(new Request(`http://localhost/${name}`));
  child.compile(['old.js']);
  expect(asset('old.js')).toBe(true);
  child.compile(['new.js']);
  expect(asset('old.js')).toBe(false);
  expect(asset('new.js')).toBe(true);
  child.compile(['failed.js'], true);
  expect(asset('new.js')).toBe(true);
  expect(asset('failed.js')).toBe(true);
  expect(asset('business.json')).toBe(false);
});

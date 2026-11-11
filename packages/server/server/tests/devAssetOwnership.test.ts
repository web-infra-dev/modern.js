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
      const compilation = {
        getAssets: () => names.map(name => ({ name })),
        getAsset: (name: string) =>
          names.includes(name) ? { name } : undefined,
      };
      current(compilation);
      done({ compilation, hasErrors: () => failed });
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

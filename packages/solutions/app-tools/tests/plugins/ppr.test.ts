import {
  deserializeConfig,
  serializeConfig,
} from '../../src/plugins/ppr/prerender';
import { getStaticPaths } from '../../src/plugins/ppr/routes';

describe('partial prerendering static paths', () => {
  test('collects index and leaf routes without route params', () => {
    const routes = [
      {
        path: '/',
        children: [
          { index: true },
          { path: 'about' },
          {
            path: 'docs',
            children: [{ index: true }, { path: 'intro' }],
          },
          { path: 'user', children: [{ path: ':id' }] },
          { path: 'files/*' },
          { path: 'blog/:slug?' },
          { path: 'settings', children: [{ path: 'profile' }] },
        ],
      },
    ];
    expect(getStaticPaths('/', routes).sort()).toEqual(
      ['/', '/about', '/docs', '/docs/intro', '/settings/profile'].sort(),
    );
  });

  test('prefixes the entry url path', () => {
    expect(
      getStaticPaths('/office', [{ path: '/', children: [{ path: 'ppt' }] }]),
    ).toEqual(['/office/ppt']);
    expect(getStaticPaths('/office', [{ path: '/' }])).toEqual(['/office']);
  });
});

describe('partial prerendering config handoff', () => {
  test('keeps data and regular expressions, drops functions and cycles', () => {
    const shared = { mode: 'ppr' };
    const plugin: Record<string, unknown> = { name: 'p', setup() {} };
    plugin.self = plugin;
    const config = {
      server: { ssr: shared, ssrByEntries: { a: shared } },
      output: { inlineScripts: /\.js$/i },
      plugins: [plugin],
    };
    const result = deserializeConfig(serializeConfig(config));
    expect(result.server).toEqual({
      ssr: { mode: 'ppr' },
      ssrByEntries: { a: { mode: 'ppr' } },
    });
    expect(result.output.inlineScripts).toEqual(/\.js$/i);
    expect(result.plugins).toEqual([{ name: 'p' }]);
  });
});

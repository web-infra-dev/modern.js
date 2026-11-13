import { compatibleRequire } from '@modern-js/utils';
import { createParamsResolver, generatePaths } from '../src/libs/params';

rstest.mock('@modern-js/utils', () => ({
  compatibleRequire: rstest.fn(),
  SERVER_BUNDLE_DIRECTORY: 'bundles',
}));

describe('SSG parameters', () => {
  it('expands complete nested parameter combinations and deduplicates URLs', () => {
    expect(
      generatePaths('/blog/:category/:slug', [
        { category: 'news', slug: 'hello' },
        { category: 'news', slug: 'hello' },
        { category: 'tech', slug: 'release.v1' },
      ]),
    ).toEqual(['/blog/news/hello', '/blog/tech/release.v1']);
  });

  it('encodes raw parameters once and preserves splat separators', () => {
    expect(
      generatePaths('/:slug', [
        { slug: '你好 ?#%' },
        { slug: 'a/b' },
        { slug: 'a\\b' },
        { slug: "!'()*" },
      ]),
    ).toEqual([
      '/%E4%BD%A0%E5%A5%BD%20%3F%23%25',
      '/a%2Fb',
      '/a%5Cb',
      '/%21%27%28%29%2A',
    ]);
    expect(generatePaths('/docs/*', [{ '*': 'a b/你好' }])).toEqual([
      '/docs/a%20b/%E4%BD%A0%E5%A5%BD',
    ]);
  });

  it('supports omitted optional parameters and empty splats', () => {
    expect(
      generatePaths('/:lang?/docs/:slug', [
        { slug: 'intro' },
        { lang: undefined, slug: 'intro' },
        { lang: 'en', slug: 'intro' },
      ]),
    ).toEqual(['/docs/intro', '/en/docs/intro']);
    expect(generatePaths('/docs/*', [{}, { '*': '' }])).toEqual(['/docs']);
    expect(generatePaths('/', [{}])).toEqual(['/']);
    expect(generatePaths('/:slug', [])).toEqual([]);
  });

  it.each([
    null,
    {},
    'hello',
    [null],
    ['hello'],
    [[]],
    [new Date()],
    Array(1),
    [{ slug: 1 }],
    [{ slug: null }],
    [{ slug: ['a', 'b'] }],
    [{ slug: 'hello', other: false }],
    [{}],
    [{ slug: '' }],
    [{ slug: '.' }],
    [{ slug: '..' }],
    [{ slug: '%2F' }],
    [{ slug: 'encoded%2fslash' }],
  ])('rejects invalid parameter results: %j', result => {
    expect(() => generatePaths('/:slug', result)).toThrow();
  });

  it.each(['../secret', 'a/./b', '/a', 'a/', 'a//b'])(
    'rejects unsafe or ambiguous splat segments: %s',
    value => {
      expect(() => generatePaths('/docs/*', [{ '*': value }])).toThrow();
    },
  );

  it('does not resolve required parameters from the prototype', () => {
    expect(() => generatePaths('/:constructor', [{}])).toThrow(
      'missing parameter "constructor"',
    );
  });
});

describe('compiled SSG parameter exports', () => {
  beforeEach(() => {
    rstest.mocked(compatibleRequire).mockReset();
  });

  const route = {
    id: 'blog-page',
    path: '/blog/:slug',
    ssgParams: '@_modern_js_src/routes/blog/[slug]/page.data',
  };

  it.each([false, true])(
    'loads the server bundle with async entry %s and executes each page once',
    async asyncEntry => {
      const first = rstest.fn(async () => [{ slug: 'hello' }]);
      const second = rstest.fn(() => [{ slug: 'another' }]);
      const bundle = {
        ssgParams: { 'blog-page': first, 'other-page': second },
      };
      const loadModules = rstest.fn(async () => bundle);
      rstest
        .mocked(compatibleRequire)
        .mockResolvedValue(asyncEntry ? { loadModules } : bundle);
      const resolve = createParamsResolver('/app/dist');
      expect(await resolve('main', route)).toEqual(['/blog/hello']);
      expect(await resolve('main', route)).toEqual(['/blog/hello']);
      expect(await resolve('main', { ...route, id: 'other-page' })).toEqual([
        '/blog/another',
      ]);
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
      expect(compatibleRequire).toHaveBeenCalledExactlyOnceWith(
        '/app/dist/bundles/main-server-loaders.js',
        false,
      );
      expect(loadModules).toHaveBeenCalledTimes(asyncEntry ? 1 : 0);
    },
  );

  it.each([
    { 'blog-page': 42 },
    { 'blog-page': () => undefined },
    { 'blog-page': () => [{ wrong: 'hello' }] },
    {
      'blog-page': async () => {
        throw new Error('CMS unavailable');
      },
    },
  ])(
    'reports the route and module for invalid or failed generators',
    async ssgParams => {
      rstest.mocked(compatibleRequire).mockResolvedValue({ ssgParams });
      await expect(
        createParamsResolver('/app/dist')('main', route),
      ).rejects.toThrow(
        'ssgParams failed for route "/blog/:slug" (@_modern_js_src/routes/blog/[slug]/page.data)',
      );
    },
  );

  it('isolates generators with the same route ID in different entries', async () => {
    rstest
      .mocked(compatibleRequire)
      .mockResolvedValueOnce({
        ssgParams: { 'blog-page': () => [{ slug: 'main' }] },
      })
      .mockResolvedValueOnce({
        ssgParams: { 'blog-page': () => [{ slug: 'admin' }] },
      });
    const resolve = createParamsResolver('/app/dist');
    expect(await resolve('main', route)).toEqual(['/blog/main']);
    expect(await resolve('admin', route)).toEqual(['/blog/admin']);
    expect(compatibleRequire).toHaveBeenCalledTimes(2);
  });

  it('preserves bundle loading failures with route context', async () => {
    rstest.mocked(compatibleRequire).mockImplementation(async () => {
      throw new Error('load failed');
    });
    await expect(
      createParamsResolver('/app/dist')('main', route),
    ).rejects.toThrow('load failed');
  });
});

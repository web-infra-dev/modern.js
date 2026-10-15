import { readFile } from 'fs/promises';
import { buildShellBeforeTemplate } from '../../src/core/server/stream/beforeTemplate';
import { LoadableCollector } from '../../src/core/server/string/loadable';
import type { ChunkSet } from '../../src/core/server/string/types';
import { readAssetWithCache } from '../../src/core/server/utils';

rstest.mock('fs/promises', () => {
  const readFile = rstest.fn();
  return { default: { readFile }, readFile };
});

const assets: Record<string, string> = {
  'page.js': 'console.log("page");',
  'page.css': '.page { color: red; }',
  'other.css': '.other { color: blue; }',
};

const getContent = (filepath: string) =>
  Object.entries(assets).find(([name]) => filepath.endsWith(`/${name}`))?.[1];

describe('inline assets', () => {
  const nodeEnv = process.env.NODE_ENV;
  const mockReadFile = rstest.mocked(readFile);

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    mockReadFile.mockReset();
    mockReadFile.mockImplementation((async (filepath: string) => {
      const content = getContent(filepath);
      if (content === undefined) {
        throw new Error(`ENOENT: ${filepath}`);
      }
      return content;
    }) as any);
  });

  afterEach(() => {
    process.env.NODE_ENV = nodeEnv;
  });

  const readCount = (name: string) =>
    mockReadFile.mock.calls.filter(([filepath]) =>
      String(filepath).endsWith(`/${name}`),
    ).length;

  it('should read each asset only once', async () => {
    const results = await Promise.all([
      readAssetWithCache('/dist/once/page.css'),
      readAssetWithCache('/dist/once/page.css'),
    ]);
    results.push(await readAssetWithCache('/dist/once/page.css'));

    expect(results).toEqual(Array(3).fill(assets['page.css']));
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalledWith('/dist/once/page.css', 'utf-8');

    await expect(readAssetWithCache('/dist/once/other.css')).resolves.toBe(
      assets['other.css'],
    );
    expect(mockReadFile).toHaveBeenCalledTimes(2);
  });

  it('should not cache a failed read', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('EMFILE'));

    await expect(readAssetWithCache('/dist/retry/page.css')).rejects.toThrow(
      'EMFILE',
    );
    await expect(readAssetWithCache('/dist/retry/page.css')).resolves.toBe(
      assets['page.css'],
    );
    await expect(readAssetWithCache('/dist/retry/page.css')).resolves.toBe(
      assets['page.css'],
    );
    expect(mockReadFile).toHaveBeenCalledTimes(2);
  });

  it('should inline the loadable assets of string SSR without reading them again', async () => {
    const stats = {
      publicPath: '/',
      outputPath: '/dist',
      chunks: [],
      namedChunkGroups: {
        main: { assets: ['static/js/main.js'], childAssets: {} },
        'async-main': {
          assets: [
            'static/js/async/page.js',
            'static/css/async/page.css',
            'static/css/async/other.css',
          ],
          childAssets: {},
        },
      },
    };

    const render = async () => {
      const chunkSet: ChunkSet = {
        renderLevel: 0,
        ssrScripts: '',
        jsChunk: '',
        cssChunk: '',
      };
      const collector = new LoadableCollector({
        stats,
        template: '<html><head></head><body></body></html>',
        entryName: 'main',
        chunkSet,
        config: {
          inlineStyles: true,
          inlineScripts: true,
          enableAsyncEntry: true,
        },
      });
      collector.collect(<div />);
      await collector.effect();
      return chunkSet;
    };

    for (let i = 0; i < 3; i++) {
      const { jsChunk, cssChunk } = await render();
      expect(jsChunk).toContain(`<script>${assets['page.js']}</script>`);
      expect(cssChunk).toBe(
        `<style>${assets['page.css']}</style><style>${assets['other.css']}</style>`,
      );
    }
    expect(readCount('page.js')).toBe(1);
    expect(readCount('page.css')).toBe(1);
    expect(readCount('other.css')).toBe(1);
  });

  it('should inline the route css of streaming SSR without reading it again', async () => {
    const runtimeContext = {
      routes: [
        {
          id: 'layout',
          path: '/',
          children: [{ id: 'stream/page', index: true }],
        },
      ],
      routerContext: { location: { pathname: '/' }, basename: '/' },
      routeManifest: {
        routeAssets: {
          'stream/page': {
            referenceCssAssets: [
              '/static/css/async/stream/page.css',
              '/static/css/async/stream/other.css',
            ],
          },
        },
      },
    } as any;

    for (let i = 0; i < 3; i++) {
      const html = await buildShellBeforeTemplate(
        '<html><head><!--<?- chunksMap.css ?>--></head><body>',
        {
          runtimeContext,
          entryName: 'main',
          config: { inlineStyles: true } as any,
        },
      );
      expect(html).toContain(
        `<style>${assets['page.css']}</style><style>${assets['other.css']}</style>`,
      );
    }
    expect(readCount('page.css')).toBe(1);
    expect(readCount('other.css')).toBe(1);
  });
});

import type { Rspack } from '@modern-js/builder';
import { HtmlAsyncChunkPlugin } from '../../src/builder/shared/bundlerPlugins/HtmlAsyncChunkPlugin';

type Tag = {
  tagName: string;
  voidTag: boolean;
  attributes: Record<string, string | boolean | null | undefined>;
  innerHTML?: string;
};

type Assets = { headTags: Tag[]; bodyTags: Tag[]; publicPath: string };
type HtmlCallback = (assets: Assets) => Assets;

function runHtmlHooks(
  assets: Assets,
  entryFiles: string[],
  processHtml: HtmlCallback = value => value,
) {
  const taps: { stage: number; callback: HtmlCallback }[] = [
    { stage: 0, callback: processHtml },
  ];
  const htmlPlugin = {
    getCompilationHooks: () => ({
      alterAssetTagGroups: {
        tap(options: { stage: number }, callback: HtmlCallback) {
          taps.push({ stage: options.stage, callback });
        },
      },
    }),
  };
  const compiler = {
    options: { optimization: { runtimeChunk: false } },
    hooks: {
      compilation: {
        tap(_name: string, callback: (compilation: unknown) => void) {
          callback({
            entrypoints: new Map(
              entryFiles.map(file => [
                file,
                { getRuntimeChunk: () => ({ files: new Set([file]) }) },
              ]),
            ),
          });
        },
      },
    },
  };
  new HtmlAsyncChunkPlugin(
    htmlPlugin as unknown as typeof Rspack.HtmlRspackPlugin,
  ).apply(compiler as unknown as Rspack.Compiler);
  return taps
    .sort((a, b) => a.stage - b.stage)
    .reduce((value, tap) => tap.callback(value), assets);
}

const script = (src: string): Tag => ({
  tagName: 'script',
  voidTag: false,
  attributes: { src, defer: true },
});

describe('HtmlAsyncChunkPlugin entry preloads', () => {
  it('moves multiple hashed entries and matches their final resource attributes', () => {
    const publicPath = 'https://cdn.example.com/assets/';
    const entryFiles = ['js/main.123.js', 'js/second.456.js'];
    const entries = entryFiles.map(file =>
      script(`${publicPath}${file}?build=1`),
    );
    const vendor = script(`${publicPath}js/vendor.js`);
    const resourceAttributes = {
      crossorigin: 'anonymous',
      integrity: 'sha384-example',
      referrerpolicy: 'no-referrer',
      fetchpriority: 'high',
      nonce: 'example-nonce',
    };
    const result = runHtmlHooks(
      { publicPath, headTags: [...entries, vendor], bodyTags: [] },
      entryFiles,
      assets => {
        for (const tag of assets.bodyTags) {
          Object.assign(tag.attributes, resourceAttributes);
        }
        return assets;
      },
    );

    expect(result.bodyTags).toEqual(entries);
    expect(result.headTags).toContain(vendor);
    expect(
      result.headTags
        .filter(tag => tag.tagName === 'link')
        .map(tag => tag.attributes),
    ).toEqual(
      entries.map(entry => ({
        rel: 'preload',
        as: 'script',
        href: entry.attributes.src,
        ...resourceAttributes,
      })),
    );
    for (const entry of entries) {
      expect(entry.attributes.async).toBe(true);
      expect(entry.attributes.defer).toBeUndefined();
    }
  });

  it('does not preload entries that HTML processing inlined', () => {
    const result = runHtmlHooks(
      { publicPath: '/', headTags: [script('/entry.js')], bodyTags: [] },
      ['entry.js'],
      assets => ({
        ...assets,
        bodyTags: assets.bodyTags.map(tag => ({
          ...tag,
          attributes: {},
          innerHTML: '/* inlined entry */',
        })),
      }),
    );
    expect(result.headTags).toEqual([]);
    expect(result.bodyTags[0].innerHTML).toBe('/* inlined entry */');
  });

  it('uses modulepreload for module entries', () => {
    const entry = script('/entry.mjs');
    entry.attributes = { src: '/entry.mjs', type: 'module' };
    const result = runHtmlHooks(
      { publicPath: '/', headTags: [entry], bodyTags: [] },
      ['entry.mjs'],
    );
    expect(result.headTags[0].attributes).toEqual({
      rel: 'modulepreload',
      href: '/entry.mjs',
    });
    expect(result.bodyTags).toEqual([entry]);
  });

  it('reuses an existing matching preload', () => {
    const preload: Tag = {
      tagName: 'link',
      voidTag: true,
      attributes: { rel: 'preload', as: 'script', href: '/entry.js' },
    };
    const result = runHtmlHooks(
      {
        publicPath: '/',
        headTags: [preload, script('/entry.js')],
        bodyTags: [],
      },
      ['entry.js'],
    );
    expect(result.headTags).toEqual([preload]);
  });

  it('recognizes URL-encoded entry filenames with a query and fragment', () => {
    const src = '/js/%E5%85%A5%E5%8F%A3%20name.js?build=1#fragment';
    const entry = script(src);
    const result = runHtmlHooks(
      { publicPath: '/', headTags: [entry], bodyTags: [] },
      ['js/入口 name.js'],
    );
    expect(result.bodyTags).toEqual([entry]);
    expect(result.headTags[0].attributes).toEqual({
      rel: 'preload',
      as: 'script',
      href: src,
    });
  });

  it.each(['crossorigin', 'integrity', 'referrerpolicy'])(
    'does not reuse an existing preload with an extra %s attribute',
    attribute => {
      const preload: Tag = {
        tagName: 'link',
        voidTag: true,
        attributes: {
          rel: 'preload',
          as: 'script',
          href: '/entry.js',
          [attribute]: attribute === 'crossorigin' ? 'anonymous' : 'example',
        },
      };
      const result = runHtmlHooks(
        {
          publicPath: '/',
          headTags: [preload, script('/entry.js')],
          bodyTags: [],
        },
        ['entry.js'],
      );
      expect(result.headTags).toHaveLength(2);
      expect(result.headTags[1].attributes).toEqual({
        rel: 'preload',
        as: 'script',
        href: '/entry.js',
      });
    },
  );
});

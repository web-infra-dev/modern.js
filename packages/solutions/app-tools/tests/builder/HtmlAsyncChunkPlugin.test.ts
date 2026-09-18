import { rstest } from '@rstest/core';
import { HtmlAsyncChunkPlugin } from '../../src/builder/shared/bundlerPlugins/HtmlAsyncChunkPlugin';

rstest.mock('@modern-js/builder', () => ({
  RUNTIME_CHUNK_REGEX: /builder-runtime([.].+)?\.js$/,
}));

type Tag = {
  tagName: string;
  attributes?: Record<string, unknown>;
};

const runAlterAssetTagGroups = (
  assets: {
    headTags: Tag[];
    bodyTags: Tag[];
  },
  isStreamingSSR = false,
) => {
  let alterAssetTagGroups:
    | ((value: typeof assets) => typeof assets)
    | undefined;

  const htmlPlugin = {
    getCompilationHooks: () => ({
      alterAssetTagGroups: {
        tap: (_name: string, callback: typeof alterAssetTagGroups) => {
          alterAssetTagGroups = callback;
        },
      },
    }),
  };
  const compiler = {
    hooks: {
      compilation: {
        tap: (_name: string, callback: (compilation: object) => void) => {
          callback({});
        },
      },
    },
  };

  new HtmlAsyncChunkPlugin(htmlPlugin as any, isStreamingSSR).apply(compiler);
  return alterAssetTagGroups?.(assets);
};

describe('HtmlAsyncChunkPlugin', () => {
  it('keeps deferred scripts deferred for streaming SSR', () => {
    const result = runAlterAssetTagGroups(
      {
        headTags: [
          {
            tagName: 'script',
            attributes: { defer: true, src: '/static/js/main.js' },
          },
        ],
        bodyTags: [],
      },
      true,
    );

    expect(result?.headTags[0].attributes).toEqual({
      defer: true,
      src: '/static/js/main.js',
    });
  });

  it('converts deferred scripts to async outside streaming SSR', () => {
    const result = runAlterAssetTagGroups({
      headTags: [
        {
          tagName: 'script',
          attributes: { defer: true, src: '/static/js/main.js' },
        },
      ],
      bodyTags: [],
    });

    expect(result?.headTags[0].attributes).toEqual({
      async: true,
      src: '/static/js/main.js',
    });
  });

  it('still moves the runtime chunk to the body for streaming SSR', () => {
    const result = runAlterAssetTagGroups(
      {
        headTags: [
          {
            tagName: 'script',
            attributes: { defer: true, src: '/builder-runtime.js' },
          },
          { tagName: 'link', attributes: { rel: 'stylesheet' } },
        ],
        bodyTags: [],
      },
      true,
    );

    expect(result?.headTags).toEqual([
      { tagName: 'link', attributes: { rel: 'stylesheet' } },
    ]);
    expect(result?.bodyTags).toEqual([
      {
        tagName: 'script',
        attributes: { defer: true, src: '/builder-runtime.js' },
      },
    ]);
  });
});

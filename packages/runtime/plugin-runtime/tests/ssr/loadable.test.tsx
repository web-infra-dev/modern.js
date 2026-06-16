import React from 'react';
import { toHtml } from '../../src/ssr/serverRender/loadable';

const cssHref = '/static/css/async/about/page.css';
let mockChunkAssets: Array<{ url: string }>;

jest.mock('@loadable/server', () => ({
  ChunkExtractor: jest.fn().mockImplementation(() => ({
    chunks: ['async-about-page'],
    collectChunks: (jsx: React.ReactElement) => jsx,
    getScriptTags: () => '',
    getChunkAssets: () => mockChunkAssets,
  })),
}));

describe('loadable SSR renderer', () => {
  beforeEach(() => {
    mockChunkAssets = [{ url: cssHref }];
  });

  it('should still inject stylesheet when the same css is prefetched', () => {
    const renderer = {
      stats: {},
      entryName: 'main',
      host: 'modernjs.com',
      config: {},
      result: {
        chunksMap: {
          js: '',
          css: `<link href="${cssHref}" rel="prefetch">`,
        },
      },
    };

    const html = toHtml(
      <div>content</div>,
      renderer as any,
      () => '<div>content</div>',
    );

    expect(html).toBe('<div>content</div>');
    expect(renderer.result.chunksMap.css).toContain(
      `<link href="${cssHref}" rel="prefetch">`,
    );
    expect(renderer.result.chunksMap.css).toContain(
      `<link href="${cssHref}" rel="stylesheet" />`,
    );
  });
});

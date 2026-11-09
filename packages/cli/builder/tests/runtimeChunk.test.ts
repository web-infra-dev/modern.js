import { describe, expect, it } from '@rstest/core';
import {
  RUNTIME_CHUNK_INLINE_LIMIT,
  shouldInlineRuntimeChunk,
} from '../src/plugins/runtimeChunk';

describe('shouldInlineRuntimeChunk', () => {
  it('inlines a small runtime chunk', () => {
    expect(
      shouldInlineRuntimeChunk({
        name: 'static/js/builder-runtime.1a2b3c.js',
        size: 4 * 1024,
      }),
    ).toBe(true);
  });

  it('keeps a runtime chunk above the limit as a cacheable file', () => {
    expect(
      shouldInlineRuntimeChunk({
        name: 'static/js/builder-runtime.1a2b3c.js',
        size: RUNTIME_CHUNK_INLINE_LIMIT + 1,
      }),
    ).toBe(false);
  });

  it('never inlines other chunks', () => {
    expect(
      shouldInlineRuntimeChunk({ name: 'static/js/main.1a2b3c.js', size: 100 }),
    ).toBe(false);
  });
});

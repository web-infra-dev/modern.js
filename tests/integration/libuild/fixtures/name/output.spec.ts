import path from 'path';
import assert from 'assert';
import fs from 'fs';
import { getLibuilderTest } from '@/toolkit';

describe('output', () => {
  it('chunkname', async () => {
    const bundler = await getLibuilderTest({
      root: path.resolve(__dirname),
      input: {
        main: './index.ts',
        other: './other.ts',
      },
      splitting: true,
      entryNames: 'entry/[name]',
      chunkNames: 'chunk/[name]',
    });
    await bundler.build();
    assert(fs.existsSync(path.resolve(__dirname, 'dist/chunk/chunk.js')), 'chunk should exits in dist/chunk');
    assert(fs.existsSync(path.resolve(__dirname, 'dist/entry/main.js')), 'entry should exits in dist/entry');
    assert(fs.existsSync(path.resolve(__dirname, 'dist/entry/other.js')), 'entry should exits in dist/entry');
  });
});

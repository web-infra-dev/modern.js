import path from 'path';
import fs from 'fs';
import assert from 'assert';
import { getLibuilderTest } from '@/toolkit';

describe('platform', () => {
  it('node', async () => {
    const bundler = await getLibuilderTest({
      root: path.resolve(__dirname, ''),
      input: {
        node: './node.ts',
      },
      platform: 'node',
    });
    await bundler.build();
    const content = fs.readFileSync(path.resolve(__dirname, './dist/node.js'));
    assert(content.includes('http'));
  });
  it('browser', async () => {
    const bundler = await getLibuilderTest({
      root: path.resolve(__dirname, ''),
      input: {
        browser: './browser.ts',
      },
      platform: 'browser',
    });
    await bundler.build();
    const content = fs.readFileSync(path.resolve(__dirname, './dist/browser.js'));
    assert(content.includes('xhr'));
  });
});

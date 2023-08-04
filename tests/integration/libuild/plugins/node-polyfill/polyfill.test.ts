import { expect, getLibuilderTest } from '@/toolkit';
import { nodePolyfillPlugin } from '@modern-js/libuild-plugin-node-polyfill';
import path from 'path';

describe('polyfill', function main() {
  this.timeout(20000);
  it('api', async () => {
    const bundler = await getLibuilderTest({
      root: path.resolve(__dirname, ''),
      platform: 'browser',
      plugins: [nodePolyfillPlugin({})],
    });
    await bundler.build();
    const jsChunk = Object.values(bundler.getJSOutput());
    expect(jsChunk.length === 1).to.true;
    // expect(jsChunk[0].contents.includes('.pnpm/assert@2.0.0')).to.true;
  });
});
